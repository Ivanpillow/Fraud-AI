from app.models.fraud_explanation import FraudExplanation

def save_explanations(db, prediction_id: int, explanations: list):
    objects = []

    for exp in explanations:
        obj = FraudExplanation(
            prediction_id=prediction_id,
            feature_name=exp["feature"],
            contribution_value=exp["contribution"],
            direction=exp["direction"]
        )
        objects.append(obj)

    db.add_all(objects)
    db.commit()