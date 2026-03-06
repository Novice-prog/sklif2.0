// Основная сущность - История болезни
export type MedicalCase = {
  id: string;
  case_number: string; // Номер истории болезни
  patient_code: string; // Анонимный код пациента
  gender: 'male' | 'female'; // Пол
  age: number; // Возраст
  admission_date: string; // Дата поступления
  discharge_date?: string; // Дата выписки
  status: 'active' | 'completed' | 'archived';
  notes?: string;
  created_at: string;
};

// Роли пользователей системы
export type UserRole = 
  | 'admin' // Администратор системы
  | 'doctor' // Лечащий врач
  | 'junior_researcher' // Младший научный сотрудник
  | 'researcher' // Научный сотрудник
  | 'senior_researcher' // Старший научный сотрудник
  | 'lead_researcher'; // Ведущий научный сотрудник

// Пользователь системы
export type User = {
  id: string;
  email: string;
  full_name: string; // ФИО
  role: UserRole;
  created_at: string;
  created_by?: string; // ID администратора, создавшего пользователя
};

// Диагноз привязан к истории болезни
export type Disease = {
  id: string;
  medical_case_id: string; // Ссылка на историю болезни
  disease_name: string; // Название болезни/диагноза
  diagnosis_code?: string; // Код по МКБ-10
  diagnosis_date: string; // Дата постановки диагноза
  notes?: string;
  created_at: string;
};

// Контрольная точка привязана к диагнозу
export type ControlPoint = {
  id: string;
  disease_id: string; // Ссылка на диагноз
  name: string; // КТ1, КТ2, и т.д.
  date: string;
  notes?: string;
  created_at: string;
};

// Группы лабораторных показателей
export type LabGroup = {
  id: string;
  name: string;
  locus?: string; // Локус (Вена, Моча, и т.д.)
  biomaterial?: string; // Биоматериал
  order_index: number;
  created_at: string;
};

// Лабораторный показатель
export type LabIndicator = {
  id: string;
  group_id: string;
  name: string;
  code?: string;
  unit?: string;
  reference_range?: string;
  reference_range_male?: string;
  reference_range_female?: string;
  data_type: 'numeric' | 'text' | 'select'; // Тип данных
  options?: string[]; // Опции для select (например, "Положительно", "Отрицательно")
  order_index: number;
  created_at: string;
};

// Результат лабораторного показателя
export type LabResult = {
  id: string;
  control_point_id: string;
  indicator_id: string;
  value_numeric?: number;
  value_text?: string;
  note?: string;
  created_at: string;
};

// Тип инструментального исследования
export type InstrumentalStudyType = {
  id: string;
  name: string; // УЗИ, КТ, МРТ, ЭКГ, и т.д.
  description?: string;
  order_index: number;
  created_at: string;
};

// Результат инструментального исследования
export type InstrumentalStudy = {
  id: string;
  control_point_id: string;
  study_type_id: string;
  findings: string; // Описание результатов
  conclusion?: string; // Заключение
  images?: string[]; // Ссылки на изображения
  created_at: string;
};

// Типы диагнозов в структурированной диагностической информации
export type DiagnosisType = 
  | 'primary'          // Основное заболевание
  | 'complication'     // Осложнение основного заболевания
  | 'competing'        // Конкурирующее заболевание
  | 'concomitant'      // Сопутствующее заболевание
  | 'background';      // Фоновое заболевание

// Диагностическая запись для контрольной точки
export type DiagnosisRecord = {
  id: string;
  control_point_id: string;
  diagnosis_type: DiagnosisType;
  diagnosis: string;              // Диагноз
  diagnosis_code?: string;        // Код диагноза (МКБ-10)
  treatment?: string;             // Лечение
  severity?: string;              // Степень тяжести
  dynamics?: string;              // Динамика
  notes?: string;                 // Дополнительные примечания
  created_at: string;
};

// Справочники
export type References = {
  labGroups: LabGroup[];
  labIndicators: LabIndicator[];
  instrumentalStudyTypes: InstrumentalStudyType[];
  icd10Codes: ICD10Code[];
  controlPointTemplates: ControlPointTemplate[];
};

// Справочник МКБ-10
export type ICD10Code = {
  code: string;
  name: string;
  category?: string; // Категория для группировки
};

// История изменений лабораторных данных
export type LabResultChangeLog = {
  id: string;
  control_point_id: string;
  change_type: 'import' | 'manual_add' | 'manual_edit' | 'manual_delete';
  changed_by_user_id: string; // ID пользователя
  changed_by_user_name: string; // ФИО пользователя
  changed_by_user_role: UserRole; // Роль пользователя
  changed_at: string;
  affected_count?: number; // Количество измененных записей (для импорта)
  details?: string; // Дополнительные детали изменения
  indicator_ids?: string[]; // ID затронутых показателей
};

// Шаблоны контрольных точек
export type ControlPointTemplate = {
  name: string;
  description?: string;
};

// История изменений лабораторных данных (агрегированная запись)
export type LabDataHistory = {
  id: string;
  control_point_id: string;
  indicator_id: string;
  old_value_numeric?: number;
  new_value_numeric?: number;
  changed_at: string;
  changed_by_user_id?: string;
  source: 'manual' | 'import' | 'system';
};

