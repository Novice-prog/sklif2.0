import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { ControlPoint } from '../types';
import { references } from '../data/mockData';

type AddControlPointModalProps = {
  diseaseId: string;
  controlPoint?: ControlPoint; // Для редактирования
  onClose: () => void;
  onAdd?: (cp: Omit<ControlPoint, 'id' | 'created_at'>) => void;
  onUpdate?: (id: string, cp: Partial<ControlPoint>) => void;
  onDelete?: (id: string) => void;
};

export function AddControlPointModal({ diseaseId, controlPoint, onClose, onAdd, onUpdate, onDelete }: AddControlPointModalProps) {
  const isEditing = !!controlPoint;
  
  const [formData, setFormData] = useState({
    name: controlPoint?.name || '',
    date: controlPoint?.date ? new Date(controlPoint.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: controlPoint?.date ? new Date(controlPoint.date).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5),
    notes: controlPoint?.notes || '',
  });

  const [showTemplates, setShowTemplates] = useState(!isEditing);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSelectTemplate = (templateName: string) => {
    setFormData({ ...formData, name: templateName });
    setShowTemplates(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && onUpdate && controlPoint) {
      onUpdate(controlPoint.id, {
        name: formData.name,
        date: new Date(`${formData.date}T${formData.time}:00`).toISOString(),
        notes: formData.notes || undefined,
      });
    } else if (onAdd) {
      onAdd({
        disease_id: diseaseId,
        ...formData,
        date: new Date(`${formData.date}T${formData.time}:00`).toISOString(),
        notes: formData.notes || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-gray-900">
            {isEditing ? 'Редактировать контрольную точку' : 'Добавить контрольную точку'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Шаблоны контрольных точек */}
          {showTemplates && (
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Выберите шаблон
              </label>
              <div className="grid grid-cols-2 gap-2">
                {references.controlPointTemplates.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => handleSelectTemplate(template.name)}
                    className="px-4 py-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="text-sm text-gray-900">{template.name}</div>
                    {template.description && (
                      <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Или ввести вручную
              </button>
            </div>
          )}

          {!showTemplates && (
            <>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Название <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="КТ1 - При поступлении"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowTemplates(true)}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Выбрать из шаблонов
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Дата и время <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Примечания
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Дополнительная информация..."
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
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title="Удалить контрольную точку"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </>
          )}
        </form>

        {/* Подтверждение удаления */}
        {isEditing && onDelete && showDeleteConfirm && (
          <div className="absolute inset-0 bg-transparent rounded-lg flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-lg p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <Trash2 className="w-6 h-6" />
                <h4 className="text-gray-900">Удаление контрольной точки</h4>
              </div>
              <p className="text-gray-700">
                Вы уверены, что хотите удалить контрольную точку "{controlPoint.name}"?
              </p>
              <p className="text-sm text-red-600">
                Внимание: Все связанные лабораторные данные и исследования также будут удалены.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onDelete(controlPoint.id)}
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