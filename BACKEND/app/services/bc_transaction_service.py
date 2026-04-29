import random
import secrets
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Protocol
from zoneinfo import ZoneInfo

import httpx

from app.core.config import settings
from app.db.session import SessionLocal
from app.ml.predictors.fraud_ensemble import predict_fraud_combined
from app.ml.utils.explainability import explain_transaction
from app.models.bc_transaction import BCTransaction
from app.models.fraud_prediction import FraudPrediction
from app.models.transaction import Transaction
from app.models.user import User
from app.models.user_transaction_details import UserTransactionDetails
from app.queries.fraud_explanation_queries import save_explanations
from app.schemas.bc_transaction import BCWebhookEvent
from app.schemas.bc_transaction import BCWalletSimulationRequest
from app.services.transaction_detail_service import save_user_transaction_details
from app.services.user_behavior_service import (
    calculate_amount_vs_avg,
    calculate_risk_score_rule,
    get_user_stats,
    update_failed_attempts,
    update_user_avg_amount,
    update_user_behavior,
)

MEXICO_CITY_TZ = ZoneInfo("America/Mexico_City")
FINAL_STATUSES = {"confirmed", "failed"}


@dataclass
class ProviderPaymentDraft:
    provider: str
    provider_reference: str


class BlockchainProvider(Protocol):
    name: str

    def create_payment_reference(
        self,
        payment_id: int,
        amount: float,
        asset_symbol: str,
        network: str,
    ) -> ProviderPaymentDraft:
        ...

    def confirmation_delay_seconds(self) -> int:
        ...

    def build_tx_hash(self, network: str) -> str:
        ...


class FakeBlockchainProvider:
    name = "fake_blockchain"

    def create_payment_reference(
        self,
        payment_id: int,
        amount: float,
        asset_symbol: str,
        network: str,
    ) -> ProviderPaymentDraft:
        random_part = secrets.token_hex(6)
        reference = f"{asset_symbol.lower()}_{network.lower().replace(' ', '_')}_{payment_id}_{random_part}"
        return ProviderPaymentDraft(provider=self.name, provider_reference=reference)

    def confirmation_delay_seconds(self) -> int:
        min_sec = max(1, int(settings.BC_CONFIRMATION_MIN_SECONDS))
        max_sec = max(min_sec, int(settings.BC_CONFIRMATION_MAX_SECONDS))
        return random.randint(min_sec, max_sec)

    def build_tx_hash(self, network: str) -> str:
        prefix = "0x"
        if network.strip().lower().startswith("bitcoin"):
            prefix = "btc_"
        return f"{prefix}{secrets.token_hex(32)}"


def _get_provider() -> BlockchainProvider:
    provider_name = (settings.BC_PROVIDER_NAME or "fake_blockchain").strip().lower()
    if provider_name == "fake_blockchain":
        return FakeBlockchainProvider()

    # Fallback conservador para evitar interrupciones por configuración inválida.
    return FakeBlockchainProvider()


def _ensure_user_exists(db, tx_data: dict) -> None:
    user_id = int(tx_data["user_id"])
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        return

    country = str(tx_data.get("country") or "MX").upper()[:5]
    amount = float(tx_data.get("amount") or 0.0)

    db.add(
        User(
            user_id=user_id,
            country=country,
            avg_amount_user=round(max(amount, 0.0), 2),
            risk_profile="medium",
        )
    )
    db.flush()


def _first_non_empty(*values: Any) -> str | None:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return None


