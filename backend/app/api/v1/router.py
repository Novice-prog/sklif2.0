from fastapi import APIRouter

from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.clinical_data import router as clinical_data_router
from app.api.v1.endpoints.users import router as users_router

api_router = APIRouter()
api_router.include_router(clinical_data_router)
api_router.include_router(analytics_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
