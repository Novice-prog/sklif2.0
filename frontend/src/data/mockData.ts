import type { MedicalCase, Disease, ControlPoint, LabGroup, LabIndicator, InstrumentalStudyType, References, LabResult, DiagnosisRecord, ICD10Code, ControlPointTemplate, LabDataHistory } from '../types';

const medicalCases: MedicalCase[] = [
  { id: 'mc1', case_number: 'ИБ-2024-0001', patient_code: 'PT-2024-001', gender: 'male', age: 45, admission_date: '2024-12-01T10:00:00Z', status: 'active', notes: 'Пациент поступил в тяжелом состоянии с признаками интоксикации', created_at: '2024-12-01T10:00:00Z' },
  { id: 'mc2', case_number: 'ИБ-2024-0002', patient_code: 'PT-2024-002', gender: 'female', age: 32, admission_date: '2024-11-28T14:30:00Z', status: 'active', notes: 'Состояние средней степени тяжести', created_at: '2024-11-28T14:30:00Z' },
  { id: 'mc3', case_number: 'ИБ-2024-0003', patient_code: 'PT-2024-003', gender: 'male', age: 58, admission_date: '2024-11-25T08:00:00Z', discharge_date: '2024-11-30T12:00:00Z', status: 'completed', notes: 'Лечение завершено успешно', created_at: '2024-11-25T08:00:00Z' },
  { id: 'mc4', case_number: 'ИБ-2024-0004', patient_code: 'PT-2024-004', gender: 'female', age: 27, admission_date: '2024-11-20T15:30:00Z', discharge_date: '2024-11-26T10:00:00Z', status: 'completed', notes: 'Благоприятный исход', created_at: '2024-11-20T15:30:00Z' },
];

const diseases: Disease[] = [
  { id: 'd1', medical_case_id: 'mc1', disease_name: 'Острое отравление метанолом', diagnosis_code: 'T51.1', diagnosis_date: '2024-12-01T10:00:00Z', notes: 'Тяжелое отравление, метаболический ацидоз', created_at: '2024-12-01T10:00:00Z' },
  { id: 'd2', medical_case_id: 'mc2', disease_name: 'Острое отравление этиленгликолем', diagnosis_code: 'T52.3', diagnosis_date: '2024-11-28T14:30:00Z', notes: 'Средней степени тяжести, нефропатия', created_at: '2024-11-28T14:30:00Z' },
  { id: 'd3', medical_case_id: 'mc3', disease_name: 'Острое отравление метанолом', diagnosis_code: 'T51.1', diagnosis_date: '2024-11-25T08:00:00Z', notes: 'Средней степени тяжести, успешное лечение', created_at: '2024-11-25T08:00:00Z' },
  { id: 'd4', medical_case_id: 'mc4', disease_name: 'Острое отравление метанолом', diagnosis_code: 'T51.1', diagnosis_date: '2024-11-20T15:30:00Z', notes: 'Легкая степень тяжести', created_at: '2024-11-20T15:30:00Z' },
];

