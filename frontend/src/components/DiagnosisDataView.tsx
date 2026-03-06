import { useState, useMemo } from 'react';
import type { DiagnosisRecord, DiagnosisType, Disease, ControlPoint } from '../types';
import { Edit2, Save, X, Search } from 'lucide-react';
import { references } from '../data/mockData';

type DiagnosisDataViewProps = {
  controlPoints: ControlPoint[];
  diagnosisRecords: DiagnosisRecord[];
  diseases: Disease[]; // Все диагнозы пациента для выпадающего списка
  onAddRecord: (record: Omit<DiagnosisRecord, 'id' | 'created_at'>) => void;
  onUpdateRecord: (id: string, updates: Partial<DiagnosisRecord>) => void;
  onDeleteRecord: (id: string) => void;
};

type DiagnosisTypeInfo = {
  type: DiagnosisType;
  label: string;
};

const diagnosisTypes: DiagnosisTypeInfo[] = [
  { type: 'primary', label: 'Основное заболевание' },
  { type: 'complication', label: 'Осложнение основного заболевания' },
  { type: 'competing', label: 'Конкурирующее заболевание' },
  { type: 'concomitant', label: 'Сопутствующее заболевание' },
  { type: 'background', label: 'Фоновое заболевание' },
];

const severityOptions = [
  'Легкая',
  'Средней тяжести',
  'Тяжелая',
  'Крайне тяжелая',
];

const dynamicsOptions = [
  'Положительная',
  'Отрицательная',
  'Без динамики',
  'Стабилизация',
  'Ухудшение',
  'Улучшение',
];

const treatmentOptions = [
  'Инфузионная терапия',
  'Антидотная терапия',
  'Экстракорпоральная детоксикация',
  'Симптоматическая терапия',
  'Комбинированная терапия',
];

type CellData = {
  diagnosis: string;
  diagnosis_code: string;
  treatment: string;
  severity: string;
  dynamics: string;
  notes: string;
};

