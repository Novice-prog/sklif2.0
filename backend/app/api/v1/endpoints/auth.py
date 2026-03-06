from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.rate_limit import LoginRateLimiter, build_rate_limit_key
from app.db.session import get_db
from app.schemas.auth import CurrentUser, LoginRequest, LoginResponse
from app.services.auth import AuthService

router = APIRouter(prefix='/auth', tags=['auth'])
DbSession = Annotated[Session, Depends(get_db)]
login_rate_limiter = LoginRateLimiter()


@router.post('/login', response_model=LoginResponse)
def login(payload: LoginRequest, request: Request, db: DbSession) -> LoginResponse:
    key = build_rate_limit_key(payload.identifier, request.client.host if request.client else None)
    if not login_rate_limiter.allow(key):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many login attempts')

    service = AuthService(db)
    user = service.authenticate(payload.identifier, payload.password)
    if not user:
        login_rate_limiter.register_failure(key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    if not service.settings.jwt_secret_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='JWT auth is not configured')

    login_rate_limiter.register_success(key)
    return service.build_login_response(user)


@router.get('/me', response_model=CurrentUser)
def me(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    return current_user
