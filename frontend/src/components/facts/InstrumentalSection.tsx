import { useState } from 'react';
import { Plus, Activity } from 'lucide-react';
import type { InstrumentalResult, InstrumentalStudy, Locus } from '../../types';

type InstrumentalSectionProps = {
  controlPointId: string;
  instrumentalResults: InstrumentalResult[];
  studies: InstrumentalStudy[];
  loci: Locus[];
  onAdd: (result: Omit<InstrumentalResult, 'id' | 'created_at'>) => void;
};

export function InstrumentalSection({ 
  controlPointId, 
  instrumentalResults, 
  studies,
  loci,
  onAdd 
}: InstrumentalSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    study_id: '',
    findings: '',
    conclusion: '',
    locus_id: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      control_point_id: controlPointId,
      ...formData,
      conclusion: formData.conclusion || undefined,
      locus_id: formData.locus_id || undefined,
    });
    setFormData({
      study_id: '',
      findings: '',
      conclusion: '',
      locus_id: '',
    });
    setIsAdding(false);
  };

  const getStudyInfo = (studyId: string) => {
    return studies.find(s => s.id === studyId);
  };

  const getLocusInfo = (locusId?: string) => {
    if (!locusId) return null;
    return loci.find(l => l.id === locusId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900">Инструментальные исследования</h3>
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
                  Вид исследования *
                </label>
                <select
                  required
                  value={formData.study_id}
                  onChange={(e) => setFormData({ ...formData, study_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Выберите...</option>
                  {studies.map(study => (
                    <option key={study.id} value={study.id}>
                      {study.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Локализация/Орган
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
                Описание/Находки *
              </label>
              <textarea
                required
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                placeholder="Подробное описание результатов исследования..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Заключение
              </label>
              <textarea
                value={formData.conclusion}
                onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                placeholder="Краткое заключение врача..."
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
                    study_id: '',
                    findings: '',
                    conclusion: '',
                    locus_id: '',
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

      {instrumentalResults.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Инструментальные исследования не проведены</p>
        </div>
      ) : (
        <div className="space-y-3">
          {instrumentalResults.map(result => {
            const study = getStudyInfo(result.study_id);
            const locus = getLocusInfo(result.locus_id);
            return (
              <div key={result.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg mt-1">
                    <Activity className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-gray-900">{study?.name}</h4>
                      {locus && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {locus.name}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">Описание:</p>
                        <p className="text-sm text-gray-900">{result.findings}</p>
                      </div>
                      {result.conclusion && (
                        <div>
                          <p className="text-xs text-gray-600">Заключение:</p>
                          <p className="text-sm text-gray-900">{result.conclusion}</p>
                        </div>
                      )}
                    </div>
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
