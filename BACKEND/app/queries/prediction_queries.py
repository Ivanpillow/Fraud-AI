from sqlalchemy import desc, or_
from sqlalchemy.orm import Session
from app.models.fraud_prediction import FraudPrediction
from app.models.transaction import Transaction
from app.models.qr_transaction import QRTransaction
from app.models.fraud_explanation import FraudExplanation

def save_prediction(db, prediction):
    db.add(prediction)
    # db.flush()
    db.refresh(prediction)
    return prediction


def _get_prediction_explanations(db: Session, prediction_id: int) -> list[dict]:
    explanations = db.query(FraudExplanation).filter(
        FraudExplanation.prediction_id == prediction_id
    ).all()

    parsed = []
    for exp in explanations:
        value = float(exp.contribution_value) if exp.contribution_value is not None else 0.0
        parsed.append({
            "feature_name": exp.feature_name,
            "contribution_value": value,
            "direction": exp.direction,
        })

    # Primero las variables con mayor impacto absoluto para facilitar lectura en frontend.
    parsed.sort(key=lambda item: abs(item["contribution_value"]), reverse=True)
    return parsed


def get_fraud_notifications(db: Session, limit: int = 20, merchant_id: int | None = None):
    """
    Obtiene predicciones recientes de fraude con estado 'block' o 'review'.
    Soporta tanto transacciones con tarjeta como transacciones QR.
    Retorna: lista de notificaciones de fraude con detalle de transacción.
    """
    # Obtener predicciones de fraude con estado block o review
    query = db.query(FraudPrediction).filter(
        FraudPrediction.decision.in_(["block", "review"])
    )

    if merchant_id is not None:
        query = query.filter(FraudPrediction.merchant_id == merchant_id)

    fraud_predictions = query.order_by(
        desc(FraudPrediction.created_at)
    ).limit(limit).all()
    
    results = []
    for pred in fraud_predictions:
        transaction_data = {
            'prediction_id': pred.prediction_id,
            'transaction_id': pred.transaction_id,
            'channel': pred.channel,
            'decision': pred.decision,
            'fraud_probability': float(pred.fraud_probability) if pred.fraud_probability else 0.0,
            'created_at': pred.created_at,
            'amount': 0.0,
            'timestamp': pred.created_at,
            'user_id': None,
            'explanations': _get_prediction_explanations(db, pred.prediction_id),
        }
        
        # Obtener detalles de la transacción según el canal
        if pred.channel == "card":
            transaction = db.query(Transaction).filter(
                Transaction.transaction_id == pred.transaction_id
            ).first()
            if transaction:
                transaction_data['amount'] = float(transaction.amount) if transaction.amount else 0.0
                transaction_data['timestamp'] = transaction.timestamp or pred.created_at
                transaction_data['user_id'] = transaction.user_id
        
        elif pred.channel == "qr":
            qr_transaction = db.query(QRTransaction).filter(
                QRTransaction.transaction_id == pred.transaction_id
            ).first()
            if qr_transaction:
                transaction_data['amount'] = float(qr_transaction.amount) if qr_transaction.amount else 0.0
                transaction_data['timestamp'] = getattr(qr_transaction, 'timestamp', pred.created_at)
                transaction_data['user_id'] = qr_transaction.user_id
        
        results.append(transaction_data)
    
    return results


def update_prediction_decision(db: Session, prediction_id: int, new_decision: str):
    """
    Actualiza la decisión de una predicción de fraude.
    Args:
        prediction_id: ID de la predicción a actualizar.
        new_decision: Nuevo valor de decisión ('approve', 'block', 'review').
    Returns: predicción actualizada o None si no existe.
    """
    prediction = db.query(FraudPrediction).filter(
        FraudPrediction.prediction_id == prediction_id
    ).first()
    
    if not prediction:
        return None
    
    prediction.decision = new_decision
    db.commit()
    db.refresh(prediction)
    
    return prediction