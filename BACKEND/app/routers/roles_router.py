from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.models.auth_user import  AuthUser as User
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.role import Role

router = APIRouter(prefix="/roles", tags=["Roles"])


class RoleRequest(BaseModel):
    name: str


@router.get("/")
def list_roles(db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    merchant_id = current_user["merchant_id"]

    roles = (
        db.query(Role)
        .filter(Role.merchant_id == merchant_id)
        .order_by(Role.role_id)
        .all()
    )

    return {
        "data": [
            {
                "role_id": role.role_id,
                "name": role.name,
                "is_admin": role.is_admin
            }
            for role in roles
        ]
    }

@router.post("/")
def create_role(
    payload: RoleRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_id = current_user["merchant_id"]

    role = Role(name=payload.name, merchant_id=merchant_id)

    db.add(role)
    db.commit()
    db.refresh(role)

    return {"data": {"role_id": role.role_id, "name": role.name}}


@router.put("/{role_id}")
def update_role(
    role_id: int,
    payload: RoleRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_id = current_user["merchant_id"]

    role = (
        db.query(Role)
        .filter(Role.role_id == role_id, Role.merchant_id == merchant_id)
        .first()
    )

    role.name = payload.name

    db.commit()
    db.refresh(role)

    return {"data": {"role_id": role.role_id, "name": role.name}}



from fastapi import HTTPException

@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_id = current_user["merchant_id"]

    role = (
        db.query(Role)
        .filter(Role.role_id == role_id, Role.merchant_id == merchant_id)
        .first()
    )

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role.is_admin:
        raise HTTPException(
            status_code=400,
            detail="Admin role cannot be deleted"
        )

    users_using_role = (
        db.query(User)
        .filter(User.role_id == role_id)
        .count()
    )

    if users_using_role > 0:
        raise HTTPException(
            status_code=400,
            detail="Role has assigned users"
        )

    db.delete(role)
    db.commit()

    return {"message": "Role deleted"}