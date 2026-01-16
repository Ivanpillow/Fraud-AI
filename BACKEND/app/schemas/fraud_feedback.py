from pydantic import BaseModel

class FraudFeedbackCreate(BaseModel):
    prediction_id: int
    final_label: bool
    source: str