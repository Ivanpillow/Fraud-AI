from datetime import datetime, timezone
from app.models.qr_transaction import QRTransaction
from app.models.fraud_prediction import FraudPrediction
from app.ml.predictors.fraud_ensemble import predict_fraud_combined
from app.services.user_behavior_service import (
    get_user_stats,
    update_user_behavior,
    update_user_avg_amount,
    calculate_amount_vs_avg,
    calculate_risk_score_rule_qr,
)
from app.ml.utils.explainability import explain_transaction
from app.queries.fraud_explanation_queries import save_explanations


def _validate_qr_inputs(tx_data: dict) -> None:
    if float(tx_data["amount"]) <= 0:
        raise ValueError("El monto debe ser mayor a 0")

    if int(tx_data["user_id"]) <= 0:
        raise ValueError("El user_id debe ser mayor a 0")

    if int(tx_data["merchant_id"]) <= 0:
        raise ValueError("El merchant_id debe ser mayor a 0")

    lat = float(tx_data["latitude"])
    lon = float(tx_data["longitude"])

    if lat < -90 or lat > 90:
        raise ValueError("La latitud debe estar entre -90 y 90")
    if lon < -180 or lon > 180:
        raise ValueError("La longitud debe estar entre -180 y 180")

    country = str(tx_data["country"] or "").strip().upper()
    if len(country) != 2:
        raise ValueError("El país debe ser un código ISO de 2 letras")


def _decide_qr_action(prob: float, is_new_user: bool, features: dict, risk_score_rule: float) -> str:
    block_threshold = 0.90 if is_new_user else 0.80
    review_threshold = 0.55

    if prob >= block_threshold:
        if features["amount_vs_avg"] < 1.2 and features["failed_attempts"] == 0:
            decision = "review"
        else:
            decision = "block"
    elif prob >= review_threshold:
        decision = "review"
    else:
        decision = "allow"

    # Filtro adicional para QR: si las reglas heurísticas son muy altas,
    # no permitir que una probabilidad moderada pase como "allow".
    if risk_score_rule >= 0.80:
        decision = "block"
    elif risk_score_rule >= 0.65 and prob >= 0.40:
        decision = "block"
    elif risk_score_rule >= 0.50 and decision == "allow":
        decision = "review"

    # Patrón crítico: múltiples señales fuertes en la misma transacción.
    if (
        features["failed_attempts"] >= 3
        and features["amount_vs_avg"] >= 2.0
        and (features["is_international"] or features["transactions_last_24h"] == 0)
    ):
        decision = "block"

    # Estabilidad: evita bloqueos en perfiles claramente benignos.
    if decision == "block":
        if (
            features["amount_vs_avg"] < 1.0
            and features["failed_attempts"] == 0
            and features["transactions_last_24h"] <= 10
            and risk_score_rule < 0.50
        ):
            decision = "review"

    return decision

