import { useState } from 'react';
import { ArrowLeft, Plus, FileText, Settings, Check, Archive, Activity } from 'lucide-react';
import type { MedicalCase, Disease } from '../types';
import { AddDiseaseModal } from './AddDiseaseModal';

type MedicalCaseViewProps = {
  medicalCase: MedicalCase;
  diseases: Disease[];
  onBack: () => void;
  onSelectDisease: (diseaseId: string) => void;
  onAddDisease: (disease: Omit<Disease, 'id' | 'created_at'>) => void;
  onUpdateStatus: (status: MedicalCase['status']) => void;
};

export function MedicalCaseView({ medicalCase, diseases, onBack, onSelectDisease, onAddDisease, onUpdateStatus }: MedicalCaseViewProps) {
  const [isAddDiseaseModalOpen, setIsAddDiseaseModalOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('ru-RU');
    const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return { date: dateStr, time: timeStr };
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-gray-900">История болезни № {medicalCase.case_number}</h2>
            
            <div className="relative">
              <button
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  medicalCase.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                  medicalCase.status === 'completed' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                  'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {medicalCase.status === 'active' && <Activity className="w-4 h-4" />}
                {medicalCase.status === 'completed' && <Check className="w-4 h-4" />}
                {medicalCase.status === 'archived' && <Archive className="w-4 h-4" />}
                <span>
                  {medicalCase.status === 'active' ? 'Активно' :
                   medicalCase.status === 'completed' ? 'Завершено' : 'Архив'}
                </span>
                <Settings className="w-3 h-3 ml-1 opacity-50" />
              </button>

              {isStatusMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setIsStatusMenuOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                    <button
                      onClick={() => {
                        onUpdateStatus('active');
                        setIsStatusMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${
                        medicalCase.status === 'active' ? 'text-green-700 bg-green-50' : 'text-gray-700'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      Активно
                    </button>
                    <button
                      onClick={() => {
                        onUpdateStatus('completed');
                        setIsStatusMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${
                        medicalCase.status === 'completed' ? 'text-blue-700 bg-blue-50' : 'text-gray-700'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      Завершено
                    </button>
                    <button
                      onClick={() => {
                        onUpdateStatus('archived');
                        setIsStatusMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${
                        medicalCase.status === 'archived' ? 'text-gray-900 bg-gray-50' : 'text-gray-700'
                      }`}
                    >
                      <Archive className="w-4 h-4" />
                      В архив
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Код пациента: {medicalCase.patient_code}</p>
        </div>
      </div>

      {/* Информация об истории болезни */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">Общая информация</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Номер ИБ:</span>
            <div className="text-gray-900 mt-1">{medicalCase.case_number}</div>
          </div>
          <div>
            <span className="text-gray-500">Код пациента:</span>
            <div className="text-gray-900 mt-1">{medicalCase.patient_code}</div>
          </div>
          <div>
            <span className="text-gray-500">Поступление:</span>
            <div className="text-gray-900 mt-1">
              {formatDateTime(medicalCase.admission_date).date}
              <span className="text-blue-600 ml-2">{formatDateTime(medicalCase.admission_date).time}</span>
            </div>
          </div>
          {medicalCase.discharge_date && (
            <div>
              <span className="text-gray-500">Выписка:</span>
              <div className="text-gray-900 mt-1">
                {formatDateTime(medicalCase.discharge_date).date}
                <span className="text-blue-600 ml-2">{formatDateTime(medicalCase.discharge_date).time}</span>
              </div>
            </div>
          )}
        </div>
        {medicalCase.notes && (
          <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {medicalCase.notes}
          </div>
        )}
      </div>

      {/* Раздел выбора диагноза */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900">Диагнозы</h3>
          <button
            onClick={() => setIsAddDiseaseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить диагноз
          </button>
        </div>

        {diseases.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Диагнозы не добавлены</p>
            <p className="text-sm text-gray-400 mt-1">
              Добавьте первый диагноз для начала работы с контрольными точками и анализами
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {diseases.map(disease => (
              <div
                key={disease.id}
                onClick={() => onSelectDisease(disease.id)}
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-gray-900">{disease.disease_name}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                      {disease.diagnosis_code && (
                        <div>
                          <span className="text-gray-500">МКБ-10:</span>
                          <span className="text-gray-900 ml-2">{disease.diagnosis_code}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Дата постановки:</span>
                        <span className="text-gray-900 ml-2">{formatDate(disease.diagnosis_date)}</span>
                      </div>
                    </div>
                    {disease.notes && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {disease.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddDiseaseModalOpen && (
        <AddDiseaseModal
          medicalCaseId={medicalCase.id}
          existingDiseases={diseases}
          onClose={() => setIsAddDiseaseModalOpen(false)}
          onAdd={(disease) => {
            onAddDisease(disease);
            setIsAddDiseaseModalOpen(false);
          }}
        />
      )}
    </div>
  );
}