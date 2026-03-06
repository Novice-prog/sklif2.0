import { useState } from 'react';
import { Plus, Pill, Calendar } from 'lucide-react';
import type { TreatmentEvent, TreatmentMethod } from '../../types';

type TreatmentSectionProps = {
  controlPointId: string;
  treatmentEvents: TreatmentEvent[];
  treatmentMethods: TreatmentMethod[];
  onAdd: (treatment: Omit<TreatmentEvent, 'id' | 'created_at'>) => void;
};

export function TreatmentSection({ 
  controlPointId, 
  treatmentEvents, 
  treatmentMethods,
  onAdd 
}: TreatmentSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    treatment_method_id: '',
    dosage: '',
    frequency: '',
    route: '',
    start_date: '',
    end_date: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      control_point_id: controlPointId,
      ...formData,
      dosage: formData.dosage || undefined,
      frequency: formData.frequency || undefined,
      route: formData.route || undefined,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      notes: formData.notes || undefined,
    });
    setFormData({
      treatment_method_id: '',
      dosage: '',
      frequency: '',
      route: '',
      start_date: '',
      end_date: '',
      notes: '',
    });
    setIsAdding(false);
  };

  const getMethodInfo = (methodId: string) => {
    return treatmentMethods.find(m => m.id === methodId);
  };

  const groupedByCategory = treatmentEvents.reduce((acc, event) => {
    const method = getMethodInfo(event.treatment_method_id);
    const category = method?.category || 'Другое';
    if (!acc[category]) acc[category] = [];
    acc[category].push(event);
    return acc;
  }, {} as Record<string, TreatmentEvent[]>);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900">Назначенное лечение</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить назначение
        </button>
      </div>

      {isAdding && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Метод лечения *
              </label>
              <select
                required
                value={formData.treatment_method_id}
                onChange={(e) => setFormData({ ...formData, treatment_method_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Выберите...</option>
                {treatmentMethods.reduce((acc, method) => {
                  const category = method.category || 'Другое';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(method);
                  return acc;
                }, {} as Record<string, TreatmentMethod[]>)
                  .constructor === Object && 
                  Object.entries(
                    treatmentMethods.reduce((acc, method) => {
                      const category = method.category || 'Другое';
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(method);
                      return acc;
                    }, {} as Record<string, TreatmentMethod[]>)
                  ).map(([category, methods]) => (
                    <optgroup key={category} label={category}>
                      {methods.map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                    </optgroup>
                  ))
                }
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Дозировка/Объем
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="500 мл, 10 мг и т.д."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Частота
                </label>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  placeholder="2 раза в сутки"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Путь введения
              </label>
              <input
                type="text"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                placeholder="В/в капельно, перорально и т.д."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Дата начала
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Дата окончания
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="Дополнительная информация о назначении..."
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
                  setFormData({
                    treatment_method_id: '',
                    dosage: '',
                    frequency: '',
                    route: '',
                    start_date: '',
                    end_date: '',
                    notes: '',
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {treatmentEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Pill className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Назначения не зафиксированы</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByCategory).map(([category, events]) => (
            <div key={category}>
              <h4 className="text-sm text-gray-700 mb-2">{category}</h4>
              <div className="space-y-2">
                {events.map(event => {
                  const method = getMethodInfo(event.treatment_method_id);
                  return (
                    <div key={event.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg mt-1">
                          <Pill className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-gray-900 mb-2">{method?.name}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {event.dosage && (
                              <div>
                                <span className="text-gray-600">Дозировка:</span>
                                <span className="text-gray-900 ml-1">{event.dosage}</span>
                              </div>
                            )}
                            {event.frequency && (
                              <div>
                                <span className="text-gray-600">Частота:</span>
                                <span className="text-gray-900 ml-1">{event.frequency}</span>
                              </div>
                            )}
                            {event.route && (
                              <div>
                                <span className="text-gray-600">Путь введения:</span>
                                <span className="text-gray-900 ml-1">{event.route}</span>
                              </div>
                            )}
                          </div>
                          {(event.start_date || event.end_date) && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {event.start_date && <span>С {formatDate(event.start_date)}</span>}
                              {event.end_date && <span>По {formatDate(event.end_date)}</span>}
                            </div>
                          )}
                          {event.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">{event.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
