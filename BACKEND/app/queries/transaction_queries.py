from sqlalchemy.orm import Session
from app.models.transaction import Transaction

def create_transaction(db: Session, tx: Transaction):
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