from __future__ import annotations

import re
import secrets
import string
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import AppUser
from app.schemas.auth import (
    AdminUserDTO,
    CreateUserRequest,
    UpdateUserRequest,
    UserCredentials,
    UserCredentialsResponse,
)

_LOGIN_PATTERN = re.compile(r'[^a-z0-9._-]+')


class UserAdminService:
    def __init__(self, db: Session):
        self.db = db

    def list_users(self, *, include_inactive: bool = False) -> list[AdminUserDTO]:
        stmt = select(AppUser).order_by(AppUser.created_at.desc())
        rows = self.db.scalars(stmt).all()
        items = rows if include_inactive else [u for u in rows if u.is_active]
        return [
            AdminUserDTO(
                id=u.id,
                email=u.email,
                login=u.login,
                full_name=u.full_name,
                role=u.role,  # type: ignore[arg-type]
                is_active=u.is_active,
                created_at=u.created_at,
            )
            for u in items
        ]

    def create_user(self, payload: CreateUserRequest) -> UserCredentialsResponse:
        email = payload.email.strip().lower()
        full_name = payload.full_name.strip()
        login_seed = (payload.login or email.split('@', 1)[0]).strip().lower()
        login = self._build_unique_login(login_seed)

        existing_email_stmt = select(AppUser.id).where(AppUser.email == email)
        if self.db.execute(existing_email_stmt).first():
            raise ValueError('Пользователь с таким email уже существует')

        password = self._generate_password()

        user = AppUser(
            id=f'user-{uuid4().hex[:16]}',
            login=login,
            email=email,
            full_name=full_name,
            role=payload.role,
            password_hash=hash_password(password),
            is_active=True,
        )
        self.db.add(user)
        self.db.commit()

        return UserCredentialsResponse(
            credentials=UserCredentials(
                email=email,
                login=login,
                password=password,
            )
        )

    def update_user(self, user_id: str, payload: UpdateUserRequest, current_user_id: str) -> AdminUserDTO:
        user = self.db.get(AppUser, user_id)
        if not user:
            raise LookupError('Пользователь не найден')

        if payload.full_name is not None:
            full_name = payload.full_name.strip()
            if not full_name:
                raise ValueError('Поле full_name не может быть пустым')
            user.full_name = full_name

        if payload.email is not None:
            email = payload.email.strip().lower()
            if not email:
                raise ValueError('Поле email не может быть пустым')
            existing_email_stmt = select(AppUser.id).where(AppUser.email == email, AppUser.id != user_id)
            if self.db.execute(existing_email_stmt).first():
                raise ValueError('Пользователь с таким email уже существует')
            user.email = email

        if payload.role is not None:
            if user_id == current_user_id and payload.role != 'admin':
                raise ValueError('Нельзя понизить роль текущего администратора')
            user.role = payload.role

        self.db.commit()
        self.db.refresh(user)

        return AdminUserDTO(
            id=user.id,
            email=user.email,
            login=user.login,
            full_name=user.full_name,
            role=user.role,  # type: ignore[arg-type]
            is_active=user.is_active,
            created_at=user.created_at,
        )

    def deactivate_user(self, user_id: str, current_user_id: str) -> None:
        if user_id == current_user_id:
            raise ValueError('Нельзя деактивировать текущего пользователя')

        user = self.db.get(AppUser, user_id)
        if not user:
            raise LookupError('Пользователь не найден')
        if not user.is_active:
            return

        user.is_active = False
        self.db.commit()

    def reset_password(self, user_id: str) -> UserCredentialsResponse:
        user = self.db.get(AppUser, user_id)
        if not user or not user.is_active:
            raise LookupError('Пользователь не найден')

        new_password = self._generate_password()
        user.password_hash = hash_password(new_password)
        self.db.commit()

        return UserCredentialsResponse(
            credentials=UserCredentials(
                email=user.email,
                login=user.login,
                password=new_password,
            )
        )

    def _build_unique_login(self, raw_login: str) -> str:
        candidate = _LOGIN_PATTERN.sub('', raw_login.lower())
        if not candidate:
            candidate = 'user'

        base = candidate[:50]
        suffix = 0
        while True:
            login = base if suffix == 0 else f'{base}{suffix}'
            exists_stmt = select(AppUser.id).where(AppUser.login == login)
            if not self.db.execute(exists_stmt).first():
                return login
            suffix += 1

    @staticmethod
    def _generate_password(length: int = 12) -> str:
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
