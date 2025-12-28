from sqlalchemy import func
from app.models.transaction import Transaction
from app.queries.user_behavior_queries import create_or_update_user_behavior

def update_user_behavior(db, user_id: int, amount: float, avg_amount_user: float):
    # Número de transacciones en las últimas 24h
    tx_count_24h = (
        db.query(func.count(Transaction.transaction_id))
        .filter(Transaction.user_id == user_id)
        .scalar()
    )

    # Amount vs avg
    amount_vs_avg = amount / avg_amount_user if avg_amount_user > 0 else 0

    # Failed attempts
    failed_attempts = 0  # luego se conecta a la lógica real

    return create_or_update_user_behavior(
        db=db,
        user_id=user_id,
        transactions_last_24h=tx_count_24h,
        failed_attempts=failed_attempts,
        amount_vs_avg=amount_vs_avg
    )