const controlPoints: ControlPoint[] = [
  { id: 'cp1', disease_id: 'd1', name: 'КТ1 - При поступлении', date: '2024-12-01T10:00:00Z', created_at: '2024-12-01T10:00:00Z' },
  { id: 'cp2', disease_id: 'd1', name: 'КТ2 - Через 6 часов', date: '2024-12-01T16:00:00Z', created_at: '2024-12-01T16:00:00Z' },
  { id: 'cp3', disease_id: 'd1', name: 'КТ3 - Через 24 часа', date: '2024-12-02T10:00:00Z', created_at: '2024-12-02T10:00:00Z' },
  { id: 'cp4', disease_id: 'd1', name: 'КТ4 - Перед выпиской', date: '2024-12-05T10:00:00Z', created_at: '2024-12-05T10:00:00Z' },
  { id: 'cp_d2_1', disease_id: 'd2', name: 'КТ1 - При поступлении', date: '2024-11-28T14:30:00Z', created_at: '2024-11-28T14:30:00Z' },
  { id: 'cp_d2_2', disease_id: 'd2', name: 'КТ2 - Через 12 часов', date: '2024-11-29T02:30:00Z', created_at: '2024-11-29T02:30:00Z' },
  { id: 'cp_d2_3', disease_id: 'd2', name: 'КТ3 - Через 24 часа', date: '2024-11-29T14:30:00Z', created_at: '2024-11-29T14:30:00Z' },
  { id: 'cp_d2_4', disease_id: 'd2', name: 'КТ4 - Через 48 часов', date: '2024-11-30T14:30:00Z', created_at: '2024-11-30T14:30:00Z' },
  { id: 'cp_d3_1', disease_id: 'd3', name: 'КТ1 - При поступлении', date: '2024-11-25T08:00:00Z', created_at: '2024-11-25T08:00:00Z' },
  { id: 'cp_d3_2', disease_id: 'd3', name: 'КТ2 - Через 6 часов', date: '2024-11-25T14:00:00Z', created_at: '2024-11-25T14:00:00Z' },
  { id: 'cp_d3_3', disease_id: 'd3', name: 'КТ3 - Через 24 часа', date: '2024-11-26T08:00:00Z', created_at: '2024-11-26T08:00:00Z' },
  { id: 'cp_d3_4', disease_id: 'd3', name: 'КТ4 - Перед выпиской', date: '2024-11-30T12:00:00Z', created_at: '2024-11-30T12:00:00Z' },
  { id: 'cp_d4_1', disease_id: 'd4', name: 'КТ1 - При поступлении', date: '2024-11-20T15:30:00Z', created_at: '2024-11-20T15:30:00Z' },
  { id: 'cp_d4_2', disease_id: 'd4', name: 'КТ2 - Через 6 часов', date: '2024-11-20T21:30:00Z', created_at: '2024-11-20T21:30:00Z' },
  { id: 'cp_d4_3', disease_id: 'd4', name: 'КТ3 - Через 12 часов', date: '2024-11-21T03:30:00Z', created_at: '2024-11-21T03:30:00Z' },
];

const labGroups: LabGroup[] = [
  { id: 'g_urine', name: 'Клинический анализ мочи', locus: 'Почки', biomaterial: 'Моча', order_index: 1, created_at: new Date().toISOString() },
  { id: 'g_urine_nech', name: 'Анализ осадка мочи по Нечипоренко', locus: 'Почки', biomaterial: 'Моча', order_index: 2, created_at: new Date().toISOString() },
  { id: 'g_stool', name: 'Клинический анализ кала', locus: 'ЖКТ', biomaterial: 'Кал/Кровь', order_index: 3, created_at: new Date().toISOString() },
  { id: 'g_sputum', name: 'Клинический анализ мокроты', locus: 'Дыхательная система', biomaterial: 'Мокрота', order_index: 4, created_at: new Date().toISOString() },
  { id: 'g_csf', name: 'Клинический анализ спинномозговой жидкости', locus: 'ЦНС', biomaterial: 'Ликвор', order_index: 5, created_at: new Date().toISOString() },
  { id: 'g_blood_clinical', name: 'Клинический анализ крови', locus: 'Вена/Палец', biomaterial: 'Кровь', order_index: 6, created_at: new Date().toISOString() },
  { id: 'g_gas_venous', name: 'Исследование газов, оксиметрии крови (вена)', locus: 'Вена', biomaterial: 'Кровь', order_index: 7, created_at: new Date().toISOString() },
  { id: 'g_gas_arterial', name: 'Исследование газов, оксиметрии крови (артерия)', locus: 'Артерия', biomaterial: 'Кровь', order_index: 8, created_at: new Date().toISOString() },
  { id: 'g_electrolytes', name: 'Исследование электролитов крови', locus: 'Вена', biomaterial: 'Кровь', order_index: 9, created_at: new Date().toISOString() },
  { id: 'g_metabolites', name: 'Исследование метаболитов крови', locus: 'Вена', biomaterial: 'Кровь', order_index: 10, created_at: new Date().toISOString() },
  { id: 'g_biochemistry', name: 'Биохимические исследования', locus: 'Вена', biomaterial: 'Кровь/Моча', order_index: 11, created_at: new Date().toISOString() },
  { id: 'g_protein_fractions', name: 'Исследование белковых фракций', locus: 'Вена', biomaterial: 'Кровь', order_index: 12, created_at: new Date().toISOString() },
  { id: 'g_coagulation', name: 'Коагулологические исследования', locus: 'Вена', biomaterial: 'Плазма', order_index: 13, created_at: new Date().toISOString() },
  { id: 'g_pt_inr', name: 'Определение протромбинового времени с расчетом МНО', locus: 'Вена', biomaterial: 'Плазма', order_index: 14, created_at: new Date().toISOString() },
  { id: 'g_vwf', name: 'Исследование активности и свойств фактора Виллебранда', locus: 'Вена', biomaterial: 'Плазма', order_index: 15, created_at: new Date().toISOString() },
  { id: 'g_teg_cit', name: 'Тромбоэластограмма цитратной крови', locus: 'Вена', biomaterial: 'Цельная кровь', order_index: 16, created_at: new Date().toISOString() },
  { id: 'g_teg_int', name: 'Тромбоэластограмма внутреннего пути коагуляции', locus: 'Вена', biomaterial: 'Цельная кровь', order_index: 17, created_at: new Date().toISOString() },
  { id: 'g_teg_ext', name: 'Тромбоэластограмма внешнего пути коагуляции', locus: 'Вена', biomaterial: 'Цельная кровь', order_index: 18, created_at: new Date().toISOString() },
  { id: 'g_teg_hep', name: 'Тромбоэластограмма с гепариназой', locus: 'Вена', biomaterial: 'Цельная кровь', order_index: 19, created_at: new Date().toISOString() },
  { id: 'g_teg_fib', name: 'Тромбоэластограмма (функциональный фибриноген)', locus: 'Вена', biomaterial: 'Цельная кровь', order_index: 20, created_at: new Date().toISOString() },
  { id: 'g_teg_apr', name: 'Тромбоэластограмма с апротинином', locus: 'Вена', biomaterial: 'Цельная кровь', order_index: 21, created_at: new Date().toISOString() },
  { id: 'g_immuno', name: 'Иммуногематологические исследования', locus: 'Вена', biomaterial: 'Кровь', order_index: 22, created_at: new Date().toISOString() },
  { id: 'g_xray', name: 'Рентгенография', locus: 'Различные системы', biomaterial: 'Не применимо', order_index: 23, created_at: new Date().toISOString() },
];

