from app.queries.metrics_queries import (
    get_global_metrics,
    frauds_by_hour,
    frauds_by_country,
    decisions_distribution
)

def collect_metrics(db):

    global_metrics = get_global_metrics(db)

    fraud_hour = [
        {"hour": h, "count": c}
        for h, c in frauds_by_hour(db)
    ]

    fraud_country = [
        {"country": country, "count": c}
        for country, c in frauds_by_country(db)
    ]

    decisions = [
        {"decision": d, "count": c}
        for d, c in decisions_distribution(db)
    ]

    return {
        "global": global_metrics,
        "fraud_by_hour": fraud_hour,
        "fraud_by_country": fraud_country,
        "decisions": decisions
    }