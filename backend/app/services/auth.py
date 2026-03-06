from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password, verify_password
from app.models.user import AppUser
from app.schemas.auth import LoginResponse, LoginUserInfo, UserRole


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    def authenticate(self, identifier: str, password: str) -> AppUser | None:
        normalized = identifier.strip().lower()
        stmt = select(AppUser).where(
            or_(
                AppUser.email == normalized,
                AppUser.login == normalized,
            )
        )
        user = self.db.scalar(stmt)
        if not user or not user.is_active:
            return None
        if not verify_password(password, user.password_hash):
            return None

        user.last_login_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        return user

    def build_login_response(self, user: AppUser) -> LoginResponse:
        expires_in = self.settings.access_token_exp_minutes * 60
        expire_at = datetime.now(timezone.utc) + timedelta(minutes=self.settings.access_token_exp_minutes)

        token = jwt.encode(
            {
                'sub': user.id,
                'role': user.role,
                'exp': int(expire_at.timestamp()),
            },
            self.settings.jwt_secret_key,
            algorithm=self.settings.jwt_algorithm,
        )

        return LoginResponse(
            access_token=token,
            expires_in=expires_in,
            user=LoginUserInfo(
                id=user.id,
                email=user.email,
                login=user.login,
                full_name=user.full_name,
                role=user.role,  # type: ignore[arg-type]
            ),
        )

    def ensure_bootstrap_admin(self) -> None:
        login = (self.settings.bootstrap_admin_login or '').strip().lower()
        email = (self.settings.bootstrap_admin_email or '').strip().lower()
        password = self.settings.bootstrap_admin_password or ''
        full_name = self.settings.bootstrap_admin_full_name or 'System Administrator'
        allowed_roles: set[str] = {'admin', 'doctor', 'junior_researcher', 'researcher', 'senior_researcher', 'lead_researcher'}
        configured_role = (self.settings.bootstrap_admin_role or 'admin').strip()
        role: UserRole = configured_role if configured_role in allowed_roles else 'admin'

        if not login or not email or not password:
            return

        stmt = select(AppUser).where(or_(AppUser.login == login, AppUser.email == email))
        existing = self.db.scalar(stmt)
        if existing:
            return

        user = AppUser(
            id=f'user-{uuid4().hex[:16]}',
            login=login,
            email=email,
            full_name=full_name,
            role=role,
            password_hash=hash_password(password),
            is_active=True,
        )
        self.db.add(user)
        self.db.commit()

