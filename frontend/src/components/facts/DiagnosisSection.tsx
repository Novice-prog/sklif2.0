import { useState } from 'react';
import { Plus, FileText, X } from 'lucide-react';
import type { DiagnosisEvent, Diagnosis } from '../../types';

type DiagnosisSectionProps = {
  controlPointId: string;
  diagnosisEvents: DiagnosisEvent[];
  diagnoses: Diagnosis[];
  onAdd: (diagnosis: Omit<DiagnosisEvent, 'id' | 'created_at'>) => void;
};

export function DiagnosisSection({ controlPointId, diagnosisEvents, diagnoses, onAdd }: DiagnosisSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    diagnosis_id: '',
    role: 'primary' as DiagnosisEvent['role'],
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      control_point_id: controlPointId,
      ...formData,
      notes: formData.notes || undefined,
    });
    setFormData({ diagnosis_id: '', role: 'primary', notes: '' });
    setIsAdding(false);
  };

  const getRoleColor = (role: DiagnosisEvent['role']) => {
    switch (role) {
      case 'primary':
        return 'bg-red-100 text-red-700';
      case 'complication':
        return 'bg-orange-100 text-orange-700';
      case 'competing':
        return 'bg-purple-100 text-purple-700';
      case 'concomitant':
        return 'bg-blue-100 text-blue-700';
      case 'background':
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleText = (role: DiagnosisEvent['role']) => {
    switch (role) {
      case 'primary':
        return 'Основной';
      case 'complication':
        return 'Осложнение';
      case 'competing':
        return 'Конкурирующий';
      case 'concomitant':
        return 'Сопутствующий';
      case 'background':
        return 'Фоновый';
    }
  };

  const getDiagnosisInfo = (diagnosisId: string) => {
    return diagnoses.find(d => d.id === diagnosisId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900">Диагнозы на момент контрольной точки</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить диагноз
        </button>
      </div>

      {isAdding && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Диагноз *
              </label>
              <select
                required
                value={formData.diagnosis_id}
                onChange={(e) => setFormData({ ...formData, diagnosis_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Выберите диагноз...</option>
                {diagnoses.map(diagnosis => (
                  <option key={diagnosis.id} value={diagnosis.id}>
                    {diagnosis.code} - {diagnosis.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Роль диагноза *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as DiagnosisEvent['role'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="primary">Основной</option>
                <option value="complication">Осложнение</option>
                <option value="competing">Конкурирующий</option>
                <option value="concomitant">Сопутствующий</option>
                <option value="background">Фоновый</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Примечания
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация о диагнозе..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setFormData({ diagnosis_id: '', role: 'primary', notes: '' });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {diagnosisEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Диагнозы не зафиксированы</p>
        </div>
      ) : (
        <div className="space-y-3">
          {diagnosisEvents.map(event => {
            const diagnosis = getDiagnosisInfo(event.diagnosis_id);
            return (
              <div key={event.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(event.role)}`}>
                        {getRoleText(event.role)}
                      </span>
                      <span className="text-sm text-gray-600">{diagnosis?.code}</span>
                    </div>
                    <p className="text-gray-900">{diagnosis?.name}</p>
                    {event.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">{event.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
