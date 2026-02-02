from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.qr_transaction import QRTransaction

def create_transaction(db, tx):
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def get_recent_transactions(db: Session, limit: int = 50):
    return (
        db.query(Transaction)
        .order_by(Transaction.transaction_id.desc())
        .limit(limit)
        .all()
    )

def create_qr_transaction(db, qr_tx):
    db.add(qr_tx)
    db.commit()
    db.refresh(qr_tx)
    return qr_tx

def get_qr_transaction(db: Session, limit: int = 50):
    return(
        db.query(QRTransaction)
        .order_by(QRTransaction.transaction_id.desc())
        .limit(limit)
        .all()
    )