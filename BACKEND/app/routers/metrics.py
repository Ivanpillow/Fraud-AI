from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.metrics_service import collect_metrics, get_dashboard_metrics

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("/")
def get_metrics(db: Session = Depends(get_db)):
    return collect_metrics(db)

@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    return get_dashboard_metrics(db)