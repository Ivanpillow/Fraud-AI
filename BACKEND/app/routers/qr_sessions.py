from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_merchant
from app.db.session import get_db
from app.models.qr_session import QRSession
from app.schemas.qr_session import QRSessionCardCreate, QRSessionCreate, QRSessionUpdate

router = APIRouter(prefix="/qr-sessions", tags=["QR Sessions"])


def _load_session(db: Session, transaction_id: int, merchant_id: int) -> QRSession | None:
    return (
        db.query(QRSession)
        .filter(QRSession.transaction_id == transaction_id)
        .filter(QRSession.merchant_id == merchant_id)
        .first()
    )


def _normalize_cards(session: QRSession) -> list[dict]:
    if session.cards is None:
        return []
    return list(session.cards)


def _format_display_number(card_number: str) -> str:
    trimmed = "".join([c for c in card_number if c.isdigit()])
    if len(trimmed) < 4:
        return "****"
    last4 = trimmed[-4:]
    return f"**** **** **** {last4}"


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
        "cards": _normalize_cards(session),
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
        "cards": _normalize_cards(session),
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
        "cards": _normalize_cards(session),
    }


@router.post("/{transaction_id}/cards")
def add_qr_session_card(
    transaction_id: int,
    payload: QRSessionCardCreate,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    session = _load_session(db, transaction_id, merchant_id)
    if not session:
        raise HTTPException(status_code=404, detail="QR session no encontrada")

    card_number = "".join([c for c in payload.card_number if c.isdigit()])
    if len(card_number) < 12 or len(card_number) > 19:
        raise HTTPException(status_code=400, detail="Numero de tarjeta invalido")

    cards = _normalize_cards(session)
    card = {
        "id": str(uuid4()),
        "label": payload.label,
        "card_number": card_number,
        "display_number": _format_display_number(card_number),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    session.cards = [card, *cards]
    db.commit()
    db.refresh(session)

    return {
        "transaction_id": session.transaction_id,
        "status": session.status,
        "updated_at": session.updated_at,
        "cards": _normalize_cards(session),
    }


@router.delete("/{transaction_id}/cards/{card_id}")
def remove_qr_session_card(
    transaction_id: int,
    card_id: str,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    session = _load_session(db, transaction_id, merchant_id)
    if not session:
        raise HTTPException(status_code=404, detail="QR session no encontrada")

    cards = _normalize_cards(session)
    next_cards = [card for card in cards if card.get("id") != card_id]
    if len(cards) == len(next_cards):
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    session.cards = next_cards
    db.commit()
    db.refresh(session)

    return {
        "transaction_id": session.transaction_id,
        "status": session.status,
        "updated_at": session.updated_at,
        "cards": _normalize_cards(session),
    }
