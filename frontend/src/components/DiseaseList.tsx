import { useState } from 'react';
import { Plus, Search, AlertCircle } from 'lucide-react';
import type { Disease } from '../types';
import { AddDiseaseModal } from './AddDiseaseModal';

type DiseaseListProps = {
  diseases: Disease[];
  onSelectDisease: (diseaseId: string) => void;
  onAddDisease: (disease: Omit<Disease, 'id' | 'created_at'>) => void;
  onGroupAnalysis?: () => void;
};

export function DiseaseList({ diseases, onSelectDisease, onAddDisease, onGroupAnalysis }: DiseaseListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDiseases = diseases.filter(disease =>
    disease.disease_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    disease.patient_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    disease.diagnosis_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Disease['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Активно</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Завершено</span>;
      case 'archived':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Архив</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Заболевания</h2>
          <p className="text-sm text-gray-600 mt-1">
            Список заболеваний для научных исследований
          </p>
        </div>
        <div className="flex gap-3">
          {onGroupAnalysis && (
            <button
              onClick={onGroupAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Групповой анализ
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Добавить заболевание
          </button>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по названию болезни, коду пациента или диагнозу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Список заболеваний */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDiseases.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Заболевания не найдены</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Добавьте первое заболевание для начала работы'}
            </p>
          </div>
        ) : (
          filteredDiseases.map(disease => (
            <div
              key={disease.id}
              onClick={() => onSelectDisease(disease.id)}
              className="bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900">{disease.disease_name}</h3>
                    {getStatusBadge(disease.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Код пациента:</span>
                      <div className="text-gray-900 mt-1">{disease.patient_code}</div>
                    </div>
                    {disease.diagnosis_code && (
                      <div>
                        <span className="text-gray-500">МКБ-10:</span>
                        <div className="text-gray-900 mt-1">{disease.diagnosis_code}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Поступление:</span>
                      <div className="text-gray-900 mt-1">{formatDate(disease.admission_date)}</div>
                    </div>
                    {disease.discharge_date && (
                      <div>
                        <span className="text-gray-500">Выписка:</span>
                        <div className="text-gray-900 mt-1">{formatDate(disease.discharge_date)}</div>
                      </div>
                    )}
                  </div>
                  {disease.notes && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {disease.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <AddDiseaseModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={(disease) => {
            onAddDisease(disease);
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
}