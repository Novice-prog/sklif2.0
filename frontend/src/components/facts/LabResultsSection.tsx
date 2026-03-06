import { useState } from 'react';
import { Plus, TestTube } from 'lucide-react';
import type { LabResult, Indicator, Biomaterial, IndicatorGroup } from '../../types';

type LabResultsSectionProps = {
  controlPointId: string;
  labResults: LabResult[];
  indicators: Indicator[];
  biomaterials: Biomaterial[];
  indicatorGroups: IndicatorGroup[];
  onAdd: (labResult: Omit<LabResult, 'id' | 'created_at'>) => void;
};

export function LabResultsSection({ 
  controlPointId, 
  labResults, 
  indicators, 
  biomaterials,
  indicatorGroups,
  onAdd 
}: LabResultsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    indicator_id: '',
    biomaterial_id: '',
    value_numeric: '',
    value_text: '',
    unit: '',
    reference_range: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      control_point_id: controlPointId,
      indicator_id: formData.indicator_id,
      biomaterial_id: formData.biomaterial_id,
      value_numeric: formData.value_numeric ? parseFloat(formData.value_numeric) : undefined,
      value_text: formData.value_text || undefined,
      unit: formData.unit || undefined,
      reference_range: formData.reference_range || undefined,
      notes: formData.notes || undefined,
    });
    setFormData({
      indicator_id: '',
      biomaterial_id: '',
      value_numeric: '',
      value_text: '',
      unit: '',
      reference_range: '',
      notes: '',
    });
    setIsAdding(false);
  };

  const getIndicatorInfo = (indicatorId: string) => {
    return indicators.find(i => i.id === indicatorId);
  };

  const getBiomaterialInfo = (biomaterialId: string) => {
    return biomaterials.find(b => b.id === biomaterialId);
  };

  const groupedResults = labResults.reduce((acc, result) => {
    const indicator = getIndicatorInfo(result.indicator_id);
    const groupId = indicator?.group_id || 'other';
    if (!acc[groupId]) acc[groupId] = [];
    acc[groupId].push(result);
    return acc;
  }, {} as Record<string, LabResult[]>);

  const selectedIndicator = indicators.find(i => i.id === formData.indicator_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900">Лабораторные результаты</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить результат
        </button>
      </div>

      {isAdding && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Показатель *
                </label>
                <select
                  required
                  value={formData.indicator_id}
                  onChange={(e) => {
                    const indicator = indicators.find(i => i.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      indicator_id: e.target.value,
                      unit: indicator?.unit || '',
                      reference_range: indicator?.reference_range || '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Выберите...</option>
                  {indicatorGroups.map(group => (
                    <optgroup key={group.id} label={group.name}>
                      {indicators.filter(i => i.group_id === group.id).map(indicator => (
                        <option key={indicator.id} value={indicator.id}>
                          {indicator.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Биоматериал *
                </label>
                <select
                  required
                  value={formData.biomaterial_id}
                  onChange={(e) => setFormData({ ...formData, biomaterial_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Выберите...</option>
                  {biomaterials.map(bio => (
                    <option key={bio.id} value={bio.id}>
                      {bio.name}
                    </option>
                  ))}
                </select>
              </div>
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
                  placeholder={selectedIndicator?.unit || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Референс
                </label>
                <input
                  type="text"
                  value={formData.reference_range}
                  onChange={(e) => setFormData({ ...formData, reference_range: e.target.value })}
                  placeholder={selectedIndicator?.reference_range || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Текстовое значение
              </label>
              <input
                type="text"
                value={formData.value_text}
                onChange={(e) => setFormData({ ...formData, value_text: e.target.value })}
                placeholder="Качественное описание результата"
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
                    indicator_id: '',
                    biomaterial_id: '',
                    value_numeric: '',
                    value_text: '',
                    unit: '',
                    reference_range: '',
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

      {labResults.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <TestTube className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Лабораторные результаты не зафиксированы</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedResults).map(([groupId, results]) => {
            const group = indicatorGroups.find(g => g.id === groupId);
            return (
              <div key={groupId}>
                <h4 className="text-sm text-gray-700 mb-2">{group?.name || 'Другое'}</h4>
                <div className="space-y-2">
                  {results.map(result => {
                    const indicator = getIndicatorInfo(result.indicator_id);
                    const biomaterial = getBiomaterialInfo(result.biomaterial_id);
                    return (
                      <div key={result.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-gray-900">{indicator?.name}</p>
                              <span className="text-xs text-gray-500">({biomaterial?.name})</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              {result.value_numeric !== undefined && (
                                <p className="text-gray-900">
                                  {result.value_numeric} {result.unit}
                                </p>
                              )}
                              {result.value_text && (
                                <p className="text-gray-700">{result.value_text}</p>
                              )}
                              {result.reference_range && (
                                <span className="text-xs text-gray-500">
                                  (норма: {result.reference_range})
                                </span>
                              )}
                            </div>
                            {result.notes && (
                              <p className="text-sm text-gray-600 mt-1 italic">{result.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
