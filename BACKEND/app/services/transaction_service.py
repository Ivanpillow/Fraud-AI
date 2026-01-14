from datetime import datetime
from app.models.transaction import Transaction
from app.models.fraud_prediction import FraudPrediction
from app.queries.transaction_queries import create_transaction
from app.queries.prediction_queries import save_prediction
from app.ml.predictors.fraud_ensemble import predict_fraud_combined
from app.services.user_behavior_service import update_user_behavior
from app.ml.utils.explainability import explain_transaction
from app.queries.fraud_explanation_queries import save_explanations

from app.services.user_behavior_service import (
    get_user_stats,
    calculate_amount_vs_avg,
    calculate_risk_score_rule,
)

def process_transaction(db, tx_data):

    # Guardar transacción
    transaction = Transaction(
        transaction_id=tx_data["transaction_id"],
        user_id=tx_data["user_id"],
        merchant_id=1,                # id de merchant por mientras
        amount=tx_data["amount"],
        currency="MXN",                # moneda fija por mientras
        timestamp=datetime.utcnow(),   # timestamp actual
        hour=tx_data["hour"],
        day_of_week=tx_data["day_of_week"],
        country=tx_data["country"],
        is_international=tx_data["is_international"],
        device_type=tx_data["device_type"],
    )

    create_transaction(db, transaction)


    # Features que se van a usar para ML
    features = {
        "amount": tx_data["amount"],
        "amount_vs_avg": tx_data["amount_vs_avg"],
        "transactions_last_24h": tx_data["transactions_last_24h"],
        "hour": tx_data["hour"],
        "day_of_week": tx_data["day_of_week"],
        "failed_attempts": tx_data["failed_attempts"],
        "is_international": tx_data["is_international"],
        "risk_score_rule": tx_data["risk_score_rule"],
    }

    # Predicción
    result = predict_fraud_combined(features)

    prediction = result["label"]
    prob = result["final_score"]
 
    if prob >= 0.8:
        decision = "block"
    elif prob >= 0.45: 
        decision = "review"
    else:
        decision = "allow"

    fraud_pred = FraudPrediction(
        transaction_id=transaction.transaction_id,
        model_version="RF_LG_v1",
        fraud_probability=prob,
        prediction_label=prediction,
        risk_score_rule=tx_data["risk_score_rule"],
        decision=decision
    )

    save_prediction(db, fraud_pred)

    # Actualizar comportamiento del usuario DESPUÉS de la transacción
    update_user_behavior(
        db=db,
        user_id=tx_data["user_id"],
        amount=tx_data["amount"],
        avg_amount_user=tx_data["avg_amount_user"]
    )

    explanations = None
 
    if prob >= 0.45:   # 0.45 para que explique tanto en review como block
        logistic_features = {
            "amount_vs_avg": features["amount_vs_avg"],
            "transactions_last_24h": features["transactions_last_24h"],
            "hour": features["hour"],
            "day_of_week": features["day_of_week"],
            "failed_attempts": features["failed_attempts"],
            "is_international": features["is_international"],
            "risk_score_rule": features["risk_score_rule"],
        }

        explanations = explain_transaction(logistic_features)

    # Guardar explicaciones SHAP si existen
    if explanations:
        save_explanations(
            db=db,
            prediction_id=fraud_pred.prediction_id,
            explanations=explanations
        )

    return {
        "transaction_id": transaction.transaction_id,
        "fraud_probability": prob,
        "decision": fraud_pred.decision,
        "explanations": explanations
    }





def process_transaction_simple(db, tx_data):

    now = datetime.utcnow()

    hour = tx_data.get("hour", now.hour)
    day_of_week = tx_data.get("day_of_week", now.weekday())

    # Obtener historial del usuario
    user_stats = get_user_stats(db, tx_data["user_id"])

    transactions_last_24h = user_stats["transactions_last_24h"]
    avg_amount_user = user_stats["avg_amount_user"]
    failed_attempts = user_stats["failed_attempts"]

    # Calcular amount_vs_avg
    amount_vs_avg = calculate_amount_vs_avg(
        amount=tx_data["amount"],
        avg_amount_user=avg_amount_user
    )

    # Determinar si es internacional
    is_international = tx_data["country"] != "MX"

    # Calcular risk_score_rule
    risk_score_rule = calculate_risk_score_rule(
        amount_vs_avg=amount_vs_avg,
        transactions_last_24h=transactions_last_24h,
        failed_attempts=failed_attempts,
        is_international=is_international,
        hour=hour
    )

    # Construir payload COMPLETO (interno)
    full_tx = {
        **tx_data,
        "hour": hour,
        "day_of_week": day_of_week,
        "transactions_last_24h": transactions_last_24h,
        "avg_amount_user": avg_amount_user,
        "amount_vs_avg": amount_vs_avg,
        "failed_attempts": failed_attempts,
        "is_international": is_international,
        "risk_score_rule": risk_score_rule
    }

    return process_transaction(db, full_tx)