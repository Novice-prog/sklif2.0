export type Pagination = {
  page?: number;
  pageSize?: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type MedicalCaseDTO = {
  id: string;
  case_number: string;
  patient_code: string;
  gender: 'male' | 'female';
  age: number;
  admission_date: string;
  discharge_date?: string;
  status: 'active' | 'completed' | 'archived';
  notes?: string;
  created_at: string;
};

export type DiseaseDTO = {
  id: string;
  medical_case_id: string;
  disease_name: string;
  diagnosis_code?: string;
  diagnosis_date: string;
  notes?: string;
  created_at: string;
};

export type ControlPointDTO = {
  id: string;
  disease_id: string;
  name: string;
  date: string;
  notes?: string;
  created_at: string;
};

export type LabResultDTO = {
  id: string;
  control_point_id: string;
  indicator_id: string;
  value_numeric?: number;
  value_text?: string;
  note?: string;
  created_at: string;
};

export type DiagnosisRecordDTO = {
  id: string;
  control_point_id: string;
  diagnosis_type: 'primary' | 'complication' | 'competing' | 'concomitant' | 'background';
  diagnosis: string;
  diagnosis_code?: string;
  treatment?: string;
  severity?: string;
  dynamics?: string;
  notes?: string;
  created_at: string;
};

export type BulkUpsertPayload = {
  medicalCases?: MedicalCaseDTO[];
  diseases?: DiseaseDTO[];
  controlPoints?: ControlPointDTO[];
  labResults?: LabResultDTO[];
  diagnosisRecords?: DiagnosisRecordDTO[];
};

export type GroupFilter = {
  disease_name: string;
  genders?: string[];
  min_age?: number;
  max_age?: number;
  min_year?: number;
  max_year?: number;
  treatment?: string;
};

export type StatisticalTest = 'mann-whitney' | 'student-t' | 'welch-t' | 'kolmogorov-smirnov';

export type GroupAnalyticsRequest = {
  group_filter: GroupFilter;
  indicator_ids: string[];
  cp_indices: number[];
};

export type ComparativeAnalyticsRequest = {
  group1: GroupFilter;
  group2: GroupFilter;
  indicator_ids: string[];
  cp_indices: number[];
  significance_level: number;
  statistical_test: StatisticalTest;
};

export type GroupAnalyticsItem = {
  indicator_id: string;
  cp_index: number;
  sample_size: number;
  mean: number;
  median: number;
  std_dev: number;
  q25: number;
  q75: number;
  min: number;
  max: number;
};

export type ComparativeAnalyticsItem = {
  indicator_id: string;
  cp_index: number;
  group1_n: number;
  group2_n: number;
  group1_mean: number;
  group2_mean: number;
  group1_median: number;
  group2_median: number;
  group1_q25: number;
  group2_q25: number;
  group1_q75: number;
  group2_q75: number;
  mean_delta: number;
  statistic: number;
  statistic_name: string;
  p_value: number;
  is_significant: boolean;
};

export type ApiErrorPayload = {
  code: string;
  detail: string;
  traceId?: string;
};