def process_qr_transaction(db, tx_data, merchant_id):
    try:
        _validate_qr_inputs(tx_data)

        # Obtener user stats antes de guardar para tener datos consistentes
        user_stats = get_user_stats(db, tx_data["user_id"])
        is_new_user = user_stats["transactions_last_24h"] < 3
        country = str(tx_data["country"]).upper().strip()

        # nuevo transaction_id
        transaction_id = int(datetime.utcnow().timestamp() * 1_000_000) # ID único basado en timestamp para evitar colisiones

        # Guardar QR sin commit para evitar inconsistencias si algo falla después
        qr_tx = QRTransaction(
            transaction_id=transaction_id,
            user_id=tx_data["user_id"],
            merchant_id=merchant_id,
            amount=tx_data["amount"],
            country=country,
            latitude=tx_data.get("latitude"),
            longitude=tx_data.get("longitude"),
            hour=tx_data["hour"],
            day_of_week=tx_data["day_of_week"],
            device_change_flag=tx_data.get("device_change_flag", False),
            qr_scans_last_24h=user_stats["qr_tx_last_24h"],
            failed_attempts=user_stats["failed_attempts"],
        )

        db.add(qr_tx)
        db.flush()

        # Feature Engineering para QR
        amount_vs_avg = calculate_amount_vs_avg(
            amount=tx_data["amount"],
            avg_amount_user=user_stats["avg_amount_user"]
        )

        is_international = country != "MX"

        risk_score_rule = calculate_risk_score_rule_qr(
            amount_vs_avg=amount_vs_avg,
            qr_scans_last_24h=user_stats["qr_tx_last_24h"],
            device_change_flag=bool(tx_data.get("device_change_flag", False)),
            failed_attempts=user_stats["failed_attempts"],
            is_international=is_international,
            transactions_last_24h=user_stats["transactions_last_24h"],
            geo_distance=0.0,
        )

        # Features para ML
        features = {
            "amount": tx_data["amount"],
            "amount_vs_avg": amount_vs_avg,
            "transactions_last_24h": user_stats["transactions_last_24h"],
            "card_tx_last_24h": user_stats["card_tx_last_24h"],
            "qr_tx_last_24h": user_stats["qr_tx_last_24h"],
            "hour": tx_data["hour"],
            "day_of_week": tx_data["day_of_week"],
            "failed_attempts": user_stats["failed_attempts"],
            "is_international": is_international,
        }

        # Limitar valores extremos para evitar problemas con el modelo 
        features["transactions_last_24h"] = min(features["transactions_last_24h"], 10)
        features["card_tx_last_24h"] = min(features["card_tx_last_24h"], 10)
        features["qr_tx_last_24h"] = min(features["qr_tx_last_24h"], 10)

        # Blindaje contra valores que pudieran ser None
        for k, v in features.items():
            if v is None:
                features[k] = 0

        # Predicción de Random Forest + Logistic Regression + KMeans
        result = predict_fraud_combined(features)
        prob = result["final_score"]
        prediction = result["label"]

        decision = _decide_qr_action(
            prob=prob,
            is_new_user=is_new_user,
            features=features,
            risk_score_rule=risk_score_rule,
        )

        # Guardar predicción
        fraud_pred = FraudPrediction(
            transaction_id=qr_tx.transaction_id,
            merchant_id=merchant_id,
            channel="qr",
            model_version="RF_LG_v1",
            fraud_probability=prob,
            prediction_label=prediction,
            decision=decision,
            rf_probability=result["rf_probability"],
            logistic_probability=result["logistic_probability"],
            kmeans_score=result["kmeans_score"]
        )

        db.add(fraud_pred)
        db.flush()

        # Explainability 
        explanations = None

        if prob >= 0.30:
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

        # Actualizaciones usuario (solo si no se bloquea, para no actualizar con comportamientos fraudulentos)
        update_user_behavior(
            db=db,
            user_id=tx_data["user_id"],
            amount=tx_data["amount"],
            avg_amount_user=user_stats["avg_amount_user"],
            channel="qr"
        )

        if decision != "block":
            update_user_avg_amount(
                db=db,
                user_id=tx_data["user_id"],
                amount=tx_data["amount"]
            )
        # Commit final
        db.commit()

        # Respuesta detallada 
        return {
            "transaction_id": qr_tx.transaction_id,
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




def process_qr_transaction_simple(db, tx_data, merchant_id):
    try:
        now = datetime.now(timezone.utc)
        country = str(tx_data.get("country") or "").strip().upper()

        hour = tx_data.get("hour") or now.hour
        day_of_week = tx_data.get("day_of_week") or now.weekday()

        full_tx = {
            **tx_data,
            "country": country,
            "hour": hour,
            "day_of_week": day_of_week,
            "device_change_flag": tx_data.get("device_change_flag", False) # Se asume que si no viene el flag, es false.
        }


        return process_qr_transaction(db, full_tx, merchant_id)

    except Exception as e:
        db.rollback()
        raise e
