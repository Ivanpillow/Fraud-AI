from sqlalchemy import func
from app.models.transaction import Transaction
from app.models.fraud_prediction import FraudPrediction

def get_global_metrics(db):
    total_tx = db.query(func.count(Transaction.transaction_id)).scalar()
    total_fraud = (
        db.query(func.count(FraudPrediction.prediction_id))
        .filter(FraudPrediction.prediction_label == True)
        .scalar()
    )

    fraud_rate = (total_fraud / total_tx) if total_tx > 0 else 0

    return {
        "total_transactions": total_tx,
        "total_frauds": total_fraud,
        "fraud_rate": round(fraud_rate, 4)
    }

def frauds_by_hour(db):
    return (
        db.query(
            Transaction.hour,
            func.count(FraudPrediction.prediction_id).label("fraud_count")
        )
        .join(FraudPrediction, FraudPrediction.transaction_id == Transaction.transaction_id)
        .filter(FraudPrediction.prediction_label == True)
        .group_by(Transaction.hour)
        .order_by(Transaction.hour)
        .all()
    )

def frauds_by_country(db):
    return (
        db.query(
            Transaction.country,
            func.count(FraudPrediction.prediction_id).label("fraud_count")
        )
        .join(FraudPrediction, FraudPrediction.transaction_id == Transaction.transaction_id)
        .filter(FraudPrediction.prediction_label == True)
        .group_by(Transaction.country)
        .all()
    )

def decisions_distribution(db):
    return (
        db.query(
            FraudPrediction.decision,
            func.count(FraudPrediction.prediction_id).label("count")
        )
        .group_by(FraudPrediction.decision)
        .all()
    )