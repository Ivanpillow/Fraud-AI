from app.models.user_behavior_features import UserBehaviorFeatures

def get_user_behavior(db, user_id: int):
    return (
        db.query(UserBehaviorFeatures)
        .filter(UserBehaviorFeatures.user_id == user_id)
        .first()
    )

def create_or_update_user_behavior(
    db,
    user_id: int,
    transactions_last_24h: int,
    failed_attempts: int,
    amount_vs_avg: float
):
    behavior = get_user_behavior(db, user_id)

    if behavior:
        behavior.transactions_last_24h = transactions_last_24h
        behavior.failed_attempts = failed_attempts
        behavior.amount_vs_avg = amount_vs_avg
    else:
        behavior = UserBehaviorFeatures(
            user_id=user_id,
            transactions_last_24h=transactions_last_24h,
            failed_attempts=failed_attempts,
            amount_vs_avg=amount_vs_avg
        )
        db.add(behavior)

    db.commit()
    return behavior