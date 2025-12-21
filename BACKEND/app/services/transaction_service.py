from app.models.transaction import Transaction
from app.services.fraud_service import analyze_transaction

def process_transaction(db, tx_data):
    result = analyze_transaction(tx_data)

    tx = Transaction(**tx_data, is_fraud=result["prediction"])
    db.add(tx)
    db.commit()

    return result