def _get_payment_shipping_details(payment: BCTransaction) -> dict[str, Any]:
    request_payload = payment.request_payload or {}
    return {
        "shipping_country": _first_non_empty(
            request_payload.get("shipping_country"),
            request_payload.get("shippingCountry"),
        ),
        "shipping_state": _first_non_empty(
            request_payload.get("shipping_state"),
            request_payload.get("shippingState"),
        ),
        "shipping_city": _first_non_empty(
            request_payload.get("shipping_city"),
            request_payload.get("shippingCity"),
        ),
        "shipping_postal_code": _first_non_empty(
            request_payload.get("shipping_postal_code"),
            request_payload.get("shippingZip"),
            request_payload.get("shipping_zip"),
        ),
        "shipping_street": _first_non_empty(
            request_payload.get("shipping_street"),
            request_payload.get("shippingStreet"),
            request_payload.get("shipping_address"),
            request_payload.get("shippingAddress"),
        ),
        "shipping_reference": _first_non_empty(
            request_payload.get("shipping_reference"),
            request_payload.get("shippingReference"),
        ),
        "shipping_full_name": _first_non_empty(
            request_payload.get("shipping_full_name"),
            request_payload.get("shippingName"),
        ),
        "shipping_phone": _first_non_empty(
            request_payload.get("shipping_phone"),
            request_payload.get("shippingPhone"),
        ),
    }


def _score_bc_decision(features: dict, model_result: dict, is_new_user: bool) -> tuple[str, float, float]:
    stacked_prob = float(model_result["final_score"])
    logistic_prob = float(model_result["logistic_probability"])
    rf_prob = float(model_result["rf_probability"])

    risk_rule = calculate_risk_score_rule(
        amount_vs_avg=float(features["amount_vs_avg"]),
        transactions_last_24h=int(features["transactions_last_24h"]),
        failed_attempts=int(features["failed_attempts"]),
        is_international=bool(features["is_international"]),
        hour=int(features["hour"]),
        channel="blockchain",
        card_tx_last_24h=int(features["card_tx_last_24h"]),
        qr_tx_last_24h=int(features["qr_tx_last_24h"]),
    )

    decision_score = (0.45 * stacked_prob) + (0.40 * logistic_prob) + (0.15 * rf_prob)

    if risk_rule >= 0.55:
        decision_score += 0.08
    elif risk_rule >= 0.40:
        decision_score += 0.04

    if int(features["failed_attempts"]) >= 2:
        decision_score += 0.04
    if float(features["amount_vs_avg"]) >= 2.2:
        decision_score += 0.04

    decision_score = max(0.0, min(decision_score, 1.0))

    block_threshold = 0.80 if is_new_user else 0.76
    review_threshold = 0.50

    if decision_score >= block_threshold:
        decision = "block"
    elif decision_score >= review_threshold:
        decision = "review"
    else:
        decision = "allow"

    if (
        decision == "block"
        and float(features["amount_vs_avg"]) < 1.25
        and int(features["failed_attempts"]) == 0
        and int(features["transactions_last_24h"]) <= 6
        and not bool(features["is_international"])
    ):
        decision = "review"

    return decision, round(risk_rule, 4), round(decision_score, 4)


def _evaluate_allow_confidence(
    decision: str,
    prob: float,
    decision_score: float,
    risk_score_rule: float,
    features: dict,
    is_new_user: bool
) -> tuple[str | None, bool]:
    """
    Evalúa la confianza de un ALLOW para determinar si se finaliza automáticamente o requiere revisión.
    
    Retorna: (final_decision, reviewed)
    - ('allow', True): Auto-finalizar con confianza alta
    - (None, False): Requiere revisión humana (incertidumbre)
    - (None, False): Para review/block, nunca se auto-finaliza
    """
    
    if decision != "allow":
        return None, False
    
    # Criterios de confianza para auto-finalizar
    # 1. Probabilidad de fraude baja (bajo riesgo)
    prob_is_safe = prob < 0.35
    
    # 2. Usuario establecido (no es nuevo)
    user_is_established = not is_new_user  # transactions_last_24h >= 3
    
    # 3. Monto normal (cercano al promedio)
    amount_is_normal = float(features["amount_vs_avg"]) < 1.5
    
    # 4. Sin intentos fallidos recientes
    no_failed_attempts = int(features["failed_attempts"]) == 0
    
    # 5. Risk score bajo (reglas heurísticas tranquilas) - muy estricto para blockchain
    risk_score_is_low = risk_score_rule < 0.30
    
    # 6. Transacción nacional o en horario normal
    is_domestic = not bool(features["is_international"])
    normal_hour = int(features["hour"]) >= 6 and int(features["hour"]) <= 23
    geo_friendly = is_domestic or normal_hour
    
    # Contador de factores seguros
    confidence_factors = 0
    if prob_is_safe:
        confidence_factors += 1
    if user_is_established:
        confidence_factors += 1
    if amount_is_normal:
        confidence_factors += 1
    if no_failed_attempts:
        confidence_factors += 1
    if risk_score_is_low:
        confidence_factors += 1
    if geo_friendly:
        confidence_factors += 1
    
    # Lógica híbrida: Blockchain es más estricto que QR y Card
    # - Si >= 5 factores seguros: auto-finalizar (confianza alta)
    # - Sino: requiere revisión humana
    
    if confidence_factors >= 5:
        return "allow", True
    else:
        # Requiere intervención humana
        return None, False


