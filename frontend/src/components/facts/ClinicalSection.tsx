import { useState } from 'react';
import { Plus, Stethoscope } from 'lucide-react';
import type { ClinicalState, ClinicalSign, Locus } from '../../types';

type ClinicalSectionProps = {
  controlPointId: string;
  clinicalStates: ClinicalState[];
  clinicalSigns: ClinicalSign[];
  loci: Locus[];
  onAdd: (state: Omit<ClinicalState, 'id' | 'created_at'>) => void;
};

export function ClinicalSection({ 
  controlPointId, 
  clinicalStates, 
  clinicalSigns,
  loci,
  onAdd 
}: ClinicalSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    clinical_sign_id: '',
    value_numeric: '',
    value_text: '',
    unit: '',
    locus_id: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      control_point_id: controlPointId,
      clinical_sign_id: formData.clinical_sign_id,
      value_numeric: formData.value_numeric ? parseFloat(formData.value_numeric) : undefined,
      value_text: formData.value_text || undefined,
      unit: formData.unit || undefined,
      locus_id: formData.locus_id || undefined,
      notes: formData.notes || undefined,
    });
    setFormData({
      clinical_sign_id: '',
      value_numeric: '',
      value_text: '',
      unit: '',
      locus_id: '',
      notes: '',
    });
    setIsAdding(false);
  };

  const getSignInfo = (signId: string) => {
    return clinicalSigns.find(s => s.id === signId);
  };

  const getLocusInfo = (locusId?: string) => {
    if (!locusId) return null;
    return loci.find(l => l.id === locusId);
  };

  const selectedSign = clinicalSigns.find(s => s.id === formData.clinical_sign_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900">Клиническое состояние</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить показатель
        </button>
      </div>

      {isAdding && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Клинический признак *
              </label>
              <select
                required
                value={formData.clinical_sign_id}
                onChange={(e) => {
                  const sign = clinicalSigns.find(s => s.id === e.target.value);
                  setFormData({ 
                    ...formData, 
                    clinical_sign_id: e.target.value,
                    unit: sign?.unit || '',
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Выберите...</option>
                {clinicalSigns.map(sign => (
                  <option key={sign.id} value={sign.id}>
                    {sign.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Числовое значение
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.value_numeric}
                  onChange={(e) => setFormData({ ...formData, value_numeric: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Единица измерения
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder={selectedSign?.unit || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Локализация
                </label>
                <select
                  value={formData.locus_id}
                  onChange={(e) => setFormData({ ...formData, locus_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Не указано</option>
                  {loci.map(locus => (
                    <option key={locus.id} value={locus.id}>
                      {locus.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Текстовое описание
              </label>
              <input
                type="text"
                value={formData.value_text}
                onChange={(e) => setFormData({ ...formData, value_text: e.target.value })}
                placeholder="Качественное описание состояния"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Примечания
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                    clinical_sign_id: '',
                    value_numeric: '',
                    value_text: '',
                    unit: '',
                    locus_id: '',
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

      {clinicalStates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Stethoscope className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Клинические показатели не зафиксированы</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clinicalStates.map(state => {
            const sign = getSignInfo(state.clinical_sign_id);
            const locus = getLocusInfo(state.locus_id);
            return (
              <div key={state.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-gray-900">{sign?.name}</p>
                      {locus && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {locus.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      {state.value_numeric !== undefined && (
                        <p className="text-gray-900">
                          {state.value_numeric} {state.unit}
                        </p>
                      )}
                      {state.value_text && (
                        <p className="text-gray-700">{state.value_text}</p>
                      )}
                    </div>
                    {state.notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">{state.notes}</p>
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
