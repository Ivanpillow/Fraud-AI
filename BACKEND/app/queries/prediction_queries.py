from sqlalchemy import desc, or_
from sqlalchemy.orm import Session
from app.models.bc_transaction import BCTransaction
from app.models.fraud_prediction import FraudPrediction
from app.models.transaction import Transaction
from app.models.qr_transaction import QRTransaction
from app.models.user_transaction_details import UserTransactionDetails
from app.models.fraud_explanation import FraudExplanation
from app.services.user_behavior_service import update_user_avg_amount

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


def _get_transaction_shipping_details(db: Session, transaction_id: int, channel: str) -> dict:
    details = db.query(UserTransactionDetails).filter(
        UserTransactionDetails.transaction_id == transaction_id,
        UserTransactionDetails.channel == channel,
    ).first()

    if not details:
        return {}

    return {
        "shipping_country": details.country,
        "shipping_state": details.state,
        "shipping_city": details.city,
        "shipping_postal_code": details.postal_code,
        "shipping_street": details.street,
        "shipping_reference": details.reference,
        "shipping_full_name": details.full_name,
        "shipping_phone": details.phone,
    }


def get_fraud_notifications(db: Session, limit: int = 20, merchant_id: int | None = None):
    """
    Obtiene predicciones recientes de fraude con estado 'block' o 'review' y reviewed = False.
    Solo retorna transacciones que requieren revisión humana.
    Soporta transacciones card, qr y blockchain (expuestas como crypto en frontend).
    Retorna: lista de notificaciones de fraude con detalle de transacción.
    """
    # Obtener predicciones de fraude con estado block o review y reviewed = False
    query = db.query(FraudPrediction).filter(
        FraudPrediction.decision.in_(["block", "review"]),
        FraudPrediction.reviewed == False
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
            'channel': 'crypto' if pred.channel == 'blockchain' else pred.channel,
            'decision': pred.decision,
            'final_decision': pred.final_decision,
            'reviewed': bool(pred.reviewed),
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
                transaction_data.update(_get_transaction_shipping_details(db, pred.transaction_id, 'card'))
        
        elif pred.channel == "qr":
            qr_transaction = db.query(QRTransaction).filter(
                QRTransaction.transaction_id == pred.transaction_id
            ).first()
            if qr_transaction:
                transaction_data['amount'] = float(qr_transaction.amount) if qr_transaction.amount else 0.0
                transaction_data['timestamp'] = getattr(qr_transaction, 'timestamp', pred.created_at)
                transaction_data['user_id'] = qr_transaction.user_id
                transaction_data.update(_get_transaction_shipping_details(db, pred.transaction_id, 'qr'))

        elif pred.channel == "blockchain":
            bc_transaction = db.query(BCTransaction).filter(
                BCTransaction.fraud_transaction_id == pred.transaction_id
            ).first()
            if bc_transaction:
                transaction_data['amount'] = float(bc_transaction.amount) if bc_transaction.amount else 0.0
                transaction_data['timestamp'] = bc_transaction.created_at or pred.created_at
                transaction_data['user_id'] = bc_transaction.user_id
                transaction_data.update(_get_transaction_shipping_details(db, pred.transaction_id, 'blockchain'))
        
        results.append(transaction_data)
    
    return results


def get_fraud_history(db: Session, limit: int = 50, merchant_id: int | None = None):
    """
    Obtiene predicciones revisadas (reviewed = True) que ya fueron procesadas.
    Incluye transacciones con decisión final 'allow' (auto-finalizadas) o cualquier decisión tomada por un admin.
    Soporta transacciones card, qr y blockchain (expuestas como crypto en frontend).
    Retorna: lista de predicciones revisadas ordenadas por fecha descendente.
    """
    # Obtener predicciones revisadas (reviewed = True)
    query = db.query(FraudPrediction).filter(
        FraudPrediction.reviewed == True
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
            'channel': 'crypto' if pred.channel == 'blockchain' else pred.channel,
            'decision': pred.decision,
            'final_decision': pred.final_decision,
            'reviewed': bool(pred.reviewed),
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
                transaction_data.update(_get_transaction_shipping_details(db, pred.transaction_id, 'card'))
        
        elif pred.channel == "qr":
            qr_transaction = db.query(QRTransaction).filter(
                QRTransaction.transaction_id == pred.transaction_id
            ).first()
            if qr_transaction:
                transaction_data['amount'] = float(qr_transaction.amount) if qr_transaction.amount else 0.0
                transaction_data['timestamp'] = getattr(qr_transaction, 'timestamp', pred.created_at)
                transaction_data['user_id'] = qr_transaction.user_id
                transaction_data.update(_get_transaction_shipping_details(db, pred.transaction_id, 'qr'))

        elif pred.channel == "blockchain":
            bc_transaction = db.query(BCTransaction).filter(
                BCTransaction.fraud_transaction_id == pred.transaction_id
            ).first()
            if bc_transaction:
                transaction_data['amount'] = float(bc_transaction.amount) if bc_transaction.amount else 0.0
                transaction_data['timestamp'] = bc_transaction.created_at or pred.created_at
                transaction_data['user_id'] = bc_transaction.user_id
                transaction_data.update(_get_transaction_shipping_details(db, pred.transaction_id, 'blockchain'))
        
        results.append(transaction_data)
    
    return results


def update_prediction_decision(db: Session, prediction_id: int, new_decision: str):
    """
    Actualiza la decisión final de una predicción de fraude tras revisión manual.
    Args:
        prediction_id: ID de la predicción a actualizar.
        new_decision: Nuevo valor de decisión final ('approve' → 'allow', 'block', 'review').
                      'approve' se mapea automáticamente a 'allow'.
    Returns: predicción actualizada o None si no existe.
    """
    prediction = db.query(FraudPrediction).filter(
        FraudPrediction.prediction_id == prediction_id
    ).first()
    
    if not prediction:
        return None
    
    # Mapear 'approve' a 'allow' para mantener consistencia
    final_decision_value = "allow" if new_decision == "approve" else new_decision
    
    # Actualizar final_decision y marcar como revisado
    prediction.final_decision = final_decision_value
    prediction.reviewed = True

    if final_decision_value == "allow" and prediction.decision != "allow":
        source_amount = None
        source_user_id = None

        if prediction.channel == "card":
            source_transaction = db.query(Transaction).filter(
                Transaction.transaction_id == prediction.transaction_id
            ).first()
            if source_transaction:
                source_amount = float(source_transaction.amount) if source_transaction.amount is not None else None
                source_user_id = source_transaction.user_id
        elif prediction.channel == "qr":
            source_transaction = db.query(QRTransaction).filter(
                QRTransaction.transaction_id == prediction.transaction_id
            ).first()
            if source_transaction:
                source_amount = float(source_transaction.amount) if source_transaction.amount is not None else None
                source_user_id = source_transaction.user_id
        elif prediction.channel == "blockchain":
            source_transaction = db.query(BCTransaction).filter(
                BCTransaction.fraud_transaction_id == prediction.transaction_id
            ).first()
            if source_transaction:
                source_amount = float(source_transaction.amount) if source_transaction.amount is not None else None
                source_user_id = source_transaction.user_id

        if source_amount is not None and source_user_id is not None:
            update_user_avg_amount(
                db=db,
                user_id=int(source_user_id),
                amount=float(source_amount),
            )
    
    db.commit()
    db.refresh(prediction)
    
    return prediction