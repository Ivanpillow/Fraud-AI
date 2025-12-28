from datetime import datetime
from app.models.transaction import Transaction
from app.models.fraud_prediction import FraudPrediction
from app.queries.transaction_queries import create_transaction
from app.queries.prediction_queries import save_prediction
from app.ml.fraud_model import predict_fraud
from app.services.user_behavior_service import update_user_behavior

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

    # Actualizar features del usuario
    update_user_behavior(
        db=db,
        user_id=tx_data["user_id"],
        amount=tx_data["amount"],
        avg_amount_user=tx_data["avg_amount_user"]
    )

    # Features que se van a usar para ML
    features = {
        "amount": tx_data["amount"],
        "hour": tx_data["hour"],
        "day_of_week": tx_data["day_of_week"],
        "transactions_last_24h": tx_data["transactions_last_24h"],
        "avg_amount_user": tx_data["avg_amount_user"],
        "amount_vs_avg": tx_data["amount_vs_avg"],
        "failed_attempts": tx_data["failed_attempts"],
        "risk_score_rule": tx_data["risk_score_rule"],
        "is_international": tx_data["is_international"],
        "merchant_category": tx_data["merchant_category"]
    }

    # Predicción
    prediction, prob = predict_fraud(features)

    fraud_pred = FraudPrediction(
        transaction_id=transaction.transaction_id,
        model_version="v1",
        fraud_probability=prob,
        prediction_label=prediction,
        risk_score_rule=tx_data["risk_score_rule"],
        decision="block" if prob > 0.8 else "allow"
    )

    save_prediction(db, fraud_pred)

    return {
        "transaction_id": transaction.transaction_id,
        "fraud_probability": prob,
        "decision": fraud_pred.decision
    }