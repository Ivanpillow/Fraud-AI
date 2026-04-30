from sqlalchemy import func
from app.models.transaction import Transaction
from app.models.qr_transaction import QRTransaction
from app.models.bc_transaction import BCTransaction
from app.models.fraud_prediction import FraudPrediction


def _reviewed_predictions_query(db, merchant_id: int | None = None):
    query = db.query(FraudPrediction).filter(FraudPrediction.reviewed.is_(True))

    if merchant_id is not None:
        query = query.filter(FraudPrediction.merchant_id == merchant_id)

    return query

def get_global_metrics(db):
    """
    Obtiene métricas globales considerando tanto transacciones card como QR.
    """
    reviewed_predictions = _reviewed_predictions_query(db)

    total_card_tx = reviewed_predictions.filter(FraudPrediction.channel == "card").count()
    total_qr_tx = reviewed_predictions.filter(FraudPrediction.channel == "qr").count()
    total_crypto_tx = reviewed_predictions.filter(FraudPrediction.channel == "blockchain").count()
    total_tx = total_card_tx + total_qr_tx + total_crypto_tx

    total_fraud = reviewed_predictions.filter(FraudPrediction.prediction_label.is_(True)).count()
    reviewed_total = reviewed_predictions.count()
    fraud_rate = (total_fraud / reviewed_total) if reviewed_total > 0 else 0

    return {
        "total_transactions": total_tx,
        "total_card_transactions": total_card_tx,
        "total_qr_transactions": total_qr_tx,
        "total_crypto_transactions": total_crypto_tx,
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
        .filter(FraudPrediction.reviewed.is_(True))
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
        .filter(FraudPrediction.reviewed.is_(True))
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
        .filter(FraudPrediction.reviewed.is_(True))
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
        .filter(FraudPrediction.reviewed.is_(True))
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
        .filter(FraudPrediction.reviewed.is_(True))
        .group_by(FraudPrediction.channel, FraudPrediction.decision)
        .all()
    )

def get_dashboard_stats(db, merchant_id: int | None = None):
    print("Merchant ID recibido en get_dashboard_stats:", merchant_id)
    """
    Obtiene estadísticas del dashboard:
    - Total de transacciones (card + QR + crypto)
    - Total de usuarios con compras en el comercio
    - Usuarios activos (igual a total de usuarios por ahora)
    - Total de fraudes
    - Total de ingresos (suma de todas las transacciones)
    - Cambios porcentuales (datos dummy para "looks")
    """
    reviewed_predictions = _reviewed_predictions_query(db, merchant_id)

    card_rows = (
        reviewed_predictions.filter(FraudPrediction.channel == "card")
        .join(Transaction, Transaction.transaction_id == FraudPrediction.transaction_id)
        .with_entities(Transaction.transaction_id, Transaction.user_id, Transaction.amount)
        .all()
    )
    qr_rows = (
        reviewed_predictions.filter(FraudPrediction.channel == "qr")
        .join(QRTransaction, QRTransaction.transaction_id == FraudPrediction.transaction_id)
        .with_entities(QRTransaction.transaction_id, QRTransaction.user_id, QRTransaction.amount)
        .all()
    )
    crypto_rows = (
        reviewed_predictions.filter(FraudPrediction.channel == "blockchain")
        .join(BCTransaction, BCTransaction.fraud_transaction_id == FraudPrediction.transaction_id)
        .with_entities(BCTransaction.payment_id, BCTransaction.user_id, BCTransaction.amount)
        .all()
    )

    total_card_tx = len(card_rows)
    total_qr_tx = len(qr_rows)
    total_crypto_tx = len(crypto_rows)
    total_transactions = total_card_tx + total_qr_tx + total_crypto_tx

    # Total de usuarios que han comprado en el comercio
    total_users = len({
        row.user_id
        for row in card_rows + qr_rows + crypto_rows
        if row.user_id is not None
    })
    active_users = total_users  # Por ahora, usuarios activos = total de usuarios

    # Total de fraudes
    total_frauds = reviewed_predictions.filter(FraudPrediction.prediction_label.is_(True)).count()

    total_revenue = sum(float(row.amount or 0) for row in card_rows + qr_rows + crypto_rows)

    reviewed_total = reviewed_predictions.count()
    fraud_rate = (total_frauds / reviewed_total) if reviewed_total > 0 else 0
    
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
        "total_crypto_transactions": total_crypto_tx,
        "users_change": users_change,
        "transactions_change": transactions_change,
        "revenue_change": revenue_change,
        "fraud_rate": round(fraud_rate, 4),
        "frauds_change": frauds_change,
    }