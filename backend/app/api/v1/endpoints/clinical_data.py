from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.auth import UserRole
from app.schemas.clinical import (
    BulkUpsertPayload,
    ControlPointDTO,
    DiagnosisRecordDTO,
    DiseaseDTO,
    HealthResponse,
    LabResultDTO,
    MedicalCaseDTO,
)
from app.services.clinical_data import ClinicalDataService

router = APIRouter(tags=['clinical-data'])

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


@router.get('/health', response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(status='ok')


@router.get('/medical-cases', response_model=list[MedicalCaseDTO], dependencies=[Depends(require_roles(*READ_ROLES))])
def list_medical_cases(
    db: DbSession,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=5000)] = 1000,
) -> list[MedicalCaseDTO]:
    service = ClinicalDataService(db)
    return list(service.list_medical_cases(offset=offset, limit=limit))


@router.get('/diseases', response_model=list[DiseaseDTO], dependencies=[Depends(require_roles(*READ_ROLES))])
def list_diseases(
    db: DbSession,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=5000)] = 1000,
) -> list[DiseaseDTO]:
    service = ClinicalDataService(db)
    return list(service.list_diseases(offset=offset, limit=limit))


@router.get('/control-points', response_model=list[ControlPointDTO], dependencies=[Depends(require_roles(*READ_ROLES))])
def list_control_points(
    db: DbSession,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=5000)] = 1000,
) -> list[ControlPointDTO]:
    service = ClinicalDataService(db)
    return list(service.list_control_points(offset=offset, limit=limit))


@router.get('/lab-results', response_model=list[LabResultDTO], dependencies=[Depends(require_roles(*READ_ROLES))])
def list_lab_results(
    db: DbSession,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=5000)] = 1000,
) -> list[LabResultDTO]:
    service = ClinicalDataService(db)
    return list(service.list_lab_results(offset=offset, limit=limit))


@router.get('/diagnosis-records', response_model=list[DiagnosisRecordDTO], dependencies=[Depends(require_roles(*READ_ROLES))])
def list_diagnosis_records(
    db: DbSession,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=5000)] = 1000,
) -> list[DiagnosisRecordDTO]:
    service = ClinicalDataService(db)
    return list(service.list_diagnosis_records(offset=offset, limit=limit))


@router.post('/clinical-data/bulk-upsert', status_code=204, dependencies=[Depends(require_roles('admin'))])
def bulk_upsert(payload: BulkUpsertPayload, db: DbSession) -> None:
    service = ClinicalDataService(db)
    service.bulk_upsert(payload)
