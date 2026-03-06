import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, ClipboardList, FlaskConical, Activity, Calculator, TrendingUp, Lightbulb, Stethoscope, BarChart3, AlertTriangle } from 'lucide-react';
import type { Disease, ControlPoint, LabResult, InstrumentalStudy, DiagnosisRecord, References, LabResultChangeLog, UserRole } from '../types';
import { LabDataView } from './LabDataView';
import { InstrumentalDataView } from './InstrumentalDataView';
import { DiagnosisDataView } from './DiagnosisDataView';
import { IndividualAnalysis } from './IndividualAnalysis';
import { DeltaCalculator } from './DeltaCalculator';
import { ComplicationsForecast } from './ComplicationsForecast';
import { AddControlPointModal } from './AddControlPointModal';
import { AddDiseaseModal } from './AddDiseaseModal';

type DiseaseViewProps = {
  disease: Disease;
  allDiseases: Disease[]; // Все диагнозы пациента для выпадающего списка
  controlPoints: ControlPoint[];
  labResults: LabResult[];
  instrumentalStudies: InstrumentalStudy[];
  diagnosisRecords: DiagnosisRecord[];
  labResultChangeLogs: LabResultChangeLog[]; // Логи изменений лабораторных данных
  references: References;
  caseNumber?: string; // Номер истории болезни для экспорта
  patientGender?: 'male' | 'female';
  userRole?: UserRole; // Роль текущего пользователя
  onBack: () => void;
  onUpdateDisease: (id: string, updates: Partial<Disease>) => void;
  onDeleteDisease: (id: string) => void;
  onAddControlPoint: (cp: Omit<ControlPoint, 'id' | 'created_at'>) => void;
  onUpdateControlPoint: (id: string, updates: Partial<ControlPoint>) => void;
  onDeleteControlPoint: (id: string) => void;
  onAddLabResult: (result: Omit<LabResult, 'id' | 'created_at'>) => void;
  onUpdateLabResult: (id: string, updates: Partial<LabResult>) => void;
  onDeleteLabResult: (id: string) => void;
  onAddInstrumentalStudy: (study: Omit<InstrumentalStudy, 'id' | 'created_at'>) => void;
  onAddDiagnosisRecord: (record: Omit<DiagnosisRecord, 'id' | 'created_at'>) => void;
  onUpdateDiagnosisRecord: (id: string, updates: Partial<DiagnosisRecord>) => void;
  onDeleteDiagnosisRecord: (id: string) => void;
};

