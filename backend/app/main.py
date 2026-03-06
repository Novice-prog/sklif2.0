from __future__ import annotations

import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import ProgrammingError, SQLAlchemyError

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.services.auth import AuthService

settings = get_settings()


def _validate_security_config() -> None:
    if settings.app_env == 'production':
        if not settings.jwt_secret_key:
            raise RuntimeError('JWT_SECRET_KEY must be configured in production')
        if settings.allow_insecure_dev_auth:
            raise RuntimeError('ALLOW_INSECURE_DEV_AUTH must be false in production')


def create_app() -> FastAPI:
    _validate_security_config()
    app = FastAPI(title=settings.app_name, version='1.0.0')

    if settings.app_env != 'production':
        Base.metadata.create_all(bind=engine)

    # Ensure bootstrap admin user exists when credentials are configured.
    try:
        with SessionLocal() as db:
            AuthService(db).ensure_bootstrap_admin()
    except ProgrammingError:
        # On production without migrations this must not block startup.
        pass

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    @app.middleware('http')
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
        response = await call_next(request)
        response.headers['X-Request-ID'] = request_id
        return response

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, _: SQLAlchemyError):
        request_id = request.headers.get('X-Request-ID')
        return JSONResponse(
            status_code=500,
            content={
                'code': 'database_error',
                'detail': 'Database operation failed',
                'trace_id': request_id,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, error: RequestValidationError):
        request_id = request.headers.get('X-Request-ID')
        return JSONResponse(
            status_code=422,
            content={
                'code': 'validation_error',
                'detail': str(error),
                'trace_id': request_id,
            },
        )

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
