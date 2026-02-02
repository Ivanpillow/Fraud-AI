from datetime import datetime, timezone
from app.models.qr_transaction import QRTransaction
from app.models.fraud_prediction import FraudPrediction
from app.queries.transaction_queries import create_qr_transaction
from app.queries.prediction_queries import save_prediction
from app.ml.predictors.fraud_ensemble import predict_fraud_combined
from app.services.user_behavior_service import (
    get_user_stats,
    update_user_behavior,
    update_user_avg_amount,
    calculate_amount_vs_avg,
    calculate_risk_score_rule_qr,
)
from app.ml.utils.qr_feature_engineering import build_qr_features
from app.ml.utils.explainability import explain_transaction
from app.queries.fraud_explanation_queries import save_explanations


def process_qr_transaction(db, tx_data):
    # Guardar QR
    qr_tx = QRTransaction(
        transaction_id=tx_data["transaction_id"],
        user_id=tx_data["user_id"],
        merchant_id=tx_data["merchant_id"],
        amount=tx_data["amount"],
        country=tx_data["country"],
        latitude=tx_data["latitude"],
        longitude=tx_data["longitude"],
        hour=tx_data["hour"],
        day_of_week=tx_data["day_of_week"],
        device_change_flag=tx_data["device_change_flag"],
        qr_scans_last_24h=tx_data["qr_scans_last_24h"],
        failed_attempts=tx_data["failed_attempts"],
    )

    create_qr_transaction(db, qr_tx)

    user_stats = get_user_stats(db, tx_data["user_id"])

    features = build_qr_features(
        tx=tx_data,
        user_stats=user_stats
    )

    result = predict_fraud_combined(features)
    prob = result["final_score"]
    prediction = result["label"]

    is_new_user = user_stats["transactions_last_24h"] < 3

    block_threshold = 0.95 if is_new_user else 0.8

    if prob >= block_threshold:
        decision = "block"
    elif prob >= 0.45:
        decision = "review"
    else:
        decision = "allow"

    if is_new_user and decision == "block":
        decision = "review"

    # Guardar predicción (igual que en transacciones normales)
    fraud_pred = FraudPrediction(
        transaction_id=qr_tx.transaction_id,
        channel="qr",
        model_version="RF_LG_v1",
        fraud_probability=prob,
        prediction_label=prediction,
        risk_score_rule=tx_data.get("risk_score_rule", features.get("risk_score_rule", 0.0)),
        decision=decision
    )

    save_prediction(db, fraud_pred)

    # Actualiza el comportamiento del usuario
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

    # Explainability (igual que en transacciones normales)
    explanations = None

    if prob >= 0.45:
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

        if explanations:
            save_explanations(
                db=db,
                prediction_id=fraud_pred.prediction_id,
                explanations=explanations
            )

    return {
        "transaction_id": qr_tx.transaction_id,
        "fraud_probability": prob,
        "decision": decision,
        "kmeans_score": result.get("kmeans_score"),
        "explanations": explanations
    }


def process_qr_transaction_simple(db, tx_data):
    now = datetime.now(timezone.utc)

    hour = tx_data.get("hour", now.hour)
    day_of_week = tx_data.get("day_of_week", now.weekday())

    user_stats = get_user_stats(db, tx_data["user_id"])

    transactions_last_24h = user_stats["transactions_last_24h"]
    avg_amount_user = user_stats["avg_amount_user"]
    failed_attempts = user_stats["failed_attempts"]
    card_tx_last_24h = user_stats["card_tx_last_24h"]
    qr_tx_last_24h = user_stats["qr_tx_last_24h"]

    amount_vs_avg = calculate_amount_vs_avg(
        amount=tx_data["amount"],
        avg_amount_user=avg_amount_user
    )

    # Determinar si es internacional
    is_international = tx_data["country"] != "MX"

    # Calcular risk_score_rule con factores QR-específicos
    # Nota: geo_distance se calcula en build_qr_features
    risk_score_rule = calculate_risk_score_rule_qr(
        amount_vs_avg=amount_vs_avg,
        qr_scans_last_24h=qr_tx_last_24h,
        device_change_flag=tx_data.get("device_change_flag", False),
        failed_attempts=failed_attempts,
        is_international=is_international,
        transactions_last_24h=transactions_last_24h,
        geo_distance=0.0  # Se actualiza en build_qr_features si hay ubicación previa
    )

    full_tx = {
        **tx_data,
        "hour": hour,
        "day_of_week": day_of_week,
        "transactions_last_24h": transactions_last_24h,
        "avg_amount_user": avg_amount_user,
        "amount_vs_avg": amount_vs_avg,
        "failed_attempts": failed_attempts,
        "device_change_flag": False,
        "qr_scans_last_24h": qr_tx_last_24h,
        "risk_score_rule": risk_score_rule
    }

    return process_qr_transaction(db, full_tx)