export function DiseaseView({
  disease,
  allDiseases,
  controlPoints,
  labResults,
  instrumentalStudies,
  diagnosisRecords,
  labResultChangeLogs,
  references,
  caseNumber = '',
  patientGender = 'male',
  userRole = 'doctor',
  onBack,
  onUpdateDisease,
  onDeleteDisease,
  onAddControlPoint,
  onUpdateControlPoint,
  onDeleteControlPoint,
  onAddLabResult,
  onUpdateLabResult,
  onDeleteLabResult,
  onAddInstrumentalStudy,
  onAddDiagnosisRecord,
  onUpdateDiagnosisRecord,
  onDeleteDiagnosisRecord,
}: DiseaseViewProps) {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'lab' | 'instrumental' | 'analysis' | 'forecast' | 'calculator'>('diagnosis');
  const [isAddCPModalOpen, setIsAddCPModalOpen] = useState(false);
  const [isEditDiseaseModalOpen, setIsEditDiseaseModalOpen] = useState(false);
  const [editingControlPoint, setEditingControlPoint] = useState<ControlPoint | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const handleImportFromExcel = (controlPointId: string, data: Array<{ indicatorId: string; value: number }>) => {
    // Добавляем все импортированные показатели
    data.forEach(item => {
      onAddLabResult({
        control_point_id: controlPointId,
        indicator_id: item.indicatorId,
        value: item.value,
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-gray-900">{disease.disease_name}</h2>
            <button
              onClick={() => setIsEditDiseaseModalOpen(true)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex gap-6 text-sm text-gray-600">
            {disease.diagnosis_code && <span>МКБ-10: {disease.diagnosis_code}</span>}
            <span>Дата постановки диагноза: {formatDate(disease.diagnosis_date)}</span>
          </div>
        </div>
        <button
          onClick={() => setIsAddCPModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Добавить КТ
        </button>
      </div>

      {/* Контрольные точки */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm text-gray-700 mb-3">Контрольные точки ({controlPoints.length})</h3>
        {controlPoints.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Нет контрольных точек. Добавьте первую контрольную точку д��я начала ввода данных.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {controlPoints
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(cp => (
                <div
                  key={cp.id}
                  className="group px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm hover:bg-blue-100 transition-colors relative"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="text-gray-900">{cp.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{formatDate(cp.date)}</div>
                    </div>
                    <button
                      onClick={() => setEditingControlPoint(cp)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-200 rounded"
                      title="Редактировать контрольную точку"
                    >
                      <Edit2 className="w-4 h-4 text-blue-700" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Вкладки */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'diagnosis'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Диагнозы
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'lab'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FlaskConical className="w-5 h-5" />
            Лабораторные исследования
          </button>
          <button
            onClick={() => setActiveTab('instrumental')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'instrumental'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Stethoscope className="w-5 h-5" />
            Инструментальные исследования
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'analysis'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Анализ
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'forecast'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            Прогноз
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'calculator'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calculator className="w-5 h-5" />
            Калькулятор
          </button>
        </div>
      </div>

      {/* Содержимое вкладок */}
      {activeTab === 'diagnosis' && (
        <DiagnosisDataView
          controlPoints={controlPoints}
          diagnosisRecords={diagnosisRecords}
          diseases={allDiseases}
          onAddRecord={onAddDiagnosisRecord}
          onUpdateRecord={onUpdateDiagnosisRecord}
          onDeleteRecord={onDeleteDiagnosisRecord}
        />
      )}

      {activeTab === 'lab' && (
        <LabDataView
          controlPoints={controlPoints}
          labResults={labResults}
          labResultChangeLogs={labResultChangeLogs}
          references={references}
          onAddLabResult={onAddLabResult}
          onUpdateLabResult={onUpdateLabResult}
          onDeleteLabResult={onDeleteLabResult}
          onImportFromExcel={handleImportFromExcel}
          caseNumber={caseNumber}
          diseaseName={disease.disease_name}
          patientGender={patientGender}
          userRole={userRole}
        />
      )}

      {activeTab === 'instrumental' && (
        <InstrumentalDataView
          controlPoints={controlPoints}
          instrumentalStudies={instrumentalStudies}
          studyTypes={references.instrumentalStudyTypes}
          onAddStudy={onAddInstrumentalStudy}
        />
      )}

      {activeTab === 'analysis' && (
        <IndividualAnalysis
          controlPoints={controlPoints}
          labResults={labResults}
          instrumentalStudies={instrumentalStudies}
          references={references}
          caseNumber={caseNumber}
          diseaseName={disease.disease_name}
        />
      )}

      {activeTab === 'forecast' && (
        <ComplicationsForecast
          controlPoints={controlPoints}
          labResults={labResults}
        />
      )}

      {activeTab === 'calculator' && (
        <DeltaCalculator
          controlPoints={controlPoints}
          labResults={labResults}
          instrumentalStudies={instrumentalStudies}
          references={references}
        />
      )}

      {/* Модальное окно добавления КТ */}
      {isAddCPModalOpen && (
        <AddControlPointModal
          diseaseId={disease.id}
          onClose={() => setIsAddCPModalOpen(false)}
          onAdd={(cp) => {
            onAddControlPoint(cp);
            setIsAddCPModalOpen(false);
          }}
        />
      )}

      {/* Модальное окно редактирования болезни */}
      {isEditDiseaseModalOpen && (
        <AddDiseaseModal
          medicalCaseId={disease.medical_case_id}
          disease={disease}
          existingDiseases={allDiseases}
          onClose={() => setIsEditDiseaseModalOpen(false)}
          onUpdate={(id, updates) => {
            onUpdateDisease(id, updates);
            setIsEditDiseaseModalOpen(false);
          }}
          onDelete={(id) => {
            onDeleteDisease(id);
            setIsEditDiseaseModalOpen(false);
          }}
        />
      )}

      {/* Модальное окно редактирования КТ */}
      {editingControlPoint && (
        <AddControlPointModal
          diseaseId={disease.id}
          controlPoint={editingControlPoint}
          onClose={() => setEditingControlPoint(null)}
          onUpdate={(id, updates) => {
            onUpdateControlPoint(id, updates);
            setEditingControlPoint(null);
          }}
          onDelete={(id) => {
            onDeleteControlPoint(id);
            setEditingControlPoint(null);
          }}
        />
      )}
    </div>
  );
}