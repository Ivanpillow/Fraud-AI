import pytest

from app.services.qr_transaction_service import _decide_qr_action, _validate_qr_inputs


def test_validate_qr_inputs_rejects_invalid_latitude():
    tx = {
        "user_id": 1,
        "merchant_id": 1,
        "amount": 100,
        "country": "mx",
        "latitude": 100.0,
        "longitude": -103.3,
    }

    with pytest.raises(ValueError, match="latitud"):
        _validate_qr_inputs(tx)


def test_decide_qr_blocks_high_rule_risk_even_with_mid_probability():
    features = {
        "amount_vs_avg": 2.5,
        "failed_attempts": 3,
        "is_international": True,
        "transactions_last_24h": 0,
    }

    decision = _decide_qr_action(
        prob=0.42,
        is_new_user=True,
        features=features,
        risk_score_rule=0.70,
    )

    assert decision == "block"


def test_decide_qr_reviews_when_rule_risk_is_moderate():
    features = {
        "amount_vs_avg": 1.3,
        "failed_attempts": 0,
        "is_international": False,
        "transactions_last_24h": 4,
    }

    decision = _decide_qr_action(
        prob=0.21,
        is_new_user=False,
        features=features,
        risk_score_rule=0.52,
    )

    assert decision == "review"


def test_decide_qr_allows_clean_low_risk_case():
    features = {
        "amount_vs_avg": 0.8,
        "failed_attempts": 0,
        "is_international": False,
        "transactions_last_24h": 8,
    }

    decision = _decide_qr_action(
        prob=0.12,
        is_new_user=False,
        features=features,
        risk_score_rule=0.20,
    )

    assert decision == "allow"
