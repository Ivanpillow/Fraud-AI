from datetime import datetime
from sqlalchemy import func
from app.models import Merchant, APIKey
from app.models.auth_user import AuthUser


# ============================
# Obtener merchants con API keys
# ============================
def get_merchants_with_keys(db):

    merchants = db.query(Merchant).all()

    result = []

    for m in merchants:
        api_keys = db.query(APIKey).filter(
            APIKey.merchant_id == m.merchant_id
        ).all()

        result.append({
            "merchant_id": m.merchant_id,
            "name": m.name,
            "status": m.status,
            "plan_type": m.plan_type,
            "created_at": m.created_at,
            "api_keys": api_keys
        })

    return result


# ============================
# Crear merchant
# ============================
def create_merchant_db(db, name, status, plan_type):

    merchant = Merchant(
        name=name,
        status=status,
        plan_type=plan_type,
        created_at=datetime.utcnow()
    )

    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    return merchant


# ============================
# Crear API Key
# ============================
def create_api_key_db(db, merchant_id, key_hash, label, status="active"):

    api_key = APIKey(
        merchant_id=merchant_id,
        key_hash=key_hash,
        label=label,  
        status=status,
        created_at=datetime.utcnow()
    )

    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return api_key



# ============================
# Obtener merchant por id
# ============================
def get_merchant_by_id(db, merchant_id):
    return db.query(Merchant).filter(
        Merchant.merchant_id == merchant_id
    ).first()


# ============================
# Actualizar merchant
# ============================
def update_merchant_db(db, merchant, name):

    merchant.name = name

    db.commit()
    db.refresh(merchant)

    return merchant


# ============================
# Obtener API key por merchant
# ============================
def get_api_key_by_merchant(db, merchant_id):
    return db.query(APIKey).filter(
        APIKey.merchant_id == merchant_id
    ).first()


# ============================
# Actualizar API key
# ============================
def update_api_key_db(db, api_key, label, key_hash):

    api_key.label = label
    api_key.key_hash = key_hash

    db.commit()
    db.refresh(api_key)

    return api_key



# ============================
# Toggle status merchant
# ============================
def update_merchant_status_db(db, merchant, status):

    merchant.status = status

    return merchant


# ============================
# Obtener API keys por merchant
# ============================
def get_api_keys_by_merchant(db, merchant_id):
    return db.query(APIKey).filter(
        APIKey.merchant_id == merchant_id
    ).all()


# ============================
# Actualizar status de API keys
# ============================
def update_api_keys_status_db(db, api_keys, status):

    for key in api_keys:
        key.status = status

    return api_keys


# ============================
# Contar usuarios por merchant
# ============================
def count_users_by_merchant(db, merchant_id, active_only=False):
    query = db.query(func.count(AuthUser.id)).filter(
        AuthUser.merchant_id == merchant_id
    )

    if active_only:
        query = query.filter(AuthUser.is_active.is_(True))

    return query.scalar() or 0


# ============================
# Eliminar API keys de merchant
# ============================
def delete_api_keys_by_merchant(db, merchant_id):
    return db.query(APIKey).filter(
        APIKey.merchant_id == merchant_id
    ).delete(synchronize_session=False)


# ============================
# Eliminar merchant
# ============================
def delete_merchant_db(db, merchant):
    db.delete(merchant)