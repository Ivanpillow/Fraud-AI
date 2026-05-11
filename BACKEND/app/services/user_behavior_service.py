from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.qr_transaction import QRTransaction
from app.models.user_behavior_features import UserBehaviorFeatures
from app.models.user import User

def update_user_behavior(
    db: Session,
    user_id: int,
    amount: float,
    avg_amount_user: float | None = None,
    channel: str = "card"  # card o qr
):
   # Segun el canal se actualiza el usuario

    # Obtener registro actual si es que existe
    behavior = (
        db.query(UserBehaviorFeatures)
        .filter(UserBehaviorFeatures.user_id == user_id)
        .first()
    )

    # Calcular transactions_last_24h 
    since = datetime.now(timezone.utc) - timedelta(hours=24)

    # Conteo total (tarjeta + QR)
    card_count = (
        db.query(func.count(Transaction.transaction_id))
        .filter(
            Transaction.user_id == user_id,
            Transaction.timestamp >= since
        )
        .scalar()
    )

    qr_count = (
        db.query(func.count(QRTransaction.transaction_id))
        .filter(
            QRTransaction.user_id == user_id,
            QRTransaction.created_at >= since
        )
        .scalar()
    )

    total_count = card_count + qr_count

    # Calcular amount_vs_avg es solamente informativo
    amount_vs_avg = (
        amount / avg_amount_user if avg_amount_user and avg_amount_user > 0 else 0
    )

    # Inicializar si no existe
    if not behavior:
        behavior = UserBehaviorFeatures(
            user_id=user_id,
            transactions_last_24h=total_count,
            card_tx_last_24h=card_count,
            qr_tx_last_24h=qr_count,
            failed_attempts=0,
            amount_vs_avg=amount_vs_avg
        )
        db.add(behavior)
    else:
        behavior.transactions_last_24h = total_count
        behavior.card_tx_last_24h = card_count
        behavior.qr_tx_last_24h = qr_count
        behavior.amount_vs_avg = amount_vs_avg
        # failed_attempts se mantiene o se actualiza por otra lógica

    db.flush()
    db.refresh(behavior)

    return behavior


def update_failed_attempts(
    db: Session,
    user_id: int,
    decision: str,
    max_failed_attempts: int = 10,
) -> int:
    """
    Actualiza failed_attempts de manera consistente según la decisión:
    - allow  -> reduce agresividad (resetea a 0)
    - review -> incrementa en 1
    - block  -> incrementa en 2
    Retorna el valor actualizado.
    """

    behavior = (
        db.query(UserBehaviorFeatures)
        .filter(UserBehaviorFeatures.user_id == user_id)
        .first()
    )

    if not behavior:
        behavior = UserBehaviorFeatures(
            user_id=user_id,
            transactions_last_24h=0,
            card_tx_last_24h=0,
            qr_tx_last_24h=0,
            failed_attempts=0,
            amount_vs_avg=0,
        )
        db.add(behavior)
        db.flush()

    current = int(behavior.failed_attempts or 0)
    decision_norm = str(decision or "").lower().strip()

    if decision_norm == "allow":
        updated = 0
    elif decision_norm == "review":
        updated = min(current + 1, max_failed_attempts)
    elif decision_norm == "block":
        updated = min(current + 2, max_failed_attempts)
    else:
        updated = current

    behavior.failed_attempts = updated
    db.flush()

    return updated


def update_user_avg_amount(
    db,
    user_id: int,
    amount: float,
    alpha: float = 0.1
):
    
    # Actualiza el avg_amount_user usando un promedio móvil exponencial.

    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        return

    # Usuario nuevo o sin promedio
    if user.avg_amount_user is None or float(user.avg_amount_user) <= 0:
        user.avg_amount_user = round(amount, 2)
    else:
        prev_avg = float(user.avg_amount_user)

        # EMA
        new_avg = (prev_avg * (1 - alpha)) + (amount * alpha)
        user.avg_amount_user = round(new_avg, 2)

    db.flush()



def get_user_stats(db: Session, user_id: int) -> dict:

    # Obtener usuario
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise ValueError(f"Usuario {user_id} no existe")

    # Obtener comportamiento agregado
    behavior = (
        db.query(UserBehaviorFeatures)
        .filter(UserBehaviorFeatures.user_id == user_id)
        .first()
    )

    # Valores por defecto (usuario nuevo)
    if not behavior:
        return {
            "transactions_last_24h": 0,
            "card_tx_last_24h": 0,
            "qr_tx_last_24h": 0,
            "failed_attempts": 0,
            "avg_amount_user": float(user.avg_amount_user or 0.0),
        }

    return {
        "transactions_last_24h": behavior.transactions_last_24h or 0,
        "card_tx_last_24h": behavior.card_tx_last_24h or 0,
        "qr_tx_last_24h": behavior.qr_tx_last_24h or 0,
        "failed_attempts": behavior.failed_attempts or 0,
        "avg_amount_user": float(user.avg_amount_user or 0.0),
    }


def calculate_amount_vs_avg(
    amount: float,
    avg_amount_user: float,
    min_avg: float = 50.0,
    max_ratio: float = 10.0
) -> float:
    # Calcula el ratio amount_vs_avg de forma segura y estable.

    if amount <= 0:
        return 0.0

    # Protección para usuarios nuevos o promedios muy bajos
    effective_avg = max(avg_amount_user or 0.0, min_avg)

    ratio = amount / effective_avg

    # Cap para evitar valores extremos
    return round(min(ratio, max_ratio), 2)


def _summarize_amounts(amounts: list[float]) -> dict:
    cleaned = [float(value) for value in amounts if value is not None and float(value) > 0]
    if not cleaned:
        return {"count": 0, "avg": 0.0, "max": 0.0, "p95": 0.0}

    cleaned.sort()
    count = len(cleaned)
    avg = round(sum(cleaned) / count, 2)
    max_amount = round(cleaned[-1], 2)
    p95_index = int(round(0.95 * (count - 1)))
    p95_amount = round(cleaned[p95_index], 2)

    return {
        "count": count,
        "avg": avg,
        "max": max_amount,
        "p95": p95_amount,
    }


def get_user_amount_history_stats(
    db: Session,
    user_id: int,
    lookback_days: int = 90,
    limit: int = 200,
) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=lookback_days)

    card_amounts = (
        db.query(Transaction.amount)
        .filter(
            Transaction.user_id == user_id,
            Transaction.timestamp >= since,
        )
        .order_by(Transaction.timestamp.desc())
        .limit(limit)
        .all()
    )

    qr_amounts = (
        db.query(QRTransaction.amount)
        .filter(
            QRTransaction.user_id == user_id,
            QRTransaction.created_at >= since,
        )
        .order_by(QRTransaction.created_at.desc())
        .limit(limit)
        .all()
    )

    amounts = [row[0] for row in card_amounts] + [row[0] for row in qr_amounts]
    return _summarize_amounts(amounts)


def get_merchant_amount_history_stats(
    db: Session,
    merchant_id: int,
    lookback_days: int = 90,
    limit: int = 200,
) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=lookback_days)

    card_amounts = (
        db.query(Transaction.amount)
        .filter(
            Transaction.merchant_id == merchant_id,
            Transaction.timestamp >= since,
        )
        .order_by(Transaction.timestamp.desc())
        .limit(limit)
        .all()
    )

    qr_amounts = (
        db.query(QRTransaction.amount)
        .filter(
            QRTransaction.merchant_id == merchant_id,
            QRTransaction.created_at >= since,
        )
        .order_by(QRTransaction.created_at.desc())
        .limit(limit)
        .all()
    )

    amounts = [row[0] for row in card_amounts] + [row[0] for row in qr_amounts]
    return _summarize_amounts(amounts)


def get_user_merchant_amount_history_stats(
    db: Session,
    user_id: int,
    merchant_id: int,
    lookback_days: int = 90,
    limit: int = 200,
) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=lookback_days)

    card_amounts = (
        db.query(Transaction.amount)
        .filter(
            Transaction.user_id == user_id,
            Transaction.merchant_id == merchant_id,
            Transaction.timestamp >= since,
        )
        .order_by(Transaction.timestamp.desc())
        .limit(limit)
        .all()
    )

    qr_amounts = (
        db.query(QRTransaction.amount)
        .filter(
            QRTransaction.user_id == user_id,
            QRTransaction.merchant_id == merchant_id,
            QRTransaction.created_at >= since,
        )
        .order_by(QRTransaction.created_at.desc())
        .limit(limit)
        .all()
    )

    amounts = [row[0] for row in card_amounts] + [row[0] for row in qr_amounts]
    return _summarize_amounts(amounts)



def calculate_risk_score_rule(
    amount_vs_avg: float,
    transactions_last_24h: int,
    failed_attempts: int,
    is_international: bool,
    hour: int,
    channel: str,
    card_tx_last_24h: int = 0,
    qr_tx_last_24h: int = 0,
    amount_vs_user_max: float | None = None,
    amount_vs_user_p95: float | None = None,
    amount_vs_merchant_avg: float | None = None,
    amount_vs_user_merchant_avg: float | None = None,
    user_history_count: int = 0,
    merchant_history_count: int = 0,
    user_merchant_history_count: int = 0,
) -> float:
    # Calcula un score heurístico de riesgo basado en reglas para transacciones generales.

    score = 0.0

    # Riesgo por monto
    if amount_vs_avg >= 3:
        score += 0.30
    elif amount_vs_avg >= 2:
        score += 0.20

    if user_history_count >= 5:
        peak_ratio = max(amount_vs_user_max or 0.0, amount_vs_user_p95 or 0.0)
        if peak_ratio >= 4:
            score += 0.35
        elif peak_ratio >= 3:
            score += 0.25
        elif peak_ratio >= 2:
            score += 0.15

    if merchant_history_count >= 20:
        if (amount_vs_merchant_avg or 0.0) >= 3:
            score += 0.20
        elif (amount_vs_merchant_avg or 0.0) >= 2:
            score += 0.10

    if user_merchant_history_count >= 3:
        if (amount_vs_user_merchant_avg or 0.0) >= 3:
            score += 0.20
        elif (amount_vs_user_merchant_avg or 0.0) >= 2:
            score += 0.10

    # Riesgo por frecuencia (dependiente de canal)

    if channel == "card":
        freq = card_tx_last_24h
    elif channel == "qr":
        freq = qr_tx_last_24h
    else:
        freq = transactions_last_24h

    if freq == 0:
        score += 0.10
    elif freq >= 10:
        score += 0.25
    elif freq >= 5:
        score += 0.15

    # Riesgo por intentos fallidos

    if failed_attempts >= 3:
        score += 0.25
    elif failed_attempts >= 1:
        score += 0.10

    # Riesgo internacional
    if is_international:
        score += 0.20

    # Riesgo por horario (madrugada)
    if hour is not None and (hour >= 0 and hour <= 5):
        score += 0.10

    # Asegurar rango [0,1]
    return round(min(score, 1.0), 2)


def calculate_risk_score_rule_qr(
    amount_vs_avg: float,
    qr_scans_last_24h: int,
    device_change_flag: bool,
    failed_attempts: int,
    is_international: bool,
    transactions_last_24h: int,
    geo_distance: float = 0.0,
    amount_vs_user_max: float | None = None,
    amount_vs_user_p95: float | None = None,
    amount_vs_merchant_avg: float | None = None,
    amount_vs_user_merchant_avg: float | None = None,
    user_history_count: int = 0,
    merchant_history_count: int = 0,
    user_merchant_history_count: int = 0,
) -> float:
    # Calcula un score heurístico de riesgo basado en reglas para transacciones QR.
    
    score = 0.0

    # Riesgo por monto
    if amount_vs_avg >= 3:
        score += 0.30
    elif amount_vs_avg >= 2:
        score += 0.20

    if user_history_count >= 5:
        peak_ratio = max(amount_vs_user_max or 0.0, amount_vs_user_p95 or 0.0)
        if peak_ratio >= 4:
            score += 0.30
        elif peak_ratio >= 3:
            score += 0.22
        elif peak_ratio >= 2:
            score += 0.12

    if merchant_history_count >= 20:
        if (amount_vs_merchant_avg or 0.0) >= 3:
            score += 0.18
        elif (amount_vs_merchant_avg or 0.0) >= 2:
            score += 0.10

    if user_merchant_history_count >= 3:
        if (amount_vs_user_merchant_avg or 0.0) >= 3:
            score += 0.18
        elif (amount_vs_user_merchant_avg or 0.0) >= 2:
            score += 0.10

    # Riesgo por distancia geográfica (ESPECÍFICO QR)
    if geo_distance > 50:
        score += 0.30

    # Riesgo por cambio de dispositivo (ESPECÍFICO QR)
    if device_change_flag:
        score += 0.20

    # Riesgo por múltiples escaneos QR (ESPECÍFICO QR)
    if qr_scans_last_24h >= 10:
        score += 0.20
    elif qr_scans_last_24h >= 5:
        score += 0.10

    # Riesgo por intentos fallidos
    if failed_attempts >= 3:
        score += 0.25
    elif failed_attempts >= 1:
        score += 0.10

    # Riesgo internacional
    if is_international:
        score += 0.15

    # Riesgo usuario nuevo
    if transactions_last_24h == 0:
        score += 0.10

    # Asegurar rango [0,1]
    return round(min(score, 1.0), 2)