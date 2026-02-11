from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.queries.prediction_queries import get_fraud_notifications, update_prediction_decision
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationResponse(BaseModel):
    id: str
    prediction_id: int  # ID de la predicción para updates
    type: str  # "block" o "review"
    message: str
    amount: float
    timestamp: datetime
    transaction_id: int
    channel: str  # "card" o "qr"
    fraud_probability: float

    class Config:
        from_attributes = True


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get recent fraud notifications (block and review)
    Returns notifications for both card and QR transactions
    """
    notifications_data = get_fraud_notifications(db, limit=limit)
    
    result = []
    for notif_dict in notifications_data:
        # Determinar tipo de mensaje
        decision = notif_dict['decision']
        if decision == "block":
            msg_type = "block"
            message = f"Transacción bloqueada por fraude"
        else:
            msg_type = "review"
            message = f"Transacción requiere revisión"
        
        # Crear objeto de notificación
        notification = NotificationResponse(
            id=f"{notif_dict['channel']}-{notif_dict['transaction_id']}",
            prediction_id=notif_dict['prediction_id'],
            type=msg_type,
            message=message,
            amount=notif_dict['amount'],
            timestamp=notif_dict['created_at'],
            transaction_id=notif_dict['transaction_id'],
            channel=notif_dict['channel'],
            fraud_probability=notif_dict['fraud_probability']
        )
        result.append(notification)
    
    return result


class UpdateDecisionRequest(BaseModel):
    decision: str  # "approve", "block", or "review"

    class Config:
        from_attributes = True


@router.patch("/{prediction_id}/decision")
def update_notification_decision(
    prediction_id: int,
    payload: UpdateDecisionRequest,
    db: Session = Depends(get_db)
):
    """
    Update the decision of a fraud prediction
    Changes the status from review to approve/block or vice versa
    """
    # Validar que la decisión sea válida
    valid_decisions = ["approve", "block", "review"]
    if payload.decision not in valid_decisions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid decision. Must be one of: {', '.join(valid_decisions)}"
        )
    
    # Actualizar la decisión
    updated_prediction = update_prediction_decision(
        db=db,
        prediction_id=prediction_id,
        new_decision=payload.decision
    )
    
    if not updated_prediction:
        raise HTTPException(
            status_code=404,
            detail=f"Prediction with ID {prediction_id} not found"
        )
    
    return {
        "status": "ok",
        "message": f"Decision updated to '{payload.decision}'",
        "prediction_id": prediction_id,
        "new_decision": payload.decision
    }