def _build_status_response(payment: BCTransaction) -> dict[str, Any]:
    fraud_result = None
    if payment.fraud_transaction_id and payment.fraud_decision:
        fraud_result = {
            "transaction_id": int(payment.fraud_transaction_id),
            "fraud_probability": float(payment.fraud_probability or 0.0),
            "decision": payment.fraud_decision,
            "model_scores": (payment.request_payload or {}).get("fraud_model_scores", {}),
            "explanations": (payment.request_payload or {}).get("fraud_explanations"),
        }

    return {
        "payment_id": int(payment.payment_id),
        "provider": payment.provider,
        "provider_reference": payment.provider_reference,
        "status": payment.status,
        "status_reason": payment.status_reason,
        "amount": float(payment.amount),
        "fiat_currency": payment.fiat_currency,
        "asset_symbol": payment.asset_symbol,
        "network": payment.network,
        "wallet_address": payment.wallet_address,
        "tx_hash": payment.tx_hash,
        "confirmations": int(payment.confirmations or 0),
        "required_confirmations": int(payment.required_confirmations or 0),
        "created_at": payment.created_at,
        "updated_at": payment.updated_at,
        "confirmed_at": payment.confirmed_at,
        "failed_at": payment.failed_at,
        **_get_payment_shipping_details(payment),
        "fraud_result": fraud_result,
    }


def _build_payment_record(db, tx_data: dict, merchant_id: int) -> BCTransaction:
    provider = _get_provider()
    payment_id = int(datetime.utcnow().timestamp() * 1_000_000)

    draft = provider.create_payment_reference(
        payment_id=payment_id,
        amount=float(tx_data["amount"]),
        asset_symbol=str(tx_data.get("asset_symbol") or "BTC"),
        network=str(tx_data.get("network") or "Bitcoin"),
    )

    request_payload = {
        **tx_data,
        "provider_reference": draft.provider_reference,
    }

    bc_payment = BCTransaction(
        payment_id=payment_id,
        merchant_id=merchant_id,
        user_id=tx_data["user_id"],
        amount=tx_data["amount"],
        fiat_currency="MXN",
        asset_symbol=str(tx_data.get("asset_symbol") or "BTC"),
        network=str(tx_data.get("network") or "Bitcoin"),
        wallet_address=tx_data.get("wallet_address"),
        provider=draft.provider,
        provider_reference=draft.provider_reference,
        status="pending",
        status_reason="awaiting_wallet_selection",
        confirmations=0,
        required_confirmations=int(settings.BC_REQUIRED_CONFIRMATIONS),
        request_payload=request_payload,
    )

    db.add(bc_payment)
    db.commit()
    db.refresh(bc_payment)
    return bc_payment


def _send_internal_webhook(payload: dict[str, Any]) -> None:
    try:
        with httpx.Client(timeout=10.0) as client:
            client.post(
                settings.BC_INTERNAL_WEBHOOK_URL,
                json=payload,
                headers={"X-BC-Webhook-Secret": settings.BC_INTERNAL_WEBHOOK_SECRET},
            )
    except Exception:
        # El estado final se mantiene con fallback local para no dejar pagos colgados.
        db = SessionLocal()
        try:
            apply_internal_webhook_event(db, payload)
        finally:
            db.close()


