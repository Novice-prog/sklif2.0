from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class CaseStatus(StrEnum):
    active = 'active'
    completed = 'completed'
    archived = 'archived'


class DiagnosisType(StrEnum):
    primary = 'primary'
    complication = 'complication'
    competing = 'competing'
    concomitant = 'concomitant'
    background = 'background'


class StatisticalTest(StrEnum):
    mann_whitney = 'mann-whitney'
    student_t = 'student-t'
    welch_t = 'welch-t'
    kolmogorov_smirnov = 'kolmogorov-smirnov'


class MedicalCaseBase(BaseModel):
    case_number: str
    patient_code: str
    gender: str
    age: int
    admission_date: datetime
    discharge_date: datetime | None = None
    status: CaseStatus
    notes: str | None = None


class MedicalCaseDTO(MedicalCaseBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DiseaseBase(BaseModel):
    medical_case_id: str
    disease_name: str
    diagnosis_code: str | None = None
    diagnosis_date: datetime
    notes: str | None = None


class DiseaseDTO(DiseaseBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ControlPointBase(BaseModel):
    disease_id: str
    name: str
    date: datetime
    notes: str | None = None


class ControlPointDTO(ControlPointBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LabResultBase(BaseModel):
    control_point_id: str
    indicator_id: str
    value_numeric: float | None = None
    value_text: str | None = None
    note: str | None = None


class LabResultDTO(LabResultBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DiagnosisRecordBase(BaseModel):
    control_point_id: str
    diagnosis_type: DiagnosisType
    diagnosis: str
    diagnosis_code: str | None = None
    treatment: str | None = None
    severity: str | None = None
    dynamics: str | None = None
    notes: str | None = None


class DiagnosisRecordDTO(DiagnosisRecordBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BulkUpsertPayload(BaseModel):
    medicalCases: list[MedicalCaseDTO] | None = Field(default=None)
    diseases: list[DiseaseDTO] | None = Field(default=None)
    controlPoints: list[ControlPointDTO] | None = Field(default=None)
    labResults: list[LabResultDTO] | None = Field(default=None)
    diagnosisRecords: list[DiagnosisRecordDTO] | None = Field(default=None)


class GroupFilter(BaseModel):
    disease_name: str
    genders: list[str] = Field(default_factory=lambda: ['male', 'female'])
    min_age: int | None = None
    max_age: int | None = None
    min_year: int | None = None
    max_year: int | None = None
    treatment: str | None = None


class GroupAnalyticsRequest(BaseModel):
    group_filter: GroupFilter
    indicator_ids: list[str]
    cp_indices: list[int]


class ComparativeAnalyticsRequest(BaseModel):
    group1: GroupFilter
    group2: GroupFilter
    indicator_ids: list[str]
    cp_indices: list[int]
    significance_level: float = Field(default=0.05, gt=0.0, lt=1.0)
    statistical_test: StatisticalTest = StatisticalTest.mann_whitney


class GroupAnalyticsItem(BaseModel):
    indicator_id: str
    cp_index: int
    sample_size: int
    mean: float
    median: float
    std_dev: float
    q25: float
    q75: float
    min: float
    max: float


class ComparativeAnalyticsItem(BaseModel):
    indicator_id: str
    cp_index: int
    group1_n: int
    group2_n: int
    group1_mean: float
    group2_mean: float
    group1_median: float
    group2_median: float
    group1_q25: float
    group2_q25: float
    group1_q75: float
    group2_q75: float
    mean_delta: float
    statistic: float
    statistic_name: str
    p_value: float
    is_significant: bool


class HealthResponse(BaseModel):
    status: str


class ApiErrorPayload(BaseModel):
    code: str
    detail: str
    trace_id: str | None = None
