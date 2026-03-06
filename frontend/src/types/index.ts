// ==================== ОСНОВНЫЕ СУЩНОСТИ ====================

// Пациент - только паспортные данные
export type Patient = {
  id: string;
  full_name: string;
  birth_date: string;
  gender: 'male' | 'female';
  medical_record_number: string;
  emias_id?: string;
  created_at: string;
};

// Эксперимент/Исследование
export type Experiment = {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
};

// Контрольная группа
export type ControlGroup = {
  id: string;
  experiment_id: string;
  name: string;
  description?: string;
  created_at: string;
};

// Участие - эпизод пациента в конкретном эксперименте
export type Enrollment = {
  id: string;
  patient_id: string;
  experiment_id: string;
  control_group_id?: string;
  enrollment_date: string;
  completion_date?: string;
  status: 'active' | 'completed' | 'withdrawn';
  notes?: string;
  created_at: string;
};

// Шаблон контрольной точки (КТ1, КТ2, выписка...)
export type ControlPointTemplate = {
  id: string;
  name: string;
  code: string; // КТ1, КТ2, DISCHARGE, etc.
  description?: string;
  order_index: number;
  created_at: string;
};

// Экземпляр контрольной точки - конкретный визит участия
export type ControlPointInstance = {
  id: string;
  enrollment_id: string;
  template_id: string;
  actual_date: string; // реальная дата визита
  notes?: string;
  created_at: string;
};

// ==================== ФАКТЫ (ПРИВЯЗАНЫ К КТ) ====================

// Событие диагноза
export type DiagnosisEvent = {
  id: string;
  control_point_id: string;
  diagnosis_id: string; // ссылка на справочник диагнозов
  role: 'primary' | 'complication' | 'competing' | 'concomitant' | 'background';
  notes?: string;
  created_at: string;
};

// Лабораторный результат
export type LabResult = {
  id: string;
  control_point_id: string;
  indicator_id: string; // ссылка на справочник показателей
  biomaterial_id: string; // ссылка на справочник биоматериалов
  value_numeric?: number;
  value_text?: string;
  unit?: string;
  reference_range?: string;
  notes?: string;
  created_at: string;
};

// Инструментальный результат
export type InstrumentalResult = {
  id: string;
  control_point_id: string;
  study_id: string; // ссылка на справочник инструментальных исследований
  findings: string;
  conclusion?: string;
  locus_id?: string; // орган/зона
  attachment_url?: string;
  created_at: string;
};

// Клиническое состояние
export type ClinicalState = {
  id: string;
  control_point_id: string;
  clinical_sign_id: string; // ссылка на справочник клинических признаков
  value_numeric?: number;
  value_text?: string;
  unit?: string;
  locus_id?: string;
  notes?: string;
  created_at: string;
};

// Событие лечения
export type TreatmentEvent = {
  id: string;
  control_point_id: string;
  treatment_method_id: string; // ссылка на справочник методов лечения
  dosage?: string;
  frequency?: string;
  route?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at: string;
};

// ==================== СПРАВОЧНИКИ ====================

// Диагноз
export type Diagnosis = {
  id: string;
  code: string; // МКБ-10 или другая кодировка
  name: string;
  description?: string;
  created_at: string;
};

// Биоматериал
export type Biomaterial = {
  id: string;
  name: string;
  code?: string;
  created_at: string;
};

// Биологическая система
export type BiologicalSystem = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

// Группа показателей
export type IndicatorGroup = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

// Исследуемый показатель
export type Indicator = {
  id: string;
  name: string;
  code?: string;
  group_id?: string;
  biological_system_id?: string;
  unit?: string;
  reference_range?: string;
  created_at: string;
};

// Лабораторное исследование
export type LabStudy = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  created_at: string;
};

// Инструментальное исследование
export type InstrumentalStudy = {
  id: string;
  name: string;
  code?: string;
  biological_system_id?: string;
  description?: string;
  created_at: string;
};

// Клиническая картина/признак
export type ClinicalSign = {
  id: string;
  name: string;
  code?: string;
  unit?: string;
  created_at: string;
};

// Локус (орган/зона)
export type Locus = {
  id: string;
  name: string;
  code?: string;
  biological_system_id?: string;
  parent_id?: string; // для иерархии
  created_at: string;
};

// Метод лечения
export type TreatmentMethod = {
  id: string;
  name: string;
  code?: string;
  category?: string;
  description?: string;
  created_at: string;
};

// ==================== ВСПОМОГАТЕЛЬНЫЕ ТИПЫ ====================

export type References = {
  diagnoses: Diagnosis[];
  biomaterials: Biomaterial[];
  biologicalSystems: BiologicalSystem[];
  indicatorGroups: IndicatorGroup[];
  indicators: Indicator[];
  labStudies: LabStudy[];
  instrumentalStudies: InstrumentalStudy[];
  clinicalSigns: ClinicalSign[];
  loci: Locus[];
  treatmentMethods: TreatmentMethod[];
};
