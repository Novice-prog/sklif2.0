import { useState, useMemo } from 'react';
import { X, Search, Trash2 } from 'lucide-react';
import type { Disease } from '../types';
import { references } from '../data/mockData';

type AddDiseaseModalProps = {
  medicalCaseId: string;
  disease?: Disease; // Для редактирования
  existingDiseases?: Disease[]; // Существующие диагнозы для выпадающего списка
  onClose: () => void;
  onAdd?: (disease: Omit<Disease, 'id' | 'created_at'>) => void;
  onUpdate?: (id: string, disease: Partial<Disease>) => void;
  onDelete?: (id: string) => void;
};

export function AddDiseaseModal({ medicalCaseId, disease, existingDiseases = [], onClose, onAdd, onUpdate, onDelete }: AddDiseaseModalProps) {
  const isEditing = !!disease;
  
  const [formData, setFormData] = useState({
    disease_name: disease?.disease_name || '',
    diagnosis_code: disease?.diagnosis_code || '',
    diagnosis_date: disease?.diagnosis_date ? new Date(disease.diagnosis_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: disease?.notes || '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Получаем уникальные диагнозы из существующих записей
  const uniqueExistingDiseases = useMemo(() => {
    const diseaseNames = existingDiseases
      .filter(d => d.disease_name && d.disease_name.trim() !== '')
      .map(d => ({ name: d.disease_name.trim(), code: d.diagnosis_code }));
    
    // Удаляем дубликаты по названию
    const unique = Array.from(
      new Map(diseaseNames.map(d => [d.name, d])).values()
    );
    
    return unique;
  }, [existingDiseases]);

  // Фильтрация МКБ-10 кодов по поисковому запросу
  const filteredICD10 = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return references.icd10Codes.filter(
      icd => 
        icd.code.toLowerCase().includes(query) ||
        icd.name.toLowerCase().includes(query) ||
        (icd.category && icd.category.toLowerCase().includes(query))
    ).slice(0, 10); // Показываем топ-10 результатов
  }, [searchQuery]);

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

  const handleSelectICD10 = (code: string, name: string) => {
    setFormData({
      ...formData,
      diagnosis_code: code,
      disease_name: name,
    });
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && onUpdate && disease) {
      onUpdate(disease.id, {
        disease_name: formData.disease_name,
        diagnosis_code: formData.diagnosis_code || undefined,
        diagnosis_date: new Date(formData.diagnosis_date).toISOString(),
        notes: formData.notes || undefined,
      });
    } else if (onAdd) {
      onAdd({
        medical_case_id: medicalCaseId,
        disease_name: formData.disease_name,
        diagnosis_code: formData.diagnosis_code || undefined,
        diagnosis_date: new Date(formData.diagnosis_date).toISOString(),
        notes: formData.notes || undefined,
      });
    }
  };

  const handleDelete = () => {
    if (isEditing && onDelete && disease) {
      onDelete(disease.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-gray-900">{isEditing ? 'Редактировать диагноз' : 'Добавить диагноз'}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Поиск по МКБ-10 */}
          <div className="relative">
            <label className="block text-sm text-gray-700 mb-1">
              Поиск по МКБ-10
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Введите код или название заболевания..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Выпадающий список результатов */}
            {showDropdown && filteredICD10.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {Array.from(groupedICD10.entries()).map(([category, codes]) => (
                  <div key={category}>
                    <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 sticky top-0">
                      {category}
                    </div>
                    {codes.map((icd) => (
                      <button
                        key={icd.code}
                        type="button"
                        onClick={() => handleSelectICD10(icd.code, icd.name)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-3"
                      >
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                          {icd.code}
                        </span>
                        <span className="text-sm text-gray-900">{icd.name}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Название заболевания/диагноза <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.disease_name}
              onChange={(e) => setFormData({ ...formData, disease_name: e.target.value })}
              placeholder="Острое отравление метанолом"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Код диагноза (МКБ-10)
            </label>
            <input
              type="text"
              value={formData.diagnosis_code}
              onChange={(e) => setFormData({ ...formData, diagnosis_code: e.target.value })}
              placeholder="T51.1"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Дата постановки диагноза <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.diagnosis_date}
              onChange={(e) => setFormData({ ...formData, diagnosis_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Примечания
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительная информация о диагнозе..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEditing ? 'Сохранить' : 'Добавить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Подтверждение удаления */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-transparent rounded-lg flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-lg p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <Trash2 className="w-6 h-6" />
                <h4 className="text-gray-900">Удаление диагноза</h4>
              </div>
              <p className="text-gray-700">
                Вы уверены, что хотите удалить диагноз "{disease?.disease_name}"?
              </p>
              <p className="text-sm text-red-600">
                Внимание: Все связанные контрольные точки, лабораторные данные и исследования также будут удалены.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Удалить
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}