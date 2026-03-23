from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.queries.prediction_queries import get_fraud_notifications, update_prediction_decision
from app.core.dependencies import get_current_user
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])


class ExplanationItem(BaseModel):
    feature_name: str | None = None
    contribution_value: float = 0.0
    direction: str | None = None


class NotificationResponse(BaseModel):
    id: str
    prediction_id: int  # ID de la predicción para actualizaciones
    type: str  # "block" o "review"
    message: str
    amount: float
    timestamp: datetime
    transaction_id: int
    channel: str  # "card" o "qr"
    fraud_probability: float
    explanations: List[ExplanationItem] = Field(default_factory=list)

    class Config:
        from_attributes = True


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Obtiene notificaciones recientes de fraude (block y review).
    Retorna notificaciones para transacciones con tarjeta y QR.
    """
    is_superadmin = bool(current_user.get("is_superadmin"))
    merchant_id = None if is_superadmin else int(current_user["merchant_id"])

    notifications_data = get_fraud_notifications(
        db,
        limit=limit,
        merchant_id=merchant_id,
    )
    
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
            fraud_probability=notif_dict['fraud_probability'],
            explanations=notif_dict.get('explanations', [])
        )
        result.append(notification)
    
    return result


class UpdateDecisionRequest(BaseModel):
    decision: str  # "approve", "block" o "review"

    class Config:
        from_attributes = True


@router.patch("/{prediction_id}/decision")
def update_notification_decision(
    prediction_id: int,
    payload: UpdateDecisionRequest,
    db: Session = Depends(get_db)
):
    """
    Actualiza la decisión de una predicción de fraude.
    Cambia el estado de review a approve/block o viceversa.
    """
    # Validar que la decisión sea válida
    valid_decisions = ["approve", "block", "review"]
    if payload.decision not in valid_decisions:
        raise HTTPException(
            status_code=400, 
            detail=f"Decisión inválida. Debe ser una de: {', '.join(valid_decisions)}"
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
            detail=f"Predicción con ID {prediction_id} no encontrada"
        )
    
    return {
        "status": "ok",
        "message": f"Decisión actualizada a '{payload.decision}'",
        "prediction_id": prediction_id,
        "new_decision": payload.decision
    }
