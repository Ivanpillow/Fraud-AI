from sqlalchemy.orm import Session
from app.models.fraud_feedback import FraudFeedback

def create_fraud_feedback(
    db: Session,
    prediction_id: int,
    final_label: bool,
    source: str
):
    feedback = FraudFeedback(
        prediction_id=prediction_id,
        final_label=final_label,
        source=source
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return feedback
