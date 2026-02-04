from sqlalchemy.orm import Session
from app.models.auth_user import AuthUser
from app.models.role import Role

def get_auth_user_by_email(db: Session, email: str):
    return (
        db.query(AuthUser)
        .join(Role, AuthUser.role_id == Role.role_id)
        .filter(AuthUser.email == email)
        .first()
    )