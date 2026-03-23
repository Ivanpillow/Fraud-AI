from sqlalchemy.orm import Session
from app.models.auth_user import AuthUser
from app.models.role import Role
from app.models.merchants import Merchant


def get_users_by_merchant(db: Session, merchant_id: int):
    return (
        db.query(AuthUser)
        .join(Role, AuthUser.role_id == Role.role_id)
        .join(Merchant, AuthUser.merchant_id == Merchant.merchant_id)
        .filter(AuthUser.merchant_id == merchant_id)
        .order_by(AuthUser.id.asc())  # asegúrate de usar .asc()
        .all()
    )

# ============================
# Obtener usuario por id
# ============================

def get_user_by_id(db: Session, user_id: int):
    return db.query(AuthUser).filter(AuthUser.id == user_id).first()


# ============================
# Obtener role por nombre
# ============================

def get_role_by_name(db: Session, role_name: str, merchant_id: int | None = None):
    query = db.query(Role).filter(Role.name == role_name)

    if merchant_id is not None:
        query = query.filter(Role.merchant_id == merchant_id)

    return query.first()


# ============================
# Crear usuario
# ============================

def create_user_db(db: Session, email, full_name, password_hash, role_id, merchant_id):

    user = AuthUser(
        email=email,
        full_name=full_name,
        password_hash=password_hash,
        role_id=role_id,
        merchant_id=merchant_id,
        is_active=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user



# ============================
# Actualizar usuario
# ============================

def update_user_db(db: Session, user, email: str, full_name: str, role_id: int):
    
    user.email = email
    user.full_name = full_name
    user.role_id = role_id

    db.commit()
    db.refresh(user)

    return user


def update_user_password_hash_db(db: Session, user, password_hash: str):
    user.password_hash = password_hash

    db.commit()
    db.refresh(user)

    return user



# ============================
# Eliminar usuario
# ============================

def delete_user_db(db: Session, user):

    db.delete(user)
    db.commit()

    return True