const labItems: LabIndicator[] = [
  // g_urine
  { id: 'i_u_ph', group_id: 'g_urine', name: 'pH', unit: 'Ед.', data_type: 'numeric', reference_range: '5.5 - 7', order_index: 1, created_at: new Date().toISOString() },
  { id: 'i_u_bacteria', group_id: 'g_urine', name: 'Бактерии', unit: 'в п/зр', data_type: 'text', reference_range: '0', order_index: 2, created_at: new Date().toISOString() },
  { id: 'i_u_prot_quant', group_id: 'g_urine', name: 'Белок количественно', unit: 'г/л', data_type: 'numeric', reference_range: '0 - 0.15', order_index: 3, created_at: new Date().toISOString() },
  { id: 'i_u_prot_semi', group_id: 'g_urine', name: 'Белок полуколичественно', unit: 'г/л', data_type: 'numeric', reference_range: '0 - 0.1', order_index: 4, created_at: new Date().toISOString() },
  { id: 'i_u_bil', group_id: 'g_urine', name: 'Билирубин полуколичественно', unit: 'мкмоль/л', data_type: 'numeric', reference_range: '0', order_index: 5, created_at: new Date().toISOString() },
  { id: 'i_u_gluc_quant', group_id: 'g_urine', name: 'Глюкоза количественно', unit: 'ммоль/л', data_type: 'numeric', reference_range: '0 - 2.8', order_index: 6, created_at: new Date().toISOString() },
  { id: 'i_u_gluc_semi', group_id: 'g_urine', name: 'Глюкоза полуколичественно', unit: 'ммоль/л', data_type: 'numeric', reference_range: '0.083', order_index: 7, created_at: new Date().toISOString() },
  { id: 'i_u_yeast', group_id: 'g_urine', name: 'Дрожжевые клетки', unit: 'в п/зр', data_type: 'text', reference_range: '0', order_index: 8, created_at: new Date().toISOString() },
  { id: 'i_u_ket', group_id: 'g_urine', name: 'Кетоновые тела количественно', unit: 'ммоль/л', data_type: 'numeric', reference_range: '0', order_index: 9, created_at: new Date().toISOString() },
  { id: 'i_u_blood_semi', group_id: 'g_urine', name: 'Кровь полуколичественно', unit: 'количество/мкл', data_type: 'numeric', reference_range: '0', order_index: 10, created_at: new Date().toISOString() },
  { id: 'i_u_leuk', group_id: 'g_urine', name: 'Лейкоциты', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 5', order_index: 11, created_at: new Date().toISOString() },
  { id: 'i_u_leuk_semi', group_id: 'g_urine', name: 'Лейкоциты полуколичественно', unit: 'количество/мкл', data_type: 'text', reference_range: '<70', order_index: 12, created_at: new Date().toISOString() },
  { id: 'i_u_nit', group_id: 'g_urine', name: 'Нитриты', data_type: 'select', options: ['Отрицательно', 'Положительно'], reference_range: 'Отрицательно', order_index: 13, created_at: new Date().toISOString() },
  { id: 'i_u_transp', group_id: 'g_urine', name: 'Прозрачность', data_type: 'select', options: ['Пр��зрачная', 'Мутная', 'Слегка мутная'], reference_range: 'Прозрачная', order_index: 14, created_at: new Date().toISOString() },
  { id: 'i_u_mucus', group_id: 'g_urine', name: 'Слизь', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 5', order_index: 15, created_at: new Date().toISOString() },
  { id: 'i_u_sperm', group_id: 'g_urine', name: 'Сперматозоиды', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 5', order_index: 16, created_at: new Date().toISOString() },
  { id: 'i_u_sg', group_id: 'g_urine', name: 'Удельный вес', data_type: 'numeric', reference_range: '1.008 - 1.025', order_index: 17, created_at: new Date().toISOString() },
  { id: 'i_u_urobil', group_id: 'g_urine', name: 'Уробилиноген количественно', unit: 'мкмоль/л', data_type: 'numeric', reference_range: '0 - 17', order_index: 18, created_at: new Date().toISOString() },
  { id: 'i_u_color', group_id: 'g_urine', name: 'Цвет', data_type: 'text', reference_range: 'Светло-желтый, соломенно-желтый', order_index: 19, created_at: new Date().toISOString() },
  { id: 'i_u_eryth', group_id: 'g_urine', name: 'Эритроциты', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 3', order_index: 20, created_at: new Date().toISOString() },
  { id: 'i_u_phos_amorph', group_id: 'g_urine', name: 'Аморфные фосфаты', unit: 'количество/мкл', data_type: 'text', reference_range: '0 - 28', order_index: 21, created_at: new Date().toISOString() },
  { id: 'i_u_epith_flat', group_id: 'g_urine', name: 'Эпителий плоский', unit: 'в п/зр', data_type: 'text', reference_range: 'Незначительное количество', order_index: 22, created_at: new Date().toISOString() },
  { id: 'i_u_epith_renal', group_id: 'g_urine', name: 'Эпителий почечный', unit: 'в п/зр', data_type: 'text', reference_range: '0', order_index: 23, created_at: new Date().toISOString() },
  { id: 'i_u_crys_amm', group_id: 'g_urine', name: 'Кристаллы кислого мочекислого аммония', unit: 'количество/мкл', data_type: 'numeric', reference_range: '0 - 28', order_index: 24, created_at: new Date().toISOString() },
  { id: 'i_u_crys_uric', group_id: 'g_urine', name: 'Кристаллы мочевой кислоты', unit: 'количество/мкл', data_type: 'numeric', reference_range: '0 - 28', order_index: 25, created_at: new Date().toISOString() },
  { id: 'i_u_crys_ox', group_id: 'g_urine', name: 'Кристаллы оксалата кальция', unit: 'количество/мкл', data_type: 'numeric', reference_range: '0 - 28', order_index: 26, created_at: new Date().toISOString() },
  { id: 'i_u_crys_trip', group_id: 'g_urine', name: 'Кристаллы трипельфосфаты', unit: 'количество/мкл', data_type: 'numeric', reference_range: '0 - 28', order_index: 27, created_at: new Date().toISOString() },
  { id: 'i_u_urates', group_id: 'g_urine', name: 'Ураты', unit: 'количество/мкл', data_type: 'numeric', reference_range: '0 - 28', order_index: 28, created_at: new Date().toISOString() },
  { id: 'i_u_cyl_wax', group_id: 'g_urine', name: 'Цилиндры восковидные', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 0', order_index: 29, created_at: new Date().toISOString() },
  { id: 'i_u_cyl_hyal', group_id: 'g_urine', name: 'Цилиндры гиалиновые', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 1', order_index: 30, created_at: new Date().toISOString() },
  { id: 'i_u_cyl_fat', group_id: 'g_urine', name: 'Цилиндры жировые', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 0', order_index: 31, created_at: new Date().toISOString() },
  { id: 'i_u_cyl_gran', group_id: 'g_urine', name: 'Цилиндры зернистые', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 0', order_index: 32, created_at: new Date().toISOString() },
  { id: 'i_u_cyl_leuk', group_id: 'g_urine', name: 'Цилиндры лейкоцитарные', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 0', order_index: 33, created_at: new Date().toISOString() },
  { id: 'i_u_cyl_epith', group_id: 'g_urine', name: 'Цилиндры эпителиальные', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 0', order_index: 34, created_at: new Date().toISOString() },
  { id: 'i_u_cyl_eryth', group_id: 'g_urine', name: 'Цилиндры эритроцитарные', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 0', order_index: 35, created_at: new Date().toISOString() },
  { id: 'i_u_epith_trans', group_id: 'g_urine', name: 'Эпителий переходный', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 2', order_index: 36, created_at: new Date().toISOString() },
  { id: 'i_u_eryth_unch', group_id: 'g_urine', name: 'Эритроциты неизмененные', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 3', order_index: 37, created_at: new Date().toISOString() },
  { id: 'i_u_eryth_ch', group_id: 'g_urine', name: 'Эритроциты измененные', unit: 'в п/зр', data_type: 'text', reference_range: '0 - 0', order_index: 38, created_at: new Date().toISOString() },
  { id: 'i_u_bence_jones', group_id: 'g_urine', name: 'Определение парапротеинов в моче (реакция Бенс-Джонса)', data_type: 'text', reference_range: 'не обнаружено', order_index: 39, created_at: new Date().toISOString() },
  
  // g_urine_nech - Анализ осадка мочи по Нечипоренко
  { id: 'i_u_nech_eryth', group_id: 'g_urine_nech', name: 'Количество эритроцитов', unit: 'в 1 мл', data_type: 'numeric', reference_range: '0 - 1000', order_index: 1, created_at: new Date().toISOString() },
  { id: 'i_u_nech_leuk', group_id: 'g_urine_nech', name: 'Количество лейкоцитов', unit: 'в 1 мл', data_type: 'numeric', reference_range: '0 - 2000', order_index: 2, created_at: new Date().toISOString() },
  { id: 'i_u_nech_cyl', group_id: 'g_urine_nech', name: 'Количество цилиндров', unit: 'в 1 мл', data_type: 'numeric', reference_range: '0 - 20', order_index: 3, created_at: new Date().toISOString() },
  
  // g_stool
  { id: 'i_s_helm', group_id: 'g_stool', name: 'Обнаружение гельминтов в кале', data_type: 'text', reference_range: 'не обнаружено', order_index: 1, created_at: new Date().toISOString() },
  { id: 'i_s_proto', group_id: 'g_stool', name: 'Обнаружение простейших в кале', data_type: 'text', reference_range: 'не обнаружено', order_index: 2, created_at: new Date().toISOString() },
  { id: 'i_s_blood', group_id: 'g_stool', name: 'Определение скрытой крови в кале', data_type: 'text', reference_range: 'не обнаружено', order_index: 3, created_at: new Date().toISOString() },

  // g_sputum
  { id: 'i_sp_myco', group_id: 'g_sputum', name: 'Обнаружение микобактерий в мокроте', data_type: 'text', reference_range: 'не обнаружено', order_index: 1, created_at: new Date().toISOString() },

  // g_csf - Клинический анализ спинномозговой жидкости
  { id: 'i_csf_vol', group_id: 'g_csf', name: 'Количество', unit: 'мл', data_type: 'numeric', order_index: 1, created_at: new Date().toISOString() },
  { id: 'i_csf_col_pre', group_id: 'g_csf', name: 'Цвет до центрифугирования', data_type: 'text', order_index: 2, created_at: new Date().toISOString() },
  { id: 'i_csf_col_post', group_id: 'g_csf', name: 'Цвет после центрифугирования', data_type: 'text', order_index: 3, created_at: new Date().toISOString() },
  { id: 'i_csf_trans_pre', group_id: 'g_csf', name: 'Прозрачность до центрифугирования', data_type: 'text', order_index: 4, created_at: new Date().toISOString() },
  { id: 'i_csf_trans_post', group_id: 'g_csf', name: 'Прозрачность после центрифугирования', data_type: 'text', order_index: 5, created_at: new Date().toISOString() },
  { id: 'i_csf_blood', group_id: 'g_csf', name: 'Присутствие крови', data_type: 'text', order_index: 6, created_at: new Date().toISOString() },
  { id: 'i_csf_film', group_id: 'g_csf', name: 'Фибринозная пленка', data_type: 'text', order_index: 7, created_at: new Date().toISOString() },
  { id: 'i_csf_prot', group_id: 'g_csf', name: 'Белок', unit: 'г/л', data_type: 'numeric', reference_range: '0.15 - 0.45', order_index: 8, created_at: new Date().toISOString() },
  { id: 'i_csf_lym', group_id: 'g_csf', name: 'Лимфоциты', unit: '%', data_type: 'numeric', order_index: 9, created_at: new Date().toISOString() },
  { id: 'i_csf_eos', group_id: 'g_csf', name: 'Эозинофилы', unit: '%', data_type: 'numeric', order_index: 10, created_at: new Date().toISOString() },
  { id: 'i_csf_neu', group_id: 'g_csf', name: 'Нейтрофилы', unit: '%', data_type: 'numeric', order_index: 11, created_at: new Date().toISOString() },
  { id: 'i_csf_mon', group_id: 'g_csf', name: 'Моноциты', unit: '%', data_type: 'numeric', order_index: 12, created_at: new Date().toISOString() },
  { id: 'i_csf_plasma', group_id: 'g_csf', name: 'Плазматические клетки', unit: '%', data_type: 'numeric', order_index: 13, created_at: new Date().toISOString() },
  { id: 'i_csf_lac', group_id: 'g_csf', name: 'Лактат', unit: 'ммоль/л', data_type: 'numeric', reference_range: '1.1 - 2.4', order_index: 14, created_at: new Date().toISOString() },
  { id: 'i_csf_gluc', group_id: 'g_csf', name: 'Глюкоза', unit: 'ммоль/л', data_type: 'numeric', reference_range: '2.8 - 3.9', order_index: 15, created_at: new Date().toISOString() },
  { id: 'i_csf_cyt', group_id: 'g_csf', name: 'Цитоз', unit: 'в 1 мкл', data_type: 'numeric', reference_range: '0 - 5', order_index: 16, created_at: new Date().toISOString() },
  { id: 'i_csf_ery', group_id: 'g_csf', name: 'Эритроциты', unit: 'в 1 мкл', data_type: 'numeric', reference_range: '0 - 0', order_index: 17, created_at: new Date().toISOString() },

  // g_blood_clinical
  { id: 'i_h_hb', group_id: 'g_blood_clinical', name: 'Гемоглобин общий', unit: 'г/л', data_type: 'numeric', reference_range_male: '130-175', reference_range_female: '120-165', order_index: 1, created_at: new Date().toISOString() },
  { id: 'i_h_rbc', group_id: 'g_blood_clinical', name: 'Количество эритроцитов', unit: '10^12/л', data_type: 'numeric', reference_range_male: '4-5.9', reference_range_female: '3.9-5.4', order_index: 2, created_at: new Date().toISOString() },
  { id: 'i_h_hct', group_id: 'g_blood_clinical', name: 'Гематокрит', unit: '%', data_type: 'numeric', reference_range_male: '40-53', reference_range_female: '36-46', order_index: 3, created_at: new Date().toISOString() },
  { id: 'i_h_mcv', group_id: 'g_blood_clinical', name: 'Средний объем эритроцита', unit: 'фл', data_type: 'numeric', reference_range: '79-96', order_index: 4, created_at: new Date().toISOString() },
  { id: 'i_h_mch', group_id: 'g_blood_clinical', name: 'Среднее содержание гемоглобина в эритроците', unit: 'пг', data_type: 'numeric', reference_range: '25-34', order_index: 5, created_at: new Date().toISOString() },

  // g_gas_venous
  { id: 'i_gv_ph', group_id: 'g_gas_venous', name: 'рН', data_type: 'numeric', reference_range: '7.32-7.43', order_index: 1, created_at: new Date().toISOString() },

  //g_gas_arterial
  { id: 'i_ga_ph', group_id: 'g_gas_arterial', name: 'рН', data_type: 'numeric', reference_range: '7.35-7.45', order_index: 1, created_at: new Date().toISOString() },

  // g_electrolytes
  { id: 'i_e_na', group_id: 'g_electrolytes', name: 'Натрий', unit: 'ммоль/л', data_type: 'numeric', reference_range: '136-145', order_index: 1, created_at: new Date().toISOString() },

  // g_metabolites
  { id: 'i_m_lac', group_id: 'g_metabolites', name: 'Лактат', unit: 'ммоль/л', data_type: 'numeric', reference_range: '0.5-2.2', order_index: 1, created_at: new Date().toISOString() },

  // g_biochemistry
  { id: 'i_b_alt', group_id: 'g_biochemistry', name: 'Аланинаминотрансфераза (АЛТ)', unit: 'Ед/л', data_type: 'numeric', reference_range_male: '<41', reference_range_female: '<31', order_index: 1, created_at: new Date().toISOString() },

  // g_protein_fractions
  { id: 'i_pf_alb', group_id: 'g_protein_fractions', name: 'Альбумин', unit: 'г/л', data_type: 'numeric', reference_range: '35-50', order_index: 1, created_at: new Date().toISOString() },

  // g_coagulation
  { id: 'i_c_fib', group_id: 'g_coagulation', name: 'Фибриноген', unit: 'г/л', data_type: 'numeric', reference_range: '2-4', order_index: 1, created_at: new Date().toISOString() },

  // g_pt_inr
  { id: 'i_pt_inr', group_id: 'g_pt_inr', name: 'МНО (INR)', data_type: 'numeric', reference_range: '0.85-1.15', order_index: 1, created_at: new Date().toISOString() },

  // g_vwf
  { id: 'i_vwf_act', group_id: 'g_vwf', name: 'Активность фактора Виллебранда', unit: '%', data_type: 'numeric', reference_range: '60-150', order_index: 1, created_at: new Date().toISOString() },

  // g_teg_cit
  { id: 'i_teg_cit_r', group_id: 'g_teg_cit', name: 'R-время', unit: 'мин', data_type: 'numeric', reference_range: '4-8', order_index: 1, created_at: new Date().toISOString() },

  // g_teg_int
  { id: 'i_teg_int_r', group_id: 'g_teg_int', name: 'R-время', unit: 'мин', data_type: 'numeric', reference_range: '4-8', order_index: 1, created_at: new Date().toISOString() },

  // g_teg_ext
  { id: 'i_teg_ext_r', group_id: 'g_teg_ext', name: 'R-время', unit: 'мин', data_type: 'numeric', reference_range: '4-8', order_index: 1, created_at: new Date().toISOString() },

  // g_teg_hep
  { id: 'i_teg_hep_r', group_id: 'g_teg_hep', name: 'R-время', unit: 'мин', data_type: 'numeric', reference_range: '4-8', order_index: 1, created_at: new Date().toISOString() },

  // g_teg_fib
  { id: 'i_teg_fib_r', group_id: 'g_teg_fib', name: 'R-время', unit: 'мин', data_type: 'numeric', reference_range: '4-8', order_index: 1, created_at: new Date().toISOString() },

  // g_teg_apr
  { id: 'i_teg_apr_r', group_id: 'g_teg_apr', name: 'R-время', unit: 'мин', data_type: 'numeric', reference_range: '4-8', order_index: 1, created_at: new Date().toISOString() },

  // g_immuno
  { id: 'i_i_abo', group_id: 'g_immuno', name: 'Группа крови АВ0', data_type: 'text', order_index: 1, created_at: new Date().toISOString() },

  // g_xray
  { id: 'i_x_chest', group_id: 'g_xray', name: 'Рентгенография органов грудной клетки', data_type: 'text', order_index: 1, created_at: new Date().toISOString() },
];

const labDataHistory: LabDataHistory[] = [];

// Справочники
const references: References = {
  labGroups: labGroups,
  labIndicators: labItems,
  instrumentalStudyTypes: [],
  icd10Codes: [],
  controlPointTemplates: [],
};

export { medicalCases, diseases, controlPoints, labGroups, labItems, labDataHistory, references };