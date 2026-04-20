from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.auth import get_current_merchant
from app.db.session import get_db
from app.schemas.bc_transaction import (
    BCPaymentStatusResponse,
    BCTransactionCreate,
    BCTransactionRawCreate,
    BCWebhookEvent,
)
from app.services.bc_transaction_service import (
    apply_internal_webhook_event,
    get_bc_payment_status,
    process_bc_transaction,
    process_bc_transaction_simple,
)

router = APIRouter(prefix="/bc-transactions", tags=["Blockchain Transactions"])


@router.post("/")
def create_bc_transaction(
    tx: BCTransactionCreate,
    background_tasks: BackgroundTasks,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    return process_bc_transaction(db, tx.model_dump(), merchant_id, background_tasks=background_tasks)


@router.post("/simple")
def create_bc_transaction_simple(
    tx: BCTransactionRawCreate,
    background_tasks: BackgroundTasks,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    return process_bc_transaction_simple(db, tx.model_dump(), merchant_id, background_tasks=background_tasks)


@router.post("/webhook/internal", include_in_schema=False)
def receive_internal_bc_webhook(
    payload: BCWebhookEvent,
    x_bc_webhook_secret: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if x_bc_webhook_secret != settings.BC_INTERNAL_WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid blockchain webhook signature")

    updated_payment = apply_internal_webhook_event(db, payload.model_dump())
    if not updated_payment:
        raise HTTPException(status_code=404, detail="Blockchain payment not found")

    return {"status": "ok", "payment": updated_payment}


@router.get("/{payment_id}", response_model=BCPaymentStatusResponse)
def get_bc_transaction_status(
    payment_id: int,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    payment = get_bc_payment_status(db, payment_id=payment_id, merchant_id=merchant_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Blockchain payment not found")
    return payment