export function DiagnosisDataView({
  controlPoints,
  diagnosisRecords,
  diseases,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
}: DiagnosisDataViewProps) {
  const [editingCell, setEditingCell] = useState<{ cpId: string; type: DiagnosisType } | null>(null);
  const [formData, setFormData] = useState<CellData>({
    diagnosis: '',
    diagnosis_code: '',
    treatment: '',
    severity: '',
    dynamics: '',
    notes: '',
  });

  // Состояние для поиска МКБ-10
  const [icd10SearchQuery, setIcd10SearchQuery] = useState('');
  const [showIcd10Dropdown, setShowIcd10Dropdown] = useState(false);

  // Состояние для поиска лечения
  const [treatmentSearchQuery, setTreatmentSearchQuery] = useState('');
  const [showTreatmentDropdown, setShowTreatmentDropdown] = useState(false);

  // Получаем выбранные варианты лечения
  const getSelectedTreatments = (treatmentString: string): string[] => {
    return treatmentString.split(';').map(t => t.trim()).filter(t => t);
  };

  // Добавить вариант лечения
  const addTreatment = (treatment: string) => {
    const treatments = getSelectedTreatments(formData.treatment);
    if (!treatments.includes(treatment)) {
      treatments.push(treatment);
      setFormData({ ...formData, treatment: treatments.join('; ') });
    }
    setTreatmentSearchQuery('');
    setShowTreatmentDropdown(false);
  };

  // Удалить вариант лечения
  const removeTreatment = (treatment: string) => {
    const treatments = getSelectedTreatments(formData.treatment);
    const filtered = treatments.filter(t => t !== treatment);
    setFormData({ ...formData, treatment: filtered.join('; ') });
  };

  // Фильтрация вариантов лечения
  const filteredTreatments = useMemo(() => {
    if (!treatmentSearchQuery) return treatmentOptions;
    const query = treatmentSearchQuery.toLowerCase();
    return treatmentOptions.filter(t => t.toLowerCase().includes(query));
  }, [treatmentSearchQuery]);

  // Получаем уникальные диагнозы из Disease (основные диагнозы пациента)
  const availableDiseases = diseases
    .filter(d => d.disease_name && d.disease_name.trim() !== '')
    .map(d => ({ name: d.disease_name.trim(), code: d.diagnosis_code }));
  const uniqueDiseases = Array.from(new Set(availableDiseases.map(d => d.name)));

  // Фильтрация МКБ-10 кодов по поисковому запросу
  const filteredICD10 = useMemo(() => {
    if (!icd10SearchQuery || icd10SearchQuery.length < 2) return [];
    const query = icd10SearchQuery.toLowerCase();
    return references.icd10Codes.filter(
      icd => 
        icd.code.toLowerCase().includes(query) ||
        icd.name.toLowerCase().includes(query) ||
        (icd.category && icd.category.toLowerCase().includes(query))
    ).slice(0, 8); // Показываем топ-8 результатов для компактности
  }, [icd10SearchQuery]);

  // Группировка по категориям
  const groupedICD10 = useMemo(() => {
    const grouped = new Map<string, typeof filteredICD10>();
    filteredICD10.forEach(icd => {
      const category = icd.category || 'Без категории';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(icd);
    });
    return grouped;
  }, [filteredICD10]);

  // Обработчик выбора МКБ-10 из справочника
  const handleSelectICD10 = (code: string, name: string) => {
    setFormData({
      ...formData,
      diagnosis_code: code,
      diagnosis: name,
    });
    setIcd10SearchQuery('');
    setShowIcd10Dropdown(false);
  };

  const sortedControlPoints = [...controlPoints].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRecord = (cpId: string, type: DiagnosisType): DiagnosisRecord | undefined => {
    return diagnosisRecords.find(
      r => r.control_point_id === cpId && r.diagnosis_type === type
    );
  };

  const handleEdit = (cpId: string, type: DiagnosisType) => {
    const record = getRecord(cpId, type);
    setEditingCell({ cpId, type });
    setFormData({
      diagnosis: record?.diagnosis || '',
      diagnosis_code: record?.diagnosis_code || '',
      treatment: record?.treatment || '',
      severity: record?.severity || '',
      dynamics: record?.dynamics || '',
      notes: record?.notes || '',
    });
    // Сброс поиска МКБ-10
    setIcd10SearchQuery('');
    setShowIcd10Dropdown(false);
  };

  const handleSave = () => {
    if (!editingCell) return;

    const { cpId, type } = editingCell;
    const existingRecord = getRecord(cpId, type);

    // Сохраняем только если есть хотя бы одно заполненное поле
    const hasData = Object.values(formData).some(value => value.trim() !== '');

    if (hasData) {
      if (existingRecord) {
        onUpdateRecord(existingRecord.id, formData);
      } else {
        onAddRecord({
          control_point_id: cpId,
          diagnosis_type: type,
          ...formData,
        });
      }
    } else if (existingRecord) {
      // Если все поля пустые и запись существует, удаляем её
      onDeleteRecord(existingRecord.id);
    }

    setEditingCell(null);
    // Сброс поиска МКБ-10
    setIcd10SearchQuery('');
    setShowIcd10Dropdown(false);
  };

  const handleCancel = () => {
    setEditingCell(null);
    // Сброс поиска МКБ-10
    setIcd10SearchQuery('');
    setShowIcd10Dropdown(false);
  };

  if (controlPoints.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">Нет контрольных точек</p>
        <p className="text-sm text-gray-400 mt-1">
          Добавьте контрольные точки для ввода диагностической информации
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-blue-50 px-4 py-3 text-center text-gray-900 sticky left-0 z-20 min-w-[180px]">
                Диагноз
              </th>
              {sortedControlPoints.map(cp => (
                <th
                  key={cp.id}
                  className="border border-gray-300 bg-blue-50 px-4 py-3 text-gray-900 min-w-[300px]"
                >
                  <div className="text-center">
                    <div>{cp.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{formatDate(cp.date)}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {diagnosisTypes.map(({ type, label }) => (
              <tr key={type}>
                <td className="border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 sticky left-0 z-10 align-top">
                  <div className="text-center">{label}</div>
                </td>
                {sortedControlPoints.map(cp => {
                  const record = getRecord(cp.id, type);
                  const isEditing = editingCell?.cpId === cp.id && editingCell?.type === type;

                  return (
                    <td key={cp.id} className="border border-gray-300 px-3 py-3 align-top bg-white">
                      {isEditing ? (
                        <div className="space-y-2">
                          {/* Поиск по МКБ-10 */}
                          <div className="relative">
                            <label className="block text-xs text-gray-600 mb-1">Поиск по МКБ-10</label>
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={icd10SearchQuery}
                                onChange={(e) => {
                                  setIcd10SearchQuery(e.target.value);
                                  setShowIcd10Dropdown(true);
                                }}
                                onFocus={() => setShowIcd10Dropdown(true)}
                                placeholder="Введите код или название заболевания..."
                                className="w-full pl-7 pr-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            {/* Выпадающий список результатов */}
                            {showIcd10Dropdown && filteredICD10.length > 0 && (
                              <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-64 overflow-y-auto">
                                {Array.from(groupedICD10.entries()).map(([category, codes]) => (
                                  <div key={category}>
                                    <div className="px-2 py-1 bg-gray-50 text-xs text-gray-600 sticky top-0">
                                      {category}
                                    </div>
                                    {codes.map((icd) => (
                                      <button
                                        key={icd.code}
                                        type="button"
                                        onClick={() => handleSelectICD10(icd.code, icd.name)}
                                        className="w-full px-2 py-1.5 text-left hover:bg-blue-50 transition-colors flex items-center gap-2"
                                      >
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                                          {icd.code}
                                        </span>
                                        <span className="text-xs text-gray-900">{icd.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">{label}</label>
                            {uniqueDiseases.length > 0 ? (
                              <select
                                value={formData.diagnosis}
                                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Выберите {label.toLowerCase()} или введите новый ниже</option>
                                {uniqueDiseases.map((diag, idx) => (
                                  <option key={idx} value={diag}>{diag}</option>
                                ))}
                              </select>
                            ) : null}
                            <textarea
                              value={formData.diagnosis}
                              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                              rows={2}
                              className={`w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${uniqueDiseases.length > 0 ? 'mt-2' : ''}`}
                              placeholder={uniqueDiseases.length > 0 ? `Или введите новый ${label.toLowerCase()}...` : `Введите ${label.toLowerCase()}...`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Код диагноза (МКБ-10)</label>
                            <input
                              value={formData.diagnosis_code}
                              onChange={(e) => setFormData({ ...formData, diagnosis_code: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Код МКБ-10"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Лечение</label>
                            
                            {/* Выбранные варианты лечения (теги) */}
                            {getSelectedTreatments(formData.treatment).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {getSelectedTreatments(formData.treatment).map((treatment, idx) => (
                                  <span
                                    key={idx}
                                    className="group inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                  >
                                    <span>{treatment}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeTreatment(treatment)}
                                      className="hover:bg-blue-200 rounded p-0.5 transition-colors"
                                      title="Удалить"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Поле поиска с выпадающим списком */}
                            <div className="relative">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  value={treatmentSearchQuery}
                                  onChange={(e) => {
                                    setTreatmentSearchQuery(e.target.value);
                                    setShowTreatmentDropdown(true);
                                  }}
                                  onFocus={() => setShowTreatmentDropdown(true)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && treatmentSearchQuery.trim()) {
                                      e.preventDefault();
                                      addTreatment(treatmentSearchQuery.trim());
                                    }
                                  }}
                                  placeholder="Поиск или добавление лечения..."
                                  className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>

                              {/* Выпадающий список */}
                              {showTreatmentDropdown && (treatmentSearchQuery || filteredTreatments.length > 0) && (
                                <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                                  {filteredTreatments.length > 0 ? (
                                    <>
                                      {filteredTreatments.map((option) => {
                                        const isSelected = getSelectedTreatments(formData.treatment).includes(option);
                                        return (
                                          <button
                                            key={option}
                                            type="button"
                                            onClick={() => {
                                              if (!isSelected) {
                                                addTreatment(option);
                                              }
                                            }}
                                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                              isSelected
                                                ? 'bg-blue-50 text-blue-700 cursor-default'
                                                : 'hover:bg-gray-50 text-gray-900'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span>{option}</span>
                                              {isSelected && (
                                                <span className="text-xs text-blue-600">✓</span>
                                              )}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </>
                                  ) : null}
                                  
                                  {/* Добавить новый вариант */}
                                  {treatmentSearchQuery.trim() && !filteredTreatments.includes(treatmentSearchQuery.trim()) && (
                                    <button
                                      type="button"
                                      onClick={() => addTreatment(treatmentSearchQuery.trim())}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors border-t border-gray-100"
                                    >
                                      <span className="text-blue-600">+ Добавить "{treatmentSearchQuery.trim()}"</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-1">
                              Нажмите Enter или выберите из списка для добавления
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Степень тяжести</label>
                              <select
                                value={formData.severity}
                                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Выберите степень тяжести</option>
                                {severityOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Динамика</label>
                              <select
                                value={formData.dynamics}
                                onChange={(e) => setFormData({ ...formData, dynamics: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Выберите динамику</option>
                                {dynamicsOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Примечания</label>
                            <textarea
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                              rows={2}
                              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Примечания..."
                            />
                          </div>

                          <div className="flex gap-1 pt-1">
                            <button
                              onClick={handleSave}
                              className="flex-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              <span className="text-xs">Сохранить</span>
                            </button>
                            <button
                              onClick={handleCancel}
                              className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              <span className="text-xs">Отмена</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="min-h-[100px]">
                          {record ? (
                            <div className="space-y-2">
                              {record.diagnosis && (
                                <div>
                                  <span className="text-xs text-gray-500">Диагноз:</span>
                                  <p className="text-sm text-gray-900 mt-0.5">{record.diagnosis}</p>
                                  {record.diagnosis_code && (
                                    <p className="text-xs text-blue-600 mt-0.5">МКБ-10: {record.diagnosis_code}</p>
                                  )}
                                </div>
                              )}
                              {record.treatment && (
                                <div>
                                  <span className="text-xs text-gray-500">Лечение:</span>
                                  <p className="text-sm text-gray-900 mt-0.5">{record.treatment}</p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                {record.severity && (
                                  <div>
                                    <span className="text-xs text-gray-500">Степень:</span>
                                    <p className="text-sm text-gray-900 mt-0.5">{record.severity}</p>
                                  </div>
                                )}
                                {record.dynamics && (
                                  <div>
                                    <span className="text-xs text-gray-500">Динамика:</span>
                                    <p className="text-sm text-gray-900 mt-0.5">{record.dynamics}</p>
                                  </div>
                                )}
                              </div>
                              {record.notes && (
                                <div>
                                  <span className="text-xs text-gray-500">Примечания:</span>
                                  <p className="text-xs text-gray-700 mt-0.5">{record.notes}</p>
                                </div>
                              )}
                              <button
                                onClick={() => handleEdit(cp.id, type)}
                                className="mt-2 w-full px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center justify-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                Редактировать
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(cp.id, type)}
                              className="w-full h-full min-h-[100px] text-xs text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded flex items-center justify-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Добавить данные
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Подсказка */}
      <div className="bg-blue-50 rounded-lg p-4 text-sm">
        <h5 className="text-gray-900 mb-2">Инструкция:</h5>
        <p className="text-gray-700">
          Нажмите на ячейку для редактирования диагностической информации. Используйте поиск по МКБ-10 для быстрого 
          ввода диагноза - введите код или название заболевания (минимум 2 символа), и система автоматически 
          заполнит название и код диагноза. В таблице представлены все типы диагнозов по каждой контрольной точке.
        </p>
      </div>
    </div>
  );
}