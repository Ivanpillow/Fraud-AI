from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.queries.user_behavior_queries import create_or_update_user_behavior
from app.models.user_behavior_features import UserBehaviorFeatures
from app.models.user import User

def update_user_behavior(
    db: Session,
    user_id: int,
    amount: float,
    avg_amount_user: float | None = None
):
    """
    Actualiza el estado agregado de comportamiento del usuario
    DESPUÉS de procesar una transacción.
    """

    # Obtener registro actual si es que existe
    behavior = (
        db.query(UserBehaviorFeatures)
        .filter(UserBehaviorFeatures.user_id == user_id)
        .first()
    )

    # Calcular transactions_last_24h 
    since = datetime.utcnow() - timedelta(hours=24)

    tx_count_24h = (
        db.query(func.count(Transaction.transaction_id))
        .filter(
            Transaction.user_id == user_id,
            Transaction.timestamp >= since
        )
        .scalar()
    )

    # Calcular amount_vs_avg solamente informativo
    amount_vs_avg = (
        amount / avg_amount_user if avg_amount_user and avg_amount_user > 0 else 0
    )

    # Inicializar si no existe
    if not behavior:
        behavior = UserBehaviorFeatures(
            user_id=user_id,
            transactions_last_24h=tx_count_24h,
            failed_attempts=0,
            amount_vs_avg=amount_vs_avg
        )
        db.add(behavior)
    else:
        behavior.transactions_last_24h = tx_count_24h
        behavior.amount_vs_avg = amount_vs_avg
        # failed_attempts se mantiene o se actualiza por otra lógica

    db.commit()
    db.refresh(behavior)

    return behavior


def update_user_avg_amount(
    db,
    user_id: int,
    amount: float,
    alpha: float = 0.1
):
    """
    Actualiza el avg_amount_user usando un promedio móvil exponencial.

    alpha:
      - 0.1 → aprende lento (más estable)
      - 0.2 → aprende más rápido
    """

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

    db.commit()



def get_user_stats(db: Session, user_id: int) -> dict:
    """
    Obtiene estadísticas de comportamiento del usuario.
    Devuelve valores seguros incluso para usuarios nuevos.
    """

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
            "failed_attempts": 0,
            "avg_amount_user": float(user.avg_amount_user or 0.0),
        }

    return {
        "transactions_last_24h": behavior.transactions_last_24h or 0,
        "failed_attempts": behavior.failed_attempts or 0,
        "avg_amount_user": float(user.avg_amount_user or 0.0),
    }


def calculate_amount_vs_avg(
    amount: float,
    avg_amount_user: float,
    min_avg: float = 50.0,
    max_ratio: float = 10.0
) -> float:
    """
    Calcula el ratio amount_vs_avg de forma segura y estable.

    - min_avg: evita inflar ratios en usuarios nuevos
    - max_ratio: evita outliers extremos
    """

    if amount <= 0:
        return 0.0

    # Protección para usuarios nuevos o promedios muy bajos
    effective_avg = max(avg_amount_user or 0.0, min_avg)

    ratio = amount / effective_avg

    # Cap para evitar valores extremos
    return round(min(ratio, max_ratio), 2)



def calculate_risk_score_rule(
    amount_vs_avg: float,
    transactions_last_24h: int,
    failed_attempts: int,
    is_international: bool,
    hour: int
) -> float:
    """
    Calcula un score heurístico de riesgo basado en reglas.
    Retorna un valor entre 0 y 1.
    """

    score = 0.0

    # Riesgo por monto
    if amount_vs_avg >= 3:
        score += 0.30
    elif amount_vs_avg >= 2:
        score += 0.20

    # Riesgo por frecuencia
    if transactions_last_24h == 0:
        score += 0.10
    elif transactions_last_24h >= 10:
        score += 0.25
    elif transactions_last_24h >= 5:
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