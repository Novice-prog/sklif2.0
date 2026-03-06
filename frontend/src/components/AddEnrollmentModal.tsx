import { useState } from 'react';
import { X } from 'lucide-react';
import type { Enrollment, Patient, Experiment } from '../types';

type AddEnrollmentModalProps = {
  patientId: string;
  patient: Patient;
  experiments: Experiment[];
  onClose: () => void;
  onAdd: (enrollment: Omit<Enrollment, 'id' | 'created_at'>) => void;
};

export function AddEnrollmentModal({ patientId, patient, experiments, onClose, onAdd }: AddEnrollmentModalProps) {
  const [formData, setFormData] = useState({
    experiment_id: '',
    control_group_id: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'active' as Enrollment['status'],
    notes: '',
  });

  const selectedExperiment = experiments.find(e => e.id === formData.experiment_id);
  const availableGroups: any[] = []; // Временная заглушка для совместимости

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      patient_id: patientId,
      ...formData,
      control_group_id: formData.control_group_id || undefined,
      notes: formData.notes || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-gray-900">Включение в исследование</h3>
            <p className="text-sm text-gray-600 mt-1">{patient.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Исследование *
            </label>
            <select
              required
              value={formData.experiment_id}
              onChange={(e) => setFormData({ ...formData, experiment_id: e.target.value, control_group_id: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите исследование...</option>
              {experiments.filter(e => e.status === 'active').map(exp => (
                <option key={exp.id} value={exp.id}>
                  {exp.name}
                </option>
              ))}
            </select>
          </div>

          {formData.experiment_id && availableGroups.length > 0 && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Контрольная группа
              </label>
              <select
                value={formData.control_group_id}
                onChange={(e) => setFormData({ ...formData, control_group_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Не указана</option>
                {availableGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Дата включения *
            </label>
            <input
              type="date"
              required
              value={formData.enrollment_date}
              onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Статус *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Enrollment['status'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Активно</option>
              <option value="completed">Завершено</option>
              <option value="withdrawn">Прервано</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Примечания
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительная информация о включении..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Включить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}