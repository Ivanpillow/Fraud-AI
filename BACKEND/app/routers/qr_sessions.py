from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_merchant
from app.db.session import get_db
from app.models.qr_session import QRSession
from app.schemas.qr_session import QRSessionCreate, QRSessionUpdate

router = APIRouter(prefix="/qr-sessions", tags=["QR Sessions"])


def _load_session(db: Session, transaction_id: int, merchant_id: int) -> QRSession | None:
    return (
        db.query(QRSession)
        .filter(QRSession.transaction_id == transaction_id)
        .filter(QRSession.merchant_id == merchant_id)
        .first()
    )


@router.post("/")
def create_qr_session(
    payload: QRSessionCreate,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    session = db.query(QRSession).filter(QRSession.transaction_id == payload.transaction_id).first()

    if session:
        if session.merchant_id != merchant_id:
            raise HTTPException(status_code=403, detail="No puedes actualizar este QR session")
        session.status = payload.status
    else:
        session = QRSession(
            transaction_id=payload.transaction_id,
            merchant_id=merchant_id,
            status=payload.status,
        )
        db.add(session)

    db.commit()
    db.refresh(session)

    return {
        "transaction_id": session.transaction_id,
        "status": session.status,
        "updated_at": session.updated_at,
    }


@router.get("/{transaction_id}")
def get_qr_session(
    transaction_id: int,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    session = _load_session(db, transaction_id, merchant_id)
    if not session:
        raise HTTPException(status_code=404, detail="QR session no encontrada")

    return {
        "transaction_id": session.transaction_id,
        "status": session.status,
        "updated_at": session.updated_at,
    }


@router.patch("/{transaction_id}")
def update_qr_session(
    transaction_id: int,
    payload: QRSessionUpdate,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    session = _load_session(db, transaction_id, merchant_id)
    if not session:
        raise HTTPException(status_code=404, detail="QR session no encontrada")

    session.status = payload.status
    db.commit()
    db.refresh(session)

    return {
        "transaction_id": session.transaction_id,
        "status": session.status,
        "updated_at": session.updated_at,
    }
