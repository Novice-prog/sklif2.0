import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import type { ControlPoint, InstrumentalStudy, InstrumentalStudyType } from '../types';
import { AddInstrumentalStudyModal } from './AddInstrumentalStudyModal';

type InstrumentalDataViewProps = {
  controlPoints: ControlPoint[];
  instrumentalStudies: InstrumentalStudy[];
  studyTypes: InstrumentalStudyType[];
  onAddStudy: (study: Omit<InstrumentalStudy, 'id' | 'created_at'>) => void;
};

export function InstrumentalDataView({
  controlPoints,
  instrumentalStudies,
  studyTypes,
  onAddStudy,
}: InstrumentalDataViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getControlPointName = (cpId: string) => {
    return controlPoints.find(cp => cp.id === cpId)?.name || 'Неизвестная КТ';
  };

  const getStudyTypeName = (typeId: string) => {
    return studyTypes.find(st => st.id === typeId)?.name || 'Неизвестный тип';
  };

  if (controlPoints.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">Добавьте контрольные точки для начала ввода данных инструментальных исследований</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-gray-900">Инструментальные исследования</h3>
          <p className="text-sm text-gray-600 mt-1">
            Результаты УЗИ, КТ, МРТ, ЭКГ и других исследований
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Добавить исследование
        </button>
      </div>

      {instrumentalStudies.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Нет инструментальных исследований</p>
          <p className="text-sm text-gray-400 mt-1">
            Добавьте первое исследование
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {controlPoints
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(cp => {
              const cpStudies = instrumentalStudies.filter(s => s.control_point_id === cp.id);
              if (cpStudies.length === 0) return null;

              return (
                <div key={cp.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="mb-4 pb-3 border-b border-gray-200">
                    <h4 className="text-gray-900">{cp.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{formatDate(cp.date)}</p>
                  </div>

                  <div className="space-y-4">
                    {cpStudies.map(study => (
                      <div key={study.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h5 className="text-gray-900 mb-2">{getStudyTypeName(study.study_type_id)}</h5>
                            
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm text-gray-600">Результаты:</span>
                                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                                  {study.findings}
                                </p>
                              </div>

                              {study.conclusion && (
                                <div>
                                  <span className="text-sm text-gray-600">Заключение:</span>
                                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                                    {study.conclusion}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {isAddModalOpen && (
        <AddInstrumentalStudyModal
          controlPoints={controlPoints}
          studyTypes={studyTypes}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={(study) => {
            onAddStudy(study);
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
