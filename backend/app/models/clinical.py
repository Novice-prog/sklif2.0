from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, StringPrimaryKeyMixin, TimestampMixin


class CaseStatus(enum.StrEnum):
    active = 'active'
    completed = 'completed'
    archived = 'archived'


class DiagnosisType(enum.StrEnum):
    primary = 'primary'
    complication = 'complication'
    competing = 'competing'
    concomitant = 'concomitant'
    background = 'background'


class MedicalCase(StringPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = 'medical_cases'

    case_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    patient_code: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    gender: Mapped[str] = mapped_column(String(16), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    admission_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    discharge_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[CaseStatus] = mapped_column(Enum(CaseStatus), default=CaseStatus.active, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    diseases: Mapped[list[Disease]] = relationship(back_populates='medical_case', cascade='all, delete-orphan')


class Disease(StringPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = 'diseases'

    medical_case_id: Mapped[str] = mapped_column(ForeignKey('medical_cases.id', ondelete='CASCADE'), index=True, nullable=False)
    disease_name: Mapped[str] = mapped_column(String(512), index=True, nullable=False)
    diagnosis_code: Mapped[str | None] = mapped_column(String(32), index=True, nullable=True)
    diagnosis_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    medical_case: Mapped[MedicalCase] = relationship(back_populates='diseases')
    control_points: Mapped[list[ControlPoint]] = relationship(back_populates='disease', cascade='all, delete-orphan')


class ControlPoint(StringPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = 'control_points'

    disease_id: Mapped[str] = mapped_column(ForeignKey('diseases.id', ondelete='CASCADE'), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    disease: Mapped[Disease] = relationship(back_populates='control_points')
    lab_results: Mapped[list[LabResult]] = relationship(back_populates='control_point', cascade='all, delete-orphan')
    diagnosis_records: Mapped[list[DiagnosisRecord]] = relationship(back_populates='control_point', cascade='all, delete-orphan')

    __table_args__ = (
        Index('ix_control_points_disease_date', 'disease_id', 'date'),
    )


class LabResult(StringPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = 'lab_results'

    control_point_id: Mapped[str] = mapped_column(ForeignKey('control_points.id', ondelete='CASCADE'), nullable=False)
    indicator_id: Mapped[str] = mapped_column(String(128), nullable=False)
    value_numeric: Mapped[float | None] = mapped_column(Float, nullable=True)
    value_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    control_point: Mapped[ControlPoint] = relationship(back_populates='lab_results')

    __table_args__ = (
        Index('ix_lab_results_cp_indicator', 'control_point_id', 'indicator_id'),
    )


class DiagnosisRecord(StringPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = 'diagnosis_records'

    control_point_id: Mapped[str] = mapped_column(ForeignKey('control_points.id', ondelete='CASCADE'), index=True, nullable=False)
    diagnosis_type: Mapped[DiagnosisType] = mapped_column(Enum(DiagnosisType), nullable=False)
    diagnosis: Mapped[str] = mapped_column(Text, nullable=False)
    diagnosis_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    treatment: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str | None] = mapped_column(String(128), nullable=True)
    dynamics: Mapped[str | None] = mapped_column(String(128), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    control_point: Mapped[ControlPoint] = relationship(back_populates='diagnosis_records')
