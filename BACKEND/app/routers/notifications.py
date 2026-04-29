from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.queries.prediction_queries import get_fraud_notifications, get_fraud_history, update_prediction_decision
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
    decision: str | None = None
    final_decision: str | None = None
    reviewed: bool = False
    shipping_country: str | None = None
    shipping_state: str | None = None
    shipping_city: str | None = None
    shipping_postal_code: str | None = None
    shipping_street: str | None = None
    shipping_reference: str | None = None
    shipping_full_name: str | None = None
    shipping_phone: str | None = None
    explanations: List[ExplanationItem] = Field(default_factory=list)

    class Config:
        from_attributes = True


@router.get("", response_model=List[NotificationResponse])
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
            message = "Transacción bloqueada por fraude"
        else:
            msg_type = "review"
            message = "Transacción requiere revisión"
        
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
            decision=notif_dict.get('decision'),
            final_decision=notif_dict.get('final_decision'),
            reviewed=bool(notif_dict.get('reviewed', False)),
            shipping_country=notif_dict.get('shipping_country'),
            shipping_state=notif_dict.get('shipping_state'),
            shipping_city=notif_dict.get('shipping_city'),
            shipping_postal_code=notif_dict.get('shipping_postal_code'),
            shipping_street=notif_dict.get('shipping_street'),
            shipping_reference=notif_dict.get('shipping_reference'),
            shipping_full_name=notif_dict.get('shipping_full_name'),
            shipping_phone=notif_dict.get('shipping_phone'),
            explanations=notif_dict.get('explanations', [])
        )
        result.append(notification)
    
    return result


@router.get("/history", response_model=List[NotificationResponse])
def get_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Obtiene historial de transacciones ya revisadas (reviewed = True).
    Incluye tanto transacciones auto-finalizadas (con final_decision = 'allow')
    como transacciones que fueron revisadas por administradores.
    """
    is_superadmin = bool(current_user.get("is_superadmin"))
    merchant_id = None if is_superadmin else int(current_user["merchant_id"])

    history_data = get_fraud_history(
        db,
        limit=limit,
        merchant_id=merchant_id,
    )
    
    result = []
    for hist_dict in history_data:
        # Determinar tipo basado en la decisión final cuando ya fue revisada
        final_decision = hist_dict.get('final_decision') or hist_dict['decision']
        reviewed = bool(hist_dict.get('reviewed', False))
        initial_decision = hist_dict.get('decision')
        
        if final_decision == "block":
            msg_type = "block"
            message = "Transacción bloqueada"
        elif final_decision == "review":
            msg_type = "review"
            message = "Transacción revisada"
        elif final_decision == "allow" and initial_decision == "allow":
            msg_type = "allow"
            message = "Aprobada por el sistema"
        else:  # allow manual
            msg_type = "allow"
            message = "Transacción aprobada manualmente"
        
        # Crear objeto de historial
        notification = NotificationResponse(
            id=f"{hist_dict['channel']}-{hist_dict['transaction_id']}",
            prediction_id=hist_dict['prediction_id'],
            type=msg_type,
            message=message,
            amount=hist_dict['amount'],
            timestamp=hist_dict['created_at'],
            transaction_id=hist_dict['transaction_id'],
            channel=hist_dict['channel'],
            fraud_probability=hist_dict['fraud_probability'],
            decision=initial_decision,
            final_decision=final_decision,
            reviewed=reviewed,
            shipping_country=hist_dict.get('shipping_country'),
            shipping_state=hist_dict.get('shipping_state'),
            shipping_city=hist_dict.get('shipping_city'),
            shipping_postal_code=hist_dict.get('shipping_postal_code'),
            shipping_street=hist_dict.get('shipping_street'),
            shipping_reference=hist_dict.get('shipping_reference'),
            shipping_full_name=hist_dict.get('shipping_full_name'),
            shipping_phone=hist_dict.get('shipping_phone'),
            explanations=hist_dict.get('explanations', [])
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
    Actualiza la decisión final de una predicción de fraude tras revisión manual.
    
    Comportamiento:
    - 'decision' (inicial del modelo) nunca se modifica
    - 'final_decision' se establece con el nuevo valor: 'allow', 'block' o 'review'
    - 'reviewed' se establece en True para marcar como revisado
    - 'approve' se mapea automáticamente a 'allow'
    
    Args:
        prediction_id: ID de la predicción a actualizar
        decision: 'approve' (→ 'allow'), 'block' o 'review'
    """
    # Validar que la decisión sea válida
    valid_decisions = ["approve", "block", "review"]
    if payload.decision not in valid_decisions:
        raise HTTPException(
            status_code=400, 
            detail=f"Decisión inválida. Debe ser una de: {', '.join(valid_decisions)}"
        )
    
    # Actualizar la decisión final
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
    
    # Mapear para respuesta consistente
    final_decision_value = "allow" if payload.decision == "approve" else payload.decision
    
    return {
        "status": "ok",
        "message": f"Decisión actualizada. Decision inicial: '{updated_prediction.decision}', Decisión final: '{final_decision_value}', Revisado: True",
        "prediction_id": prediction_id,
        "decision": updated_prediction.decision,
        "final_decision": final_decision_value,
        "reviewed": updated_prediction.reviewed
    }
