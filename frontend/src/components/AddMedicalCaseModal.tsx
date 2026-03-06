import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { MedicalCase } from '../types';

type AddMedicalCaseModalProps = {
  onClose: () => void;
  onAdd: (medicalCase: Omit<MedicalCase, 'id' | 'created_at'>) => void;
  existingCasesCount: number; // Для автогенерации номеров
};

export function AddMedicalCaseModal({ onClose, onAdd, existingCasesCount }: AddMedicalCaseModalProps) {
  const [formData, setFormData] = useState({
    case_number: '',
    patient_code: '',
    gender: 'male' as MedicalCase['gender'],
    age: '',
    admission_date: new Date().toISOString().split('T')[0],
    admission_time: new Date().toTimeString().slice(0, 5),
    discharge_date: '',
    discharge_time: '',
    status: 'active' as MedicalCase['status'],
    notes: '',
  });

  // Автогенерация номеров при загрузке компонента
  useEffect(() => {
    const year = new Date().getFullYear();
    const caseNum = (existingCasesCount + 1).toString().padStart(4, '0');
    const patientNum = (existingCasesCount + 1).toString().padStart(3, '0');
    
    setFormData(prev => ({
      ...prev,
      case_number: `ИБ-${year}-${caseNum}`,
      patient_code: `PT-${year}-${patientNum}`,
    }));
  }, [existingCasesCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Формируем дату выписки только если указана дата
    let discharge_date_iso: string | undefined = undefined;
    if (formData.discharge_date) {
      const discharge_time = formData.discharge_time || '00:00';
      discharge_date_iso = new Date(`${formData.discharge_date}T${discharge_time}:00`).toISOString();
    }
    
    onAdd({
      ...formData,
      age: parseInt(formData.age),
      admission_date: new Date(`${formData.admission_date}T${formData.admission_time}:00`).toISOString(),
      discharge_date: discharge_date_iso,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-gray-900">Новая история болезни</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Номер истории болезни
              </label>
              <input
                type="text"
                value={formData.case_number}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Генерируется автоматически</p>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Код пациента
              </label>
              <input
                type="text"
                value={formData.patient_code}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Генерируется автоматически</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Пол <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as MedicalCase['gender'] })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Возраст <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Возраст в годах"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Дата поступления <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Время поступления <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.admission_time}
                onChange={(e) => setFormData({ ...formData, admission_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Дата выписки
              </label>
              <input
                type="date"
                value={formData.discharge_date}
                onChange={(e) => setFormData({ ...formData, discharge_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Время выписки
              </label>
              <input
                type="time"
                value={formData.discharge_time}
                onChange={(e) => setFormData({ ...formData, discharge_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Статус <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as MedicalCase['status'] })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Активно</option>
              <option value="completed">Завершено</option>
              <option value="archived">Архив</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Примечания
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Дополнительная информация об истории болезни..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}