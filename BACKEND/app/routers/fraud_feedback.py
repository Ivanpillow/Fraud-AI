from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.fraud_feedback import FraudFeedbackCreate
from app.queries.fraud_feedback_queries import create_fraud_feedback

router = APIRouter(
    prefix="/fraud/feedback",
    tags=["Fraud Feedback"]
)

@router.post("/")
def submit_fraud_feedback(
    payload: FraudFeedbackCreate,
    db: Session = Depends(get_db)
):
    try:
        feedback = create_fraud_feedback(
            db=db,
            prediction_id=payload.prediction_id,
            final_label=payload.final_label,
            source=payload.source
        )
        return {
            "status": "ok",
            "feedback_id": feedback.feedback_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
