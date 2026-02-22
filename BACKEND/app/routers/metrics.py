from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.metrics_service import collect_metrics, get_dashboard_metrics

from sqlalchemy import func
from app.db.session import get_db
from app.models.transaction import Transaction
from app.models.fraud_prediction import FraudPrediction
from datetime import datetime, timedelta
from app.models.user import User

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("/")
def get_metrics(db: Session = Depends(get_db)):
    return collect_metrics(db)

@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    return get_dashboard_metrics(db)



# Transacciones últimos 7 días
@router.get("/weekly-transactions")
def weekly_transactions(db: Session = Depends(get_db)):

    today = datetime.utcnow()
    last_7_days = today - timedelta(days=7)

    results = (
        db.query(
            func.date(Transaction.timestamp).label("date"),
            func.sum(Transaction.amount).label("total_amount")
        )
        .filter(Transaction.timestamp >= last_7_days)
        .group_by(func.date(Transaction.timestamp))
        .order_by(func.date(Transaction.timestamp))
        .all()
    )

    return [
        {
            "date": str(r.date),
            "total": float(r.total_amount)
        }
        for r in results
    ]


# Funnel - Transacciones totales vs decisiones del modelo (aceptada, rechazada, revisión) 
@router.get("/fraud-funnel")
def fraud_funnel(db: Session = Depends(get_db)):

    total = db.query(func.count(Transaction.transaction_id)).scalar()

    decisions = (
        db.query(
            FraudPrediction.decision,
            func.count(FraudPrediction.prediction_id)
        )
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
def transactions_by_country(db: Session = Depends(get_db)):

    results = (
        db.query(
            Transaction.country,
            func.sum(Transaction.amount).label("total_amount")
        )
        .group_by(Transaction.country)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(5)
        .all()
    )

    return [
        {
            "name": r.country,
            "value": float(r.total_amount)
        }
        for r in results
    ]


@router.get("/overview")
def overview_metrics(db: Session = Depends(get_db)):

    # Usuarios totales 
    total_users = db.query(func.count(User.user_id)).scalar()

    # Transacciones totales 
    total_transactions = db.query(func.count(Transaction.transaction_id)).scalar()

    # Ingresos totales (considerando solo transacciones permitidas)
    total_revenue = db.query(func.sum(Transaction.amount)).scalar() or 0

    # Tasa de fraude (bloqueos vs total)
    fraud_count = db.query(func.count()).filter(FraudPrediction.decision == "block").scalar()
    fraud_rate = (
        (fraud_count / total_transactions) * 100
        if total_transactions > 0 else 0
    )
    

    # Decisiones antifraude
    decisions = (
        db.query(FraudPrediction.decision, func.count())
        .group_by(FraudPrediction.decision)
        .all()
    )
    decision_map = {d[0]: d[1] for d in decisions}

    # Transacciones por hora
    tx_by_hour = (
        db.query(
            Transaction.hour,
            func.sum(Transaction.amount),
            func.count(Transaction.transaction_id)
        )
        .group_by(Transaction.hour)
        .all()
    )

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
                "hour": r[0],
                "amount": float(r[1]),
                "count": r[2]
            }
            for r in tx_by_hour
        ]
    }



@router.get("/trends")
def trends(db: Session = Depends(get_db)):

    from sqlalchemy import func
    from datetime import datetime, timedelta

    today = datetime.utcnow()
    last_7_days = today - timedelta(days=7)

    # Revenue + transactions por día
    daily = (
        db.query(
            func.date(Transaction.timestamp),
            func.count(Transaction.transaction_id),
            func.sum(Transaction.amount)
        )
        .filter(Transaction.timestamp >= last_7_days)
        .group_by(func.date(Transaction.timestamp))
        .order_by(func.date(Transaction.timestamp))
        .all()
    )

    # Device distribution
    device = (
        db.query(
            Transaction.device_type,
            func.count(Transaction.transaction_id)
        )
        .group_by(Transaction.device_type)
        .all()
    )

    # Scatter (hour vs amount)
    scatter = (
        db.query(
            Transaction.hour,
            func.sum(Transaction.amount),
            func.count(Transaction.transaction_id)
        )
        .group_by(Transaction.hour)
        .all()
    )

    return {
        "line": [
            {
                "name": str(d[0]),
                "transactions": d[1],
                "revenue": float(d[2] or 0)
            }
            for d in daily
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
                "hour": d[0],
                "amount": float(d[1] or 0),
                "count": d[2]
            }
            for d in scatter
        ]
    }