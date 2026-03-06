import { useState } from 'react';
import { Plus, Search, AlertCircle } from 'lucide-react';
import type { MedicalCase } from '../types';
import { AddMedicalCaseModal } from './AddMedicalCaseModal';

type MedicalCaseListProps = {
  medicalCases: MedicalCase[];
  onSelectMedicalCase: (caseId: string) => void;
  onAddMedicalCase: (medicalCase: Omit<MedicalCase, 'id' | 'created_at'>) => void;
};

export function MedicalCaseList({ medicalCases, onSelectMedicalCase, onAddMedicalCase }: MedicalCaseListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCases = medicalCases.filter(medicalCase =>
    medicalCase.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicalCase.patient_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: MedicalCase['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Активно</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Завершено</span>;
      case 'archived':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Архив</span>;
    }
  };

  const getGenderLabel = (gender: MedicalCase['gender']) => {
    return gender === 'male' ? 'Мужской' : 'Женский';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Истории болезней</h2>
          <p className="text-sm text-gray-600 mt-1">
            Список историй болезней для научных исследований
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Добавить историю болезни
          </button>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по номеру истории болезни или коду пациента..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Список историй болезней */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Истории болезней не найдены</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Добавьте первую историю болезни для начала работы'}
            </p>
          </div>
        ) : (
          filteredCases.map(medicalCase => (
            <div
              key={medicalCase.id}
              onClick={() => onSelectMedicalCase(medicalCase.id)}
              className="bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900">История болезни № {medicalCase.case_number}</h3>
                    {getStatusBadge(medicalCase.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Код пациента:</span>
                      <div className="text-gray-900 mt-1">{medicalCase.patient_code}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Пол / Возраст:</span>
                      <div className="text-gray-900 mt-1">{getGenderLabel(medicalCase.gender)} / {medicalCase.age} лет</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Поступление:</span>
                      <div className="text-gray-900 mt-1">{formatDate(medicalCase.admission_date)}</div>
                    </div>
                    {medicalCase.discharge_date && (
                      <div>
                        <span className="text-gray-500">Выписка:</span>
                        <div className="text-gray-900 mt-1">{formatDate(medicalCase.discharge_date)}</div>
                      </div>
                    )}
                  </div>
                  {medicalCase.notes && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {medicalCase.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <AddMedicalCaseModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={(medicalCase) => {
            onAddMedicalCase(medicalCase);
            setIsAddModalOpen(false);
          }}
          existingCasesCount={medicalCases.length}
        />
      )}
    </div>
  );
}