from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.auth import get_current_user
from app.db.session import get_db
from app.services.metrics_service import collect_metrics, get_dashboard_metrics

from sqlalchemy import func
from app.db.session import get_db
from app.models.transaction import Transaction
from app.models.qr_transaction import QRTransaction
from app.models.bc_transaction import BCTransaction
from app.models.fraud_prediction import FraudPrediction
from datetime import datetime, timedelta

router = APIRouter(prefix="/metrics", tags=["Metrics"])


def _resolve_merchant_scope(user: dict, merchant_id: int | None) -> int:
    user_merchant_id = int(user["merchant_id"])
    is_superadmin = bool(user.get("is_superadmin"))

    if merchant_id is None:
        return user_merchant_id

    if is_superadmin:
        return merchant_id

    if merchant_id != user_merchant_id:
        raise HTTPException(status_code=403, detail="No puedes consultar métricas de otro comercio")

    return user_merchant_id

@router.get("/")
def get_metrics(db: Session = Depends(get_db)):
    return collect_metrics(db)

@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    return get_dashboard_metrics(db)



# Transacciones últimos 7 días
@router.get("/weekly-transactions")
def weekly_transactions(
    merchant_id: int | None = Query(default=None),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    merchant_scope = _resolve_merchant_scope(user, merchant_id)

    today = datetime.utcnow()
    last_7_days = today - timedelta(days=7)

    card_results = (
        db.query(
            func.date(Transaction.timestamp).label("date"),
            func.sum(Transaction.amount).label("total_amount")
        )
        .filter(Transaction.timestamp >= last_7_days)
        .filter(Transaction.merchant_id == merchant_scope)
        .group_by(func.date(Transaction.timestamp))
        .all()
    )

    qr_results = (
        db.query(
            func.date(QRTransaction.created_at).label("date"),
            func.sum(QRTransaction.amount).label("total_amount")
        )
        .filter(QRTransaction.created_at >= last_7_days)
        .filter(QRTransaction.merchant_id == merchant_scope)
        .group_by(func.date(QRTransaction.created_at))
        .all()
    )

    bc_results = (
        db.query(
            func.date(BCTransaction.created_at).label("date"),
            func.sum(BCTransaction.amount).label("total_amount")
        )
        .filter(BCTransaction.created_at >= last_7_days)
        .filter(BCTransaction.merchant_id == merchant_scope)
        .group_by(func.date(BCTransaction.created_at))
        .all()
    )

    totals = {}
    for date, total in card_results:
        if date is None:
            continue
        totals[date] = totals.get(date, 0.0) + float(total or 0)

    for date, total in qr_results:
        if date is None:
            continue
        totals[date] = totals.get(date, 0.0) + float(total or 0)

    for date, total in bc_results:
        if date is None:
            continue
        totals[date] = totals.get(date, 0.0) + float(total or 0)

    return [
        {
            "date": str(date),
            "total": round(total, 2),
        }
        for date, total in sorted(totals.items())
    ]


# Funnel - Transacciones totales vs decisiones del modelo (aceptada, rechazada, revisión) 
@router.get("/fraud-funnel")
def fraud_funnel(
    merchant_id: int | None = Query(default=None),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    merchant_scope = _resolve_merchant_scope(user, merchant_id)

    total = (
        db.query(func.count(FraudPrediction.prediction_id))
        .filter(FraudPrediction.merchant_id == merchant_scope)
        .scalar()
    )

    decisions = (
        db.query(
            FraudPrediction.decision,
            func.count(FraudPrediction.prediction_id)
        )
        .filter(FraudPrediction.merchant_id == merchant_scope)
        .group_by(FraudPrediction.decision)
        .all()
    )

    return {
        "total": total,
        "decisions": [
            {"name": d[0], "value": d[1]}
            for d in decisions
        ]
    }


# Transacciones por país
@router.get("/transactions-by-country")
def transactions_by_country(
    merchant_id: int | None = Query(default=None),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    merchant_scope = _resolve_merchant_scope(user, merchant_id)

    card_results = (
        db.query(
            Transaction.country,
            func.sum(Transaction.amount).label("total_amount")
        )
        .filter(Transaction.merchant_id == merchant_scope)
        .group_by(Transaction.country)
        .all()
    )

    qr_results = (
        db.query(
            QRTransaction.country,
            func.sum(QRTransaction.amount).label("total_amount")
        )
        .filter(QRTransaction.merchant_id == merchant_scope)
        .group_by(QRTransaction.country)
        .all()
    )

    totals: dict[str, float] = {}
    for country, total in card_results:
        if not country:
            continue
        totals[country] = totals.get(country, 0.0) + float(total or 0)

    for country, total in qr_results:
        if not country:
            continue
        totals[country] = totals.get(country, 0.0) + float(total or 0)

    ranked = sorted(totals.items(), key=lambda item: item[1], reverse=True)[:5]

    return [
        {
            "name": country,
            "value": float(total),
        }
        for country, total in ranked
    ]


@router.get("/overview")
def overview_metrics(
    merchant_id: int | None = Query(default=None),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    merchant_scope = _resolve_merchant_scope(user, merchant_id)

    card_user_ids = (
        db.query(Transaction.user_id)
        .filter(Transaction.merchant_id == merchant_scope)
        .distinct()
        .all()
    )
    qr_user_ids = (
        db.query(QRTransaction.user_id)
        .filter(QRTransaction.merchant_id == merchant_scope)
        .distinct()
        .all()
    )
    bc_user_ids = (
        db.query(BCTransaction.user_id)
        .filter(BCTransaction.merchant_id == merchant_scope)
        .distinct()
        .all()
    )

    user_ids = {row[0] for row in card_user_ids}
    user_ids.update(row[0] for row in qr_user_ids)
    user_ids.update(row[0] for row in bc_user_ids)
    total_users = len(user_ids)

    card_total = (
        db.query(func.count(Transaction.transaction_id))
        .filter(Transaction.merchant_id == merchant_scope)
        .scalar()
    ) or 0
    qr_total = (
        db.query(func.count(QRTransaction.transaction_id))
        .filter(QRTransaction.merchant_id == merchant_scope)
        .scalar()
    ) or 0
    bc_total = (
        db.query(func.count(BCTransaction.payment_id))
        .filter(BCTransaction.merchant_id == merchant_scope)
        .scalar()
    ) or 0

    total_transactions = card_total + qr_total + bc_total

    card_revenue = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.merchant_id == merchant_scope)
        .scalar()
    ) or 0
    qr_revenue = (
        db.query(func.sum(QRTransaction.amount))
        .filter(QRTransaction.merchant_id == merchant_scope)
        .scalar()
    ) or 0
    bc_revenue = (
        db.query(func.sum(BCTransaction.amount))
        .filter(BCTransaction.merchant_id == merchant_scope)
        .scalar()
    ) or 0

    total_revenue = float(card_revenue or 0) + float(qr_revenue or 0) + float(bc_revenue or 0)

    fraud_count = (
        db.query(func.count())
        .filter(FraudPrediction.decision == "block")
        .filter(FraudPrediction.merchant_id == merchant_scope)
        .scalar()
    ) or 0
    total_predictions = (
        db.query(func.count())
        .filter(FraudPrediction.merchant_id == merchant_scope)
        .scalar()
    ) or 0
    fraud_rate = (fraud_count / total_predictions) * 100 if total_predictions > 0 else 0
    

    # Decisiones antifraude
    decisions = (
        db.query(FraudPrediction.decision, func.count())
        .filter(FraudPrediction.merchant_id == merchant_scope)
        .group_by(FraudPrediction.decision)
        .all()
    )
    decision_map = {d[0]: d[1] for d in decisions}

    # Transacciones por hora
    card_by_hour = (
        db.query(
            Transaction.hour,
            func.sum(Transaction.amount),
            func.count(Transaction.transaction_id)
        )
        .filter(Transaction.merchant_id == merchant_scope)
        .group_by(Transaction.hour)
        .all()
    )

    qr_by_hour = (
        db.query(
            QRTransaction.hour,
            func.sum(QRTransaction.amount),
            func.count(QRTransaction.transaction_id)
        )
        .filter(QRTransaction.merchant_id == merchant_scope)
        .group_by(QRTransaction.hour)
        .all()
    )

    bc_by_hour = (
        db.query(
            func.extract("hour", BCTransaction.created_at).label("hour"),
            func.sum(BCTransaction.amount),
            func.count(BCTransaction.payment_id)
        )
        .filter(BCTransaction.merchant_id == merchant_scope)
        .group_by("hour")
        .all()
    )

    hourly_totals: dict[int, dict[str, float]] = {}

    def merge_hourly(rows):
        for hour, amount, count in rows:
            if hour is None:
                continue
            hour_key = int(hour)
            entry = hourly_totals.setdefault(hour_key, {"amount": 0.0, "count": 0})
            entry["amount"] += float(amount or 0)
            entry["count"] += int(count or 0)

    merge_hourly(card_by_hour)
    merge_hourly(qr_by_hour)
    merge_hourly(bc_by_hour)

    return {
        "stats": {
            "total_users": total_users,
            "total_transactions": total_transactions,
            "total_revenue": float(total_revenue),
            "fraud_rate": round(fraud_rate, 2),
        },
        "decisions": decision_map,
        "transactions_by_hour": [
            {
                "hour": hour,
                "amount": float(values["amount"]),
                "count": int(values["count"]),
            }
            for hour, values in sorted(hourly_totals.items())
        ]
    }



@router.get("/trends")
def trends(
    merchant_id: int | None = Query(default=None),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    merchant_scope = _resolve_merchant_scope(user, merchant_id)

    from sqlalchemy import func
    from datetime import datetime, timedelta

    today = datetime.utcnow()
    last_7_days = today - timedelta(days=7)

    daily_card = (
        db.query(
            func.date(Transaction.timestamp),
            func.count(Transaction.transaction_id),
            func.sum(Transaction.amount)
        )
        .filter(Transaction.timestamp >= last_7_days)
        .filter(Transaction.merchant_id == merchant_scope)
        .group_by(func.date(Transaction.timestamp))
        .all()
    )

    daily_qr = (
        db.query(
            func.date(QRTransaction.created_at),
            func.count(QRTransaction.transaction_id),
            func.sum(QRTransaction.amount)
        )
        .filter(QRTransaction.created_at >= last_7_days)
        .filter(QRTransaction.merchant_id == merchant_scope)
        .group_by(func.date(QRTransaction.created_at))
        .all()
    )

    daily_bc = (
        db.query(
            func.date(BCTransaction.created_at),
            func.count(BCTransaction.payment_id),
            func.sum(BCTransaction.amount)
        )
        .filter(BCTransaction.created_at >= last_7_days)
        .filter(BCTransaction.merchant_id == merchant_scope)
        .group_by(func.date(BCTransaction.created_at))
        .all()
    )

    daily_totals: dict[str, dict[str, float]] = {}

    def merge_daily(rows):
        for day, count, amount in rows:
            if day is None:
                continue
            key = str(day)
            entry = daily_totals.setdefault(key, {"transactions": 0, "revenue": 0.0})
            entry["transactions"] += int(count or 0)
            entry["revenue"] += float(amount or 0)

    merge_daily(daily_card)
    merge_daily(daily_qr)
    merge_daily(daily_bc)

    # Transacciones por tipo de dispositivo
    device = (
        db.query(
            Transaction.device_type,
            func.count(Transaction.transaction_id)
        )
        .filter(Transaction.merchant_id == merchant_scope)
        .group_by(Transaction.device_type)
        .all()
    )

    card_scatter = (
        db.query(
            Transaction.hour,
            func.sum(Transaction.amount),
            func.count(Transaction.transaction_id)
        )
        .filter(Transaction.merchant_id == merchant_scope)
        .group_by(Transaction.hour)
        .all()
    )

    qr_scatter = (
        db.query(
            QRTransaction.hour,
            func.sum(QRTransaction.amount),
            func.count(QRTransaction.transaction_id)
        )
        .filter(QRTransaction.merchant_id == merchant_scope)
        .group_by(QRTransaction.hour)
        .all()
    )

    bc_scatter = (
        db.query(
            func.extract("hour", BCTransaction.created_at).label("hour"),
            func.sum(BCTransaction.amount),
            func.count(BCTransaction.payment_id)
        )
        .filter(BCTransaction.merchant_id == merchant_scope)
        .group_by("hour")
        .all()
    )

    scatter_totals: dict[int, dict[str, float]] = {}

    def merge_scatter(rows):
        for hour, amount, count in rows:
            if hour is None:
                continue
            hour_key = int(hour)
            entry = scatter_totals.setdefault(hour_key, {"amount": 0.0, "count": 0})
            entry["amount"] += float(amount or 0)
            entry["count"] += int(count or 0)

    merge_scatter(card_scatter)
    merge_scatter(qr_scatter)
    merge_scatter(bc_scatter)

    return {
        "line": [
            {
                "name": day,
                "transactions": int(values["transactions"]),
                "revenue": float(values["revenue"]),
            }
            for day, values in sorted(daily_totals.items())
        ],
        "bar": [
            {
                "name": d[0],
                "value": d[1]
            }
            for d in device
        ],
        "scatter": [
            {
                "hour": hour,
                "amount": float(values["amount"]),
                "count": int(values["count"]),
            }
            for hour, values in sorted(scatter_totals.items())
        ]
    }