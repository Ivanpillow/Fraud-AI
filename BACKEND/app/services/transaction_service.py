from datetime import datetime, timezone
from app.models.transaction import Transaction
from app.models.fraud_prediction import FraudPrediction
from app.queries.transaction_queries import create_transaction # Se quito esta funcion y la de save para que no se guardaran si ocurria algún error en el proceso, ahora se maneja todo con flush y commit al final
from app.queries.prediction_queries import save_prediction
from app.ml.predictors.fraud_ensemble import predict_fraud_combined
from app.services.user_behavior_service import update_user_behavior, update_user_avg_amount
from app.ml.utils.explainability import explain_transaction
from app.queries.fraud_explanation_queries import save_explanations

from app.services.user_behavior_service import (
    get_user_stats,
    calculate_amount_vs_avg,
    calculate_risk_score_rule,
)

def process_transaction(db, tx_data):

    try:

        # Guardar transacción sin commit para evitar inconsistencias si algo falla después
        transaction = Transaction(
            transaction_id=tx_data["transaction_id"],
            user_id=tx_data["user_id"],
            merchant_id=1,
            amount=tx_data["amount"],
            currency="MXN",
            timestamp=datetime.now(timezone.utc),
            hour=tx_data["hour"],
            day_of_week=tx_data["day_of_week"],
            country=tx_data["country"],
            is_international=tx_data["is_international"],
            device_type=tx_data["device_type"],
        )

        db.add(transaction)
        db.flush()  # NO commit para que no se guarde hasta el final

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
            "hour": tx_data["hour"],
            "day_of_week": tx_data["day_of_week"],
            "failed_attempts": user_stats["failed_attempts"],
            "is_international": tx_data["is_international"],
        }

        # Blindaje contra valores que pudieran ser None
        for k, v in features.items():
            if v is None:
                features[k] = 0

        # Predicción de Random Forest + Logistic Regression + KMeans
        result = predict_fraud_combined(features)
        prediction = result["label"]
        prob = result["final_score"]

        # Decisión
        block_threshold = 0.90 if is_new_user else 0.75

        if prob >= block_threshold:
            decision = "block"
        elif prob >= 0.45:
            decision = "review"
        else:
            decision = "allow"

        if is_new_user and decision == "block":
            decision = "review"

        # Guardar predicción
        fraud_pred = FraudPrediction(
            transaction_id=transaction.transaction_id,
            channel="card",
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

        # Actualizar promedio usuario
        if decision != "block":
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

        # Commit final después de todo el proceso para asegurar atomicidad
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


def process_transaction_simple(db, tx_data):
    try:

        now = datetime.now(timezone.utc)

        hour = tx_data.get("hour") or now.hour
        day_of_week = tx_data.get("day_of_week") or now.weekday()

        user_stats = get_user_stats(db, tx_data["user_id"])

        amount_vs_avg = calculate_amount_vs_avg(
            amount=tx_data["amount"],
            avg_amount_user=user_stats["avg_amount_user"]
        )

        is_international = tx_data["country"] != "MX"

        # risk_score_rule = calculate_risk_score_rule(
        #     amount_vs_avg=amount_vs_avg,
        #     transactions_last_24h=user_stats["transactions_last_24h"],
        #     failed_attempts=user_stats["failed_attempts"],
        #     is_international=is_international,
        #     hour=hour,
        #     channel="card",
        #     card_tx_last_24h=user_stats["card_tx_last_24h"],
        #     qr_tx_last_24h=user_stats["qr_tx_last_24h"]
        # )

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

        return process_transaction(db, full_tx)
    except Exception as e:
        db.rollback()
        raise e