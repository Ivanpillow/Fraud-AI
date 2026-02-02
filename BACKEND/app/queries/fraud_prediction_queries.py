"""
Helper queries para FraudPrediction con soporte multi-canal.
"""
from app.models.fraud_prediction import FraudPrediction
from app.models.transaction import Transaction
from app.models.qr_transaction import QRTransaction


def get_prediction_with_transaction_details(db, prediction_id):
    """
    Obtiene una predicción con los detalles completos de su transacción.
    Retorna: {prediction_data, transaction_data}
    """
    prediction = (
        db.query(FraudPrediction)
        .filter(FraudPrediction.prediction_id == prediction_id)
        .first()
    )
    
    if not prediction:
        return None
    
    # Obtener detalles de la transacción según el canal
    if prediction.channel == "card":
        transaction = (
            db.query(Transaction)
            .filter(Transaction.transaction_id == prediction.transaction_id)
            .first()
        )
    elif prediction.channel == "qr":
        transaction = (
            db.query(QRTransaction)
            .filter(QRTransaction.transaction_id == prediction.transaction_id)
            .first()
        )
    else:
        transaction = None
    
    return {
        "prediction": prediction,
        "transaction": transaction,
        "channel": prediction.channel
    }


def get_user_predictions(db, user_id, channel=None, limit=100):
    """
    Obtiene predicciones de fraude de un usuario.
    
    Args:
        user_id: ID del usuario
        channel: "card", "qr", o None (ambos)
        limit: Número máximo de predicciones
    """
    query = db.query(FraudPrediction)
    
    if channel == "card":
        query = (
            query.join(
                Transaction,
                (FraudPrediction.transaction_id == Transaction.transaction_id)
                & (FraudPrediction.channel == "card")
            )
            .filter(Transaction.user_id == user_id)
        )
    elif channel == "qr":
        query = (
            query.join(
                QRTransaction,
                (FraudPrediction.transaction_id == QRTransaction.transaction_id)
                & (FraudPrediction.channel == "qr")
            )
            .filter(QRTransaction.user_id == user_id)
        )
    else:  # Ambos canales
        card_predictions = db.query(FraudPrediction).join(
            Transaction,
            (FraudPrediction.transaction_id == Transaction.transaction_id)
            & (FraudPrediction.channel == "card")
        ).filter(Transaction.user_id == user_id)
        
        qr_predictions = db.query(FraudPrediction).join(
            QRTransaction,
            (FraudPrediction.transaction_id == QRTransaction.transaction_id)
            & (FraudPrediction.channel == "qr")
        ).filter(QRTransaction.user_id == user_id)
        
        # Combinar ambas queries
        return (
            card_predictions.union(qr_predictions)
            .order_by(FraudPrediction.created_at.desc())
            .limit(limit)
            .all()
        )
    
    return (
        query.order_by(FraudPrediction.created_at.desc())
        .limit(limit)
        .all()
    )