def _simulate_blockchain_confirmation(payment_id: int, tx_data: dict, merchant_id: int) -> None:
    provider = _get_provider()
    delay = provider.confirmation_delay_seconds()
    half_delay = max(1, delay // 2)

    time.sleep(half_delay)
    _send_internal_webhook(
        {
            "event_type": "payment.confirming",
            "payment_id": payment_id,
            "provider": provider.name,
            "provider_reference": tx_data["provider_reference"],
            "status": "confirming",
            "confirmations": 1,
            "required_confirmations": int(settings.BC_REQUIRED_CONFIRMATIONS),
        }
    )

    time.sleep(max(1, delay - half_delay))

    db = SessionLocal()
    try:
        fraud_result = _run_blockchain_fraud_analysis(db, tx_data, merchant_id)
        decision = str(fraud_result["decision"] or "").lower().strip()
        tx_hash = provider.build_tx_hash(tx_data["network"])

        if decision == "block":
            final_status = "failed"
            status_reason = "fraud_blocked"
        elif decision == "review":
            final_status = "failed"
            status_reason = "manual_review_required"
        else:
            final_status = "confirmed"
            status_reason = "onchain_confirmed"

        _send_internal_webhook(
            {
                "event_type": f"payment.{final_status}",
                "payment_id": payment_id,
                "provider": provider.name,
                "provider_reference": tx_data["provider_reference"],
                "status": final_status,
                "status_reason": status_reason,
                "tx_hash": tx_hash,
                "confirmations": int(settings.BC_REQUIRED_CONFIRMATIONS),
                "required_confirmations": int(settings.BC_REQUIRED_CONFIRMATIONS),
                "fraud_result": fraud_result,
            }
        )
    finally:
        db.close()


def _run_blockchain_fraud_analysis(db, tx_data: dict, merchant_id: int) -> dict[str, Any]:
    _ensure_user_exists(db, tx_data)

    tx_hour = int(tx_data["hour"]) % 24
    tx_day_of_week = int(tx_data["day_of_week"])
    if tx_day_of_week < 1 or tx_day_of_week > 7:
        tx_day_of_week = ((tx_day_of_week - 1) % 7) + 1

    model_day_of_week = (tx_day_of_week - 1) % 7

    transaction_id = int(datetime.utcnow().timestamp() * 1_000_000)

    transaction = Transaction(
        transaction_id=transaction_id,
        user_id=tx_data["user_id"],
        merchant_id=merchant_id,
        amount=tx_data["amount"],
        currency="MXN",
        timestamp=datetime.now(timezone.utc),
        hour=tx_hour,
        day_of_week=tx_day_of_week,
        country=tx_data["country"],
        is_international=tx_data["is_international"],
        device_type=tx_data["device_type"],
    )

    db.add(transaction)
    db.flush()
    save_user_transaction_details(db, tx_data, transaction.transaction_id, tx_data["user_id"], "blockchain")

    user_stats = get_user_stats(db, tx_data["user_id"])
    is_new_user = user_stats["transactions_last_24h"] < 3

    features = {
        "amount": tx_data["amount"],
        "amount_vs_avg": tx_data["amount_vs_avg"],
        "transactions_last_24h": user_stats["transactions_last_24h"],
        "card_tx_last_24h": user_stats["card_tx_last_24h"],
        "qr_tx_last_24h": user_stats["qr_tx_last_24h"],
        "hour": tx_hour,
        "day_of_week": model_day_of_week,
        "failed_attempts": user_stats["failed_attempts"],
        "is_international": tx_data["is_international"],
    }

    features["transactions_last_24h"] = min(features["transactions_last_24h"], 10)
    features["card_tx_last_24h"] = min(features["card_tx_last_24h"], 10)
    features["qr_tx_last_24h"] = min(features["qr_tx_last_24h"], 10)

    for key, value in features.items():
        if value is None:
            features[key] = 0

    result = predict_fraud_combined(features)
    prediction = result["label"]
    prob = float(result["final_score"])

    decision, risk_score_rule, decision_score = _score_bc_decision(features, result, is_new_user)

    # Evaluación de confianza para ALLOW: determinar si se auto-finaliza o requiere revisión
    final_decision, reviewed = _evaluate_allow_confidence(
        decision=decision,
        prob=prob,
        decision_score=decision_score,
        risk_score_rule=risk_score_rule,
        features=features,
        is_new_user=is_new_user
    )

    fraud_pred = FraudPrediction(
        transaction_id=transaction.transaction_id,
        merchant_id=merchant_id,
        channel="blockchain",
        model_version="RF_LG_v2_bc_async",
        fraud_probability=prob,
        prediction_label=prediction,
        risk_score_rule=risk_score_rule,
        decision=decision,
        final_decision=final_decision,
        reviewed=reviewed,
        rf_probability=result["rf_probability"],
        logistic_probability=result["logistic_probability"],
        kmeans_score=result["kmeans_score"],
    )

    db.add(fraud_pred)
    db.flush()

    # Actualizar promedio usuario: sólo cuando la transacción fue aprobada (allow).
    if decision == "allow":
        update_user_avg_amount(
            db=db,
            user_id=tx_data["user_id"],
            amount=tx_data["amount"],
        )

    update_user_behavior(
        db=db,
        user_id=tx_data["user_id"],
        amount=tx_data["amount"],
        avg_amount_user=user_stats["avg_amount_user"],
        channel="card",
    )

    explanations = None
    if max(prob, decision_score) >= 0.30:
        logistic_features = {
            "amount": features["amount"],
            "amount_vs_avg": features["amount_vs_avg"],
            "transactions_last_24h": features["transactions_last_24h"],
            "card_tx_last_24h": features["card_tx_last_24h"],
            "qr_tx_last_24h": features["qr_tx_last_24h"],
            "hour": features["hour"],
            "day_of_week": features["day_of_week"],
            "failed_attempts": features["failed_attempts"],
            "is_international": features["is_international"],
        }

        explanations = explain_transaction(logistic_features)

        if explanations:
            save_explanations(
                db=db,
                prediction_id=fraud_pred.prediction_id,
                explanations=explanations,
            )

    update_failed_attempts(
        db=db,
        user_id=tx_data["user_id"],
        decision=decision,
    )

    db.commit()

    return {
        "transaction_id": int(transaction.transaction_id),
        "fraud_probability": prob,
        "decision": decision,
        "model_scores": {
            "random_forest": round(result["rf_probability"], 4),
            "logistic_regression": round(result["logistic_probability"], 4),
            "kmeans_anomaly": round(result["kmeans_score"], 4),
        },
        "explanations": explanations,
    }


def process_bc_transaction(db, tx_data, merchant_id, background_tasks=None):
    try:
        _ensure_user_exists(db, tx_data)
        bc_payment = _build_payment_record(db, tx_data, merchant_id)
        tx_data_for_simulation = dict(bc_payment.request_payload or {})

        if background_tasks is not None:
            background_tasks.add_task(
                _simulate_blockchain_confirmation,
                int(bc_payment.payment_id),
                tx_data_for_simulation,
                merchant_id,
            )

        return _build_status_response(bc_payment)
    except Exception as e:
        db.rollback()
        raise e


def process_bc_transaction_simple(db, tx_data, merchant_id, background_tasks=None):
    try:
        _ensure_user_exists(db, tx_data)

        now = datetime.now(MEXICO_CITY_TZ)
        hour_raw = tx_data.get("hour")
        day_of_week_raw = tx_data.get("day_of_week")

        hour = now.hour if hour_raw is None else int(hour_raw)
        day_of_week = now.isoweekday() if day_of_week_raw is None else int(day_of_week_raw)

        hour = hour % 24
        if day_of_week < 1 or day_of_week > 7:
            day_of_week = ((day_of_week - 1) % 7) + 1

        full_tx = {
            **tx_data,
            "hour": hour,
            "day_of_week": day_of_week,
            "asset_symbol": str(tx_data.get("asset_symbol") or "BTC").upper(),
            "network": str(tx_data.get("network") or "Bitcoin"),
        }

        bc_payment = _build_payment_record(db, full_tx, merchant_id)
        return _build_status_response(bc_payment)
    except Exception as e:
        db.rollback()
        raise e


def get_bc_payment_status(db, payment_id: int, merchant_id: int | None = None) -> dict[str, Any] | None:
    query = db.query(BCTransaction).filter(BCTransaction.payment_id == payment_id)
    if merchant_id is not None:
        query = query.filter(BCTransaction.merchant_id == merchant_id)

    payment = query.first()
    if not payment:
        return None

    return _build_status_response(payment)


def simulate_bc_wallet_payment(
    db,
    payment_id: int,
    wallet_request: BCWalletSimulationRequest,
    background_tasks=None,
) -> dict[str, Any] | None:
    payment = db.query(BCTransaction).filter(BCTransaction.payment_id == payment_id).first()
    if not payment:
        return None

    if payment.status.lower().strip() in FINAL_STATUSES:
        return _build_status_response(payment)

    request_payload = dict(payment.request_payload or {})
    request_payload["wallet_address"] = wallet_request.wallet_address.strip()
    if wallet_request.wallet_name:
        request_payload["wallet_name"] = wallet_request.wallet_name.strip()

    payment.wallet_address = wallet_request.wallet_address.strip()
    payment.request_payload = request_payload
    payment.status = "confirming"
    payment.status_reason = "wallet_selected"
    payment.confirmations = max(int(payment.confirmations or 0), 1)
    db.commit()
    db.refresh(payment)

    if background_tasks is not None:
        background_tasks.add_task(
            _simulate_blockchain_confirmation,
            int(payment.payment_id),
            request_payload,
            int(payment.merchant_id),
        )

    return _build_status_response(payment)


def get_bc_payments_by_wallet(db, wallet_address: str) -> list[dict[str, Any]]:
    payments = (
        db.query(BCTransaction)
        .filter(BCTransaction.wallet_address == wallet_address)
        .order_by(BCTransaction.created_at.desc())
        .all()
    )
    return [_build_status_response(payment) for payment in payments]


def apply_internal_webhook_event(db, payload: dict[str, Any]) -> dict[str, Any] | None:
    event = BCWebhookEvent(**payload)
    payment = db.query(BCTransaction).filter(BCTransaction.payment_id == event.payment_id).first()
    if not payment:
        return None

    incoming_status = event.status.lower().strip()
    current_status = payment.status.lower().strip()

    if current_status in FINAL_STATUSES:
        return _build_status_response(payment)

    payment.status = incoming_status
    payment.status_reason = event.status_reason

    if event.tx_hash:
        payment.tx_hash = event.tx_hash

    if event.confirmations is not None:
        payment.confirmations = int(event.confirmations)

    if event.required_confirmations is not None:
        payment.required_confirmations = int(event.required_confirmations)

    now_utc = datetime.now(timezone.utc)
    if incoming_status == "confirmed":
        payment.confirmed_at = now_utc
    elif incoming_status == "failed":
        payment.failed_at = now_utc

    if event.fraud_result:
        fraud_result = event.fraud_result.model_dump()
        request_payload = dict(payment.request_payload or {})
        request_payload["fraud_model_scores"] = fraud_result.get("model_scores", {})
        request_payload["fraud_explanations"] = fraud_result.get("explanations")
        payment.request_payload = request_payload

        payment.fraud_transaction_id = int(fraud_result["transaction_id"])
        payment.fraud_decision = str(fraud_result["decision"])
        payment.fraud_probability = float(fraud_result["fraud_probability"])

    db.commit()
    db.refresh(payment)
    return _build_status_response(payment)
