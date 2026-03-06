import { useState } from 'react';
import { X } from 'lucide-react';
import type { ControlPoint, InstrumentalStudy, InstrumentalStudyType } from '../types';

type AddInstrumentalStudyModalProps = {
  controlPoints: ControlPoint[];
  studyTypes: InstrumentalStudyType[];
  onClose: () => void;
  onAdd: (study: Omit<InstrumentalStudy, 'id' | 'created_at'>) => void;
};

export function AddInstrumentalStudyModal({
  controlPoints,
  studyTypes,
  onClose,
  onAdd,
}: AddInstrumentalStudyModalProps) {
  const [formData, setFormData] = useState({
    control_point_id: controlPoints[0]?.id || '',
    study_type_id: studyTypes[0]?.id || '',
    findings: '',
    conclusion: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      conclusion: formData.conclusion || undefined,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-gray-900">Добавить инструментальное исследование</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Контрольная точка <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.control_point_id}
              onChange={(e) => setFormData({ ...formData, control_point_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {controlPoints
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(cp => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name} ({formatDate(cp.date)})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Тип исследования <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.study_type_id}
              onChange={(e) => setFormData({ ...formData, study_type_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {studyTypes
                .sort((a, b) => a.order_index - b.order_index)
                .map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Результаты исследования <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.findings}
              onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
              placeholder="Описание результатов исследования..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Заключение
            </label>
            <textarea
              value={formData.conclusion}
              onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
              placeholder="Заключение врача..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Добавить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}