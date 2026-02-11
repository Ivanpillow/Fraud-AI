from sqlalchemy import func
from app.models.transaction import Transaction
from app.models.qr_transaction import QRTransaction
from app.models.fraud_prediction import FraudPrediction
from app.models.user import User

def get_global_metrics(db):
    """
    Obtiene métricas globales considerando tanto transacciones card como QR.
    """
    total_card_tx = db.query(func.count(Transaction.transaction_id)).scalar()
    total_qr_tx = db.query(func.count(QRTransaction.transaction_id)).scalar()
    total_tx = total_card_tx + total_qr_tx
    
    total_fraud = (
        db.query(func.count(FraudPrediction.prediction_id))
        .filter(FraudPrediction.prediction_label == True)
        .scalar()
    )

    fraud_rate = (total_fraud / total_tx) if total_tx > 0 else 0

    return {
        "total_transactions": total_tx,
        "total_card_transactions": total_card_tx,
        "total_qr_transactions": total_qr_tx,
        "total_frauds": total_fraud,
        "fraud_rate": round(fraud_rate, 4)
    }

def frauds_by_hour(db):
    """
    Fraudes por hora considerando ambos canales.
    """
    card_frauds = (
        db.query(
            Transaction.hour,
            func.count(FraudPrediction.prediction_id).label("fraud_count")
        )
        .join(
            FraudPrediction,
            (FraudPrediction.transaction_id == Transaction.transaction_id)
            & (FraudPrediction.channel == "card")
        )
        .filter(FraudPrediction.prediction_label == True)
        .group_by(Transaction.hour)
        .all()
    )

    qr_frauds = (
        db.query(
            QRTransaction.hour,
            func.count(FraudPrediction.prediction_id).label("fraud_count")
        )
        .join(
            FraudPrediction,
            (FraudPrediction.transaction_id == QRTransaction.transaction_id)
            & (FraudPrediction.channel == "qr")
        )
        .filter(FraudPrediction.prediction_label == True)
        .group_by(QRTransaction.hour)
        .all()
    )

    fraud_dict = {}
    for hour, count in card_frauds:
        fraud_dict[hour] = fraud_dict.get(hour, 0) + count
    for hour, count in qr_frauds:
        fraud_dict[hour] = fraud_dict.get(hour, 0) + count

    return sorted(fraud_dict.items())

def frauds_by_country(db):
    """
    Fraudes por país considerando ambos canales.
    """
    # Fraudes en transacciones card
    card_frauds = (
        db.query(
            Transaction.country,
            func.count(FraudPrediction.prediction_id).label("fraud_count")
        )
        .join(
            FraudPrediction, 
            (FraudPrediction.transaction_id == Transaction.transaction_id) & 
            (FraudPrediction.channel == "card")
        )
        .filter(FraudPrediction.prediction_label == True)
        .group_by(Transaction.country)
        .all()
    )
    
    # Fraudes en transacciones QR
    qr_frauds = (
        db.query(
            QRTransaction.country,
            func.count(FraudPrediction.prediction_id).label("fraud_count")
        )
        .join(
            FraudPrediction, 
            (FraudPrediction.transaction_id == QRTransaction.transaction_id) & 
            (FraudPrediction.channel == "qr")
        )
        .filter(FraudPrediction.prediction_label == True)
        .group_by(QRTransaction.country)
        .all()
    )
    
    # Combinar resultados
    fraud_dict = {}
    for country, count in card_frauds:
        fraud_dict[country] = fraud_dict.get(country, 0) + count
    for country, count in qr_frauds:
        fraud_dict[country] = fraud_dict.get(country, 0) + count
    
    return [(country, count) for country, count in fraud_dict.items()]

def decisions_distribution(db):
    """
    Distribución de decisiones por canal.
    """
    return (
        db.query(
            FraudPrediction.channel,
            FraudPrediction.decision,
            func.count(FraudPrediction.prediction_id).label("count")
        )
        .group_by(FraudPrediction.channel, FraudPrediction.decision)
        .all()
    )

def get_dashboard_stats(db):
    """
    Obtiene estadísticas del dashboard:
    - Total de transacciones (card + QR)
    - Total de usuarios
    - Usuarios activos (igual a total de usuarios por ahora)
    - Total de fraudes
    - Total de ingresos (suma de todas las transacciones)
    - Cambios porcentuales (datos dummy para "looks")
    """
    # Total de transacciones
    total_card_tx = db.query(func.count(Transaction.transaction_id)).scalar() or 0
    total_qr_tx = db.query(func.count(QRTransaction.transaction_id)).scalar() or 0
    total_transactions = total_card_tx + total_qr_tx
    
    # Total de usuarios
    total_users = db.query(func.count(User.user_id)).scalar() or 0
    active_users = total_users  # Por ahora, usuarios activos = total de usuarios
    
    # Total de fraudes
    total_frauds = (
        db.query(func.count(FraudPrediction.prediction_id))
        .filter(FraudPrediction.prediction_label == True)
        .scalar() or 0
    )
    
    # Total de ingresos (suma de todas las transacciones)
    card_revenue = db.query(func.sum(Transaction.amount)).scalar() or 0
    qr_revenue = db.query(func.sum(QRTransaction.amount)).scalar() or 0
    total_revenue = float(card_revenue) + float(qr_revenue)
    
    # Cambios porcentuales (datos dummy para "looks")
    users_change = 5.2  # +5.2%
    transactions_change = 12.5  # +12.5%
    revenue_change = 8.3  # +8.3%
    frauds_change = -2.1  # -2.1%
    
    return {
        "total_users": total_users,
        "total_transactions": total_transactions,
        "total_revenue": round(total_revenue, 2),
        "active_users": active_users,
        "total_frauds": total_frauds,
        "users_change": users_change,
        "transactions_change": transactions_change,
        "revenue_change": revenue_change,
        "frauds_change": frauds_change,
    }