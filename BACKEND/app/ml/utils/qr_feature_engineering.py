from math import radians, cos, sin, asin, sqrt


def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * R * asin(sqrt(a))


def build_qr_features(tx, user_stats, last_location=None):
    """
    Construye features para predicción de fraude en transacciones QR.
    Utiliza risk_score_rule pre-calculado con calculate_risk_score_rule_qr en el servicio.
    """

    # Calcular geo_distance si hay ubicación previa (feature adicional para QR)
    geo_distance = 0.0
    if last_location:
        geo_distance = haversine(
            last_location["lat"],
            last_location["lon"],
            tx["latitude"],
            tx["longitude"]
        )

    # Usar amount_vs_avg ya calculado en el servicio
    amount_vs_avg = tx.get("amount_vs_avg", tx["amount"] / max(user_stats["avg_amount_user"], 50))

    # Usar risk_score_rule ya calculado con calculate_risk_score_rule_qr en el servicio
    # Este incluye factores QR-específicos: device_change, qr_scans, etc.
    risk_score_rule = tx.get("risk_score_rule", 0.0)

    return {
        "amount": tx["amount"],
        "amount_vs_avg": round(amount_vs_avg, 2),
        "transactions_last_24h": user_stats["transactions_last_24h"],
        "hour": tx["hour"],
        "day_of_week": tx["day_of_week"],
        "failed_attempts": tx["failed_attempts"],
        "is_international": tx["country"] != "MX",
        "risk_score_rule": round(risk_score_rule, 2),
        "geo_distance": round(geo_distance, 2),  # Feature adicional QR
    }
