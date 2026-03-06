from collections.abc import Callable
from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException, status

from app.core.config import get_settings
from app.schemas.auth import CurrentUser, TokenPayload, UserRole


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing bearer token')
    return authorization.replace('Bearer ', '', 1).strip()


def _decode_jwt(token: str) -> CurrentUser:
    settings = get_settings()
    try:
        data = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token expired') from error
    except jwt.InvalidTokenError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token') from error

    payload = TokenPayload.model_validate(data)
    return CurrentUser(subject=payload.sub, role=payload.role)


def get_current_user(authorization: Annotated[str | None, Header()] = None) -> CurrentUser:
    settings = get_settings()

    if not settings.api_bearer_token and not settings.jwt_secret_key:
        if settings.allow_insecure_dev_auth and settings.app_env != 'production':
            return CurrentUser(subject='dev-anonymous', role='admin')
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Authentication is not configured',
        )

    token = _extract_bearer_token(authorization)

    if settings.jwt_secret_key:
        return _decode_jwt(token)

    if token != settings.api_bearer_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid bearer token')

    return CurrentUser(subject='service-token', role='admin')


def require_roles(*roles: UserRole) -> Callable[[CurrentUser], CurrentUser]:
    def dependency(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Insufficient permissions')
        return current_user

    return dependency


def verify_api_token(authorization: Annotated[str | None, Header()] = None) -> None:
    # Backward-compatible alias for older endpoint dependencies.
    _ = get_current_user(authorization)
