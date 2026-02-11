from sqlalchemy import desc, or_
from sqlalchemy.orm import Session
from app.models.fraud_prediction import FraudPrediction
from app.models.transaction import Transaction
from app.models.qr_transaction import QRTransaction

def save_prediction(db, prediction):
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def get_fraud_notifications(db: Session, limit: int = 20):
    """
    Get recent fraud predictions with status 'block' or 'review'
    Supports both card transactions and QR transactions
    Returns: List of fraud notifications with transaction details
    """
    # Get fraud predictions with block or review status
    fraud_predictions = db.query(FraudPrediction).filter(
        FraudPrediction.decision.in_(["block", "review"])
    ).order_by(
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
        }
        
        # Get transaction details based on channel
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
    Update the decision of a fraud prediction
    Args:
        prediction_id: ID of the prediction to update
        new_decision: New decision value ('approve', 'block', 'review')
    Returns: Updated prediction or None if not found
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