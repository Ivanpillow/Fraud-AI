from app.services.qr_transaction_service import process_qr_transaction

def test_qr_transaction_flow(db_session):
    tx = {
        "transaction_id": 1,
        "user_id": 1,
        "amount": 1000,
        "merchant_id": 10,
        "country": "MX",
        "latitude": 20.6,
        "longitude": -103.3
    }

    result = process_qr_transaction(db_session, tx)

    assert "decision" in result
    assert result["decision"] in ["allow", "review", "block"]
