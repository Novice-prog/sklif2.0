from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.clinical import ControlPoint, DiagnosisRecord, Disease, LabResult, MedicalCase
from app.schemas.clinical import BulkUpsertPayload, ControlPointDTO, DiagnosisRecordDTO, DiseaseDTO, LabResultDTO, MedicalCaseDTO


class ClinicalDataService:
    def __init__(self, db: Session):
        self.db = db

    def list_medical_cases(self, *, offset: int, limit: int) -> Sequence[MedicalCase]:
        stmt = select(MedicalCase).order_by(MedicalCase.created_at.desc()).offset(offset).limit(limit)
        return self.db.scalars(stmt).all()

    def list_diseases(self, *, offset: int, limit: int) -> Sequence[Disease]:
        stmt = select(Disease).order_by(Disease.created_at.desc()).offset(offset).limit(limit)
        return self.db.scalars(stmt).all()

    def list_control_points(self, *, offset: int, limit: int) -> Sequence[ControlPoint]:
        stmt = select(ControlPoint).order_by(ControlPoint.date.asc()).offset(offset).limit(limit)
        return self.db.scalars(stmt).all()

    def list_lab_results(self, *, offset: int, limit: int) -> Sequence[LabResult]:
        stmt = select(LabResult).order_by(LabResult.created_at.desc()).offset(offset).limit(limit)
        return self.db.scalars(stmt).all()

    def list_diagnosis_records(self, *, offset: int, limit: int) -> Sequence[DiagnosisRecord]:
        stmt = select(DiagnosisRecord).order_by(DiagnosisRecord.created_at.desc()).offset(offset).limit(limit)
        return self.db.scalars(stmt).all()

    def bulk_upsert(self, payload: BulkUpsertPayload) -> None:
        now = datetime.now(timezone.utc)

        try:
            if payload.medicalCases:
                self._upsert_medical_cases(payload.medicalCases, now)
            if payload.diseases:
                self._upsert_diseases(payload.diseases, now)
            if payload.controlPoints:
                self._upsert_control_points(payload.controlPoints, now)
            if payload.labResults:
                self._upsert_lab_results(payload.labResults, now)
            if payload.diagnosisRecords:
                self._upsert_diagnosis_records(payload.diagnosisRecords, now)

            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def _upsert_medical_cases(self, items: list[MedicalCaseDTO], now: datetime) -> None:
        values = [
            {
                'id': item.id,
                'case_number': item.case_number,
                'patient_code': item.patient_code,
                'gender': item.gender,
                'age': item.age,
                'admission_date': item.admission_date,
                'discharge_date': item.discharge_date,
                'status': item.status,
                'notes': item.notes,
                'created_at': item.created_at,
                'updated_at': now,
            }
            for item in items
        ]
        self._execute_upsert(MedicalCase, values)

    def _upsert_diseases(self, items: list[DiseaseDTO], now: datetime) -> None:
        values = [
            {
                'id': item.id,
                'medical_case_id': item.medical_case_id,
                'disease_name': item.disease_name,
                'diagnosis_code': item.diagnosis_code,
                'diagnosis_date': item.diagnosis_date,
                'notes': item.notes,
                'created_at': item.created_at,
                'updated_at': now,
            }
            for item in items
        ]
        self._execute_upsert(Disease, values)

    def _upsert_control_points(self, items: list[ControlPointDTO], now: datetime) -> None:
        values = [
            {
                'id': item.id,
                'disease_id': item.disease_id,
                'name': item.name,
                'date': item.date,
                'notes': item.notes,
                'created_at': item.created_at,
                'updated_at': now,
            }
            for item in items
        ]
        self._execute_upsert(ControlPoint, values)

    def _upsert_lab_results(self, items: list[LabResultDTO], now: datetime) -> None:
        values = [
            {
                'id': item.id,
                'control_point_id': item.control_point_id,
                'indicator_id': item.indicator_id,
                'value_numeric': item.value_numeric,
                'value_text': item.value_text,
                'note': item.note,
                'created_at': item.created_at,
                'updated_at': now,
            }
            for item in items
        ]
        self._execute_upsert(LabResult, values)

    def _upsert_diagnosis_records(self, items: list[DiagnosisRecordDTO], now: datetime) -> None:
        values = [
            {
                'id': item.id,
                'control_point_id': item.control_point_id,
                'diagnosis_type': item.diagnosis_type,
                'diagnosis': item.diagnosis,
                'diagnosis_code': item.diagnosis_code,
                'treatment': item.treatment,
                'severity': item.severity,
                'dynamics': item.dynamics,
                'notes': item.notes,
                'created_at': item.created_at,
                'updated_at': now,
            }
            for item in items
        ]
        self._execute_upsert(DiagnosisRecord, values)

    def _execute_upsert(self, model: Any, values: list[dict[str, Any]]) -> None:
        if not values:
            return

        stmt = insert(model).values(values)
        excluded = stmt.excluded

        update_dict = {
            col.name: getattr(excluded, col.name)
            for col in model.__table__.columns
            if col.name not in {'id', 'created_at'}
        }

        stmt = stmt.on_conflict_do_update(
            index_elements=['id'],
            set_=update_dict,
        )

        self.db.execute(stmt)
