from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.auth import AdminUserDTO, AdminUsersResponse, CreateUserRequest, CurrentUser, UpdateUserRequest, UserCredentialsResponse
from app.services.user_admin import UserAdminService

router = APIRouter(tags=['users'])
DbSession = Annotated[Session, Depends(get_db)]
AdminUser = Annotated[CurrentUser, Depends(require_roles('admin'))]


@router.get('/users', response_model=AdminUsersResponse)
def list_users(_: AdminUser, db: DbSession) -> AdminUsersResponse:
    service = UserAdminService(db)
    return AdminUsersResponse(users=service.list_users())


@router.post('/users', response_model=UserCredentialsResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: CreateUserRequest, _: AdminUser, db: DbSession) -> UserCredentialsResponse:
    service = UserAdminService(db)
    try:
        return service.create_user(payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.patch('/users/{user_id}', response_model=AdminUserDTO)
def update_user(user_id: str, payload: UpdateUserRequest, current_user: AdminUser, db: DbSession) -> AdminUserDTO:
    service = UserAdminService(db)
    try:
        return service.update_user(user_id, payload, current_user.subject)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post('/users/{user_id}/deactivate', status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(user_id: str, current_user: AdminUser, db: DbSession) -> None:
    service = UserAdminService(db)
    try:
        service.deactivate_user(user_id, current_user.subject)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.delete('/users/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, current_user: AdminUser, db: DbSession) -> None:
    service = UserAdminService(db)
    try:
        service.deactivate_user(user_id, current_user.subject)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post('/users/{user_id}/reset-password', response_model=UserCredentialsResponse)
def reset_password(user_id: str, _: AdminUser, db: DbSession) -> UserCredentialsResponse:
    service = UserAdminService(db)
    try:
        return service.reset_password(user_id)
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
