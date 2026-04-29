from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from sqlalchemy import func
from app.models.transaction import Transaction
from app.models.fraud_prediction import FraudPrediction
from app.models.user import User
from app.ml.predictors.fraud_ensemble import predict_fraud_combined
from app.services.user_behavior_service import (
    update_user_behavior,
    update_user_avg_amount,
    update_failed_attempts,
)
from app.ml.utils.explainability import explain_transaction
from app.queries.fraud_explanation_queries import save_explanations
from app.services.transaction_detail_service import save_user_transaction_details

from app.services.user_behavior_service import (
    get_user_stats,
    calculate_amount_vs_avg,
    calculate_risk_score_rule,
)

MEXICO_CITY_TZ = ZoneInfo("America/Mexico_City")


def _ensure_user_exists_by_id(db, tx_data: dict) -> None:
    user_id = int(tx_data["user_id"])
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        return

    country = str(tx_data.get("country") or "MX").upper()[:5]
    amount = float(tx_data.get("amount") or 0.0)

    db.add(
        User(
            user_id=user_id,
            country=country,
            avg_amount_user=round(max(amount, 0.0), 2),
            risk_profile="medium",
        )
    )
    db.flush()


def _resolve_user_for_transaction(db, tx_data: dict) -> None:
    """
    Asigna tx_data['user_id'] antes de persistir la transacción.
    Checkout: mismo PAN -> mismo user_id e historial; PAN nuevo -> nuevo registro en users.
    Endpoint completo (TransactionCreate): sigue usando user_id explícito.
    """
    card_digits = tx_data.get("card_number")
    if card_digits:
        digits = "".join(c for c in str(card_digits) if c.isdigit())
        if len(digits) < 13 or len(digits) > 19:
            raise ValueError("Número de tarjeta inválido")

        # Comparar por PAN normalizado (solo dígitos) para coincidir con filas guardadas con espacios/guiones.
        pan_norm = func.regexp_replace(func.coalesce(User.card_number, ""), "[^0-9]", "", "g")
        existing = (
            db.query(User)
            .filter(User.card_number.isnot(None))
            .filter(pan_norm == digits)
            .first()
        )
        if existing:
            tx_data["user_id"] = int(existing.user_id)
            return

        country = str(tx_data.get("country") or "MX").upper()[:5]
        amount = float(tx_data.get("amount") or 0.0)
        max_id = db.query(func.max(User.user_id)).scalar()
        new_id = int(max_id or 0) + 1

        db.add(
            User(
                user_id=new_id,
                card_number=digits,
                country=country,
                avg_amount_user=round(max(amount, 0.0), 2),
                risk_profile="medium",
            )
        )
        db.flush()
        tx_data["user_id"] = new_id
        return

    if tx_data.get("user_id") is None:
        raise ValueError("Se requiere user_id o card_number")

    _ensure_user_exists_by_id(db, tx_data)


def _evaluate_allow_confidence(
    decision: str,
    prob: float,
    decision_score: float,
    risk_score_rule: float,
    features: dict,
    is_new_user: bool
) -> tuple[str | None, bool]:
    """
    Evalúa la confianza de un ALLOW para determinar si se finaliza automáticamente o requiere revisión.
    
    Retorna: (final_decision, reviewed)
    - ('allow', True): Auto-finalizar con confianza alta
    - (None, False): Requiere revisión humana (incertidumbre)
    - (None, False): Para review/block, nunca se auto-finaliza
    """
    
    if decision != "allow":
        return None, False
    
    # Criterios de confianza para auto-finalizar
    # 1. Probabilidad de fraude baja (bajo riesgo)
    prob_is_safe = prob < 0.35
    
    # 2. Usuario establecido (no es nuevo)
    user_is_established = not is_new_user  # transactions_last_24h >= 3
    
    # 3. Monto normal (cercano al promedio)
    amount_is_normal = float(features["amount_vs_avg"]) < 1.5
    
    # 4. Sin intentos fallidos recientes
    no_failed_attempts = int(features["failed_attempts"]) == 0
    
    # 5. Risk score bajo (reglas heurísticas tranquilas)
    risk_score_is_low = risk_score_rule < 0.40
    
    # 6. Transacción nacional o en horario normal
    is_domestic = not bool(features["is_international"])
    normal_hour = int(features["hour"]) >= 6 and int(features["hour"]) <= 23
    geo_friendly = is_domestic or normal_hour
    
    # Contador de factores seguros
    confidence_factors = 0
    if prob_is_safe:
        confidence_factors += 1
    if user_is_established:
        confidence_factors += 1
    if amount_is_normal:
        confidence_factors += 1
    if no_failed_attempts:
        confidence_factors += 1
    if risk_score_is_low:
        confidence_factors += 1
    if geo_friendly:
        confidence_factors += 1
    
    # Lógica híbrida:
    # - Si >= 5 factores seguros: auto-finalizar (confianza alta)
    # - Si 3-4 factores: requiere revisión (zona gris)
    # - Si < 3 factores: requiere revisión (incertidumbre)
    
    if confidence_factors >= 5:
        return "allow", True
    else:
        # Requiere intervención humana
        return None, False


def _score_card_decision(features: dict, model_result: dict, is_new_user: bool) -> tuple[str, float, float]:
    stacked_prob = float(model_result["final_score"])
    logistic_prob = float(model_result["logistic_probability"])
    rf_prob = float(model_result["rf_probability"])

    risk_rule = calculate_risk_score_rule(
        amount_vs_avg=float(features["amount_vs_avg"]),
        transactions_last_24h=int(features["transactions_last_24h"]),
        failed_attempts=int(features["failed_attempts"]),
        is_international=bool(features["is_international"]),
        hour=int(features["hour"]),
        channel="card",
        card_tx_last_24h=int(features["card_tx_last_24h"]),
        qr_tx_last_24h=int(features["qr_tx_last_24h"]),
    )

    
    decision_score = (0.45 * stacked_prob) + (0.40 * logistic_prob) + (0.15 * rf_prob)

    # Para reducir falsos allow en zonas grises.
    if risk_rule >= 0.55:
        decision_score += 0.08
    elif risk_rule >= 0.40:
        decision_score += 0.04

    if int(features["failed_attempts"]) >= 2:
        decision_score += 0.04
    if float(features["amount_vs_avg"]) >= 2.2:
        decision_score += 0.04

    decision_score = max(0.0, min(decision_score, 1.0))

    block_threshold = 0.80 if is_new_user else 0.76
    review_threshold = 0.50

    if decision_score >= block_threshold:
        decision = "block"
    elif decision_score >= review_threshold:
        decision = "review"
    else:
        decision = "allow"

    # Reglas de negocio para reducir falsos bloqueos en casos de borderline
    if (
        decision == "block"
        and float(features["amount_vs_avg"]) < 1.25
        and int(features["failed_attempts"]) == 0
        and int(features["transactions_last_24h"]) <= 6
        and not bool(features["is_international"])
    ):
        decision = "review"

    return decision, round(risk_rule, 4), round(decision_score, 4)

def process_transaction(db, tx_data, merchant_id):

    try:
        _resolve_user_for_transaction(db, tx_data)

        tx_hour = int(tx_data["hour"]) % 24
        tx_day_of_week = int(tx_data["day_of_week"])
        if tx_day_of_week < 1 or tx_day_of_week > 7:
            tx_day_of_week = ((tx_day_of_week - 1) % 7) + 1

        model_day_of_week = (tx_day_of_week - 1) % 7

        #nueva transaction_id
        transaction_id = int(datetime.utcnow().timestamp() * 1_000_000) # ID único basado en timestamp para evitar colisiones

        # Guardar transacción sin commit para evitar inconsistencias si algo falla después
        transaction = Transaction(
            transaction_id=transaction_id,
            user_id=tx_data["user_id"],
            merchant_id=merchant_id,    
            amount=tx_data["amount"],
            currency="MXN",
            timestamp=datetime.now(timezone.utc),
            hour=tx_hour,
            day_of_week=tx_day_of_week,
            country=tx_data["country"],
            is_international=tx_data["is_international"],
            device_type=tx_data["device_type"],
        )

        db.add(transaction)
        db.flush()  # NO commit para que no se guarde hasta el final
        save_user_transaction_details(db, tx_data, transaction.transaction_id, tx_data["user_id"], "card")

        # Obtener comportamiento usuario
        user_stats = get_user_stats(db, tx_data["user_id"])
        is_new_user = user_stats["transactions_last_24h"] < 3

        # Features ML
        features = {
            "amount": tx_data["amount"],
            "amount_vs_avg": tx_data["amount_vs_avg"],
            "transactions_last_24h": user_stats["transactions_last_24h"],
            "card_tx_last_24h": user_stats["card_tx_last_24h"],
            "qr_tx_last_24h": user_stats["qr_tx_last_24h"],
            "hour": tx_hour,
            "day_of_week": model_day_of_week,
            "failed_attempts": user_stats["failed_attempts"],
            "is_international": tx_data["is_international"],
        }

        # Limitar valores extremos
        features["transactions_last_24h"] = min(features["transactions_last_24h"], 10)
        features["card_tx_last_24h"] = min(features["card_tx_last_24h"], 10)
        features["qr_tx_last_24h"] = min(features["qr_tx_last_24h"], 10)

        # Evitar valores None
        for k, v in features.items():
            if v is None:
                features[k] = 0

        # print("USER_STATS:", user_stats)
        # print("FEATURES:", features)

        # Random Forest + Logistic Regression + KMeans
        result = predict_fraud_combined(features)
        prediction = result["label"]
        prob = result["final_score"]

        decision, risk_score_rule, decision_score = _score_card_decision(features, result, is_new_user)

        # Evaluación de confianza para ALLOW: determinar si se auto-finaliza o requiere revisión
        final_decision, reviewed = _evaluate_allow_confidence(
            decision=decision,
            prob=prob,
            decision_score=decision_score,
            risk_score_rule=risk_score_rule,
            features=features,
            is_new_user=is_new_user
        )

        # Guardar predicción
        fraud_pred = FraudPrediction(
            transaction_id=transaction.transaction_id,
            merchant_id=merchant_id,
            channel="card",
            model_version="RF_LG_v1_logit_boost",
            fraud_probability=prob,
            prediction_label=prediction,
            risk_score_rule=risk_score_rule,
            decision=decision,
            final_decision=final_decision,
            reviewed=reviewed,
            rf_probability=result["rf_probability"],
            logistic_probability=result["logistic_probability"],
            kmeans_score=result["kmeans_score"]
        )

        db.add(fraud_pred)
        db.flush()

        # Actualizar promedio usuario: solo cuando la transacción fue aprobada (allow).
        if decision == "allow":
            update_user_avg_amount(
                db=db,
                user_id=tx_data["user_id"],
                amount=tx_data["amount"]
            )

        # Actualizar comportamiento
        update_user_behavior(
            db=db,
            user_id=tx_data["user_id"],
            amount=tx_data["amount"],
            avg_amount_user=user_stats["avg_amount_user"],
            channel="card"
        )

        # Explainability
        explanations = None

        if max(prob, decision_score) >= 0.30:
            logistic_features = {
                "amount": features["amount"],
                "amount_vs_avg": features["amount_vs_avg"],
                "transactions_last_24h": features["transactions_last_24h"],
                "card_tx_last_24h": features["card_tx_last_24h"],
                "qr_tx_last_24h": features["qr_tx_last_24h"],
                "hour": features["hour"],
                "day_of_week": features["day_of_week"],
                "failed_attempts": features["failed_attempts"],
                "is_international": features["is_international"],
            }

            explanations = explain_transaction(logistic_features)

            if explanations:
                save_explanations(
                    db=db,
                    prediction_id=fraud_pred.prediction_id,
                    explanations=explanations
                )

        if fraud_pred.decision != decision:
            fraud_pred.decision = decision


        update_failed_attempts(
            db=db,
            user_id=tx_data["user_id"],
            decision=decision,
        )
        

        db.commit()
        return {
            "transaction_id": transaction.transaction_id,
            "fraud_probability": prob,
            "decision": decision,
            "model_scores": {
                "random_forest": round(result["rf_probability"], 4),
                "logistic_regression": round(result["logistic_probability"], 4),
                "kmeans_anomaly": round(result["kmeans_score"], 4)
            },
            "explanations": explanations
        }
    
    except Exception as e:
        db.rollback()
        raise e


def process_transaction_simple(db, tx_data, merchant_id):
    try:
        _resolve_user_for_transaction(db, tx_data)

        now = datetime.now(MEXICO_CITY_TZ)

        hour_raw = tx_data.get("hour")
        day_of_week_raw = tx_data.get("day_of_week")

        hour = now.hour if hour_raw is None else int(hour_raw)
        day_of_week = now.isoweekday() if day_of_week_raw is None else int(day_of_week_raw)

        hour = hour % 24
        if day_of_week < 1 or day_of_week > 7:
            day_of_week = ((day_of_week - 1) % 7) + 1

        user_stats = get_user_stats(db, tx_data["user_id"])

        amount_vs_avg = calculate_amount_vs_avg(
            amount=tx_data["amount"],
            avg_amount_user=user_stats["avg_amount_user"]
        )
        
        print("Country:", tx_data["country"])
        is_international = tx_data["country"].upper() != "MX"


        full_tx = {
            **tx_data,
            "hour": hour,
            "day_of_week": day_of_week,
            "transactions_last_24h": user_stats["transactions_last_24h"],
            "avg_amount_user": user_stats["avg_amount_user"],
            "amount_vs_avg": amount_vs_avg,
            "failed_attempts": user_stats["failed_attempts"],
            "is_international": is_international
        }

        return process_transaction(db, full_tx, merchant_id)
    except Exception as e:
        db.rollback()
        raise e