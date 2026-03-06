from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.auth import UserRole
from app.schemas.clinical import ComparativeAnalyticsItem, ComparativeAnalyticsRequest, GroupAnalyticsItem, GroupAnalyticsRequest
from app.services.analytics import AnalyticsService

router = APIRouter(prefix='/analytics', tags=['analytics'])

DbSession = Annotated[Session, Depends(get_db)]
ReadRole = UserRole
READ_ROLES: tuple[ReadRole, ...] = (
    'admin',
    'doctor',
    'junior_researcher',
    'researcher',
    'senior_researcher',
    'lead_researcher',
)


@router.post('/group', response_model=list[GroupAnalyticsItem], dependencies=[Depends(require_roles(*READ_ROLES))])
def group_analytics(payload: GroupAnalyticsRequest, db: DbSession) -> list[GroupAnalyticsItem]:
    service = AnalyticsService(db)
    return service.group_analytics(payload)


@router.post('/comparative', response_model=list[ComparativeAnalyticsItem], dependencies=[Depends(require_roles(*READ_ROLES))])
def comparative_analytics(payload: ComparativeAnalyticsRequest, db: DbSession) -> list[ComparativeAnalyticsItem]:
    service = AnalyticsService(db)
    return service.comparative_analytics(payload)
