import { useState } from 'react';
import { ArrowLeft, Plus, FileText, TestTube, Activity, Stethoscope, Pill } from 'lucide-react';
import type {
  ControlPointInstance,
  ControlPointTemplate,
  Enrollment,
  Patient,
  DiagnosisEvent,
  LabResult,
  InstrumentalResult,
  ClinicalState,
  TreatmentEvent,
  References,
} from '../types';
import { DiagnosisSection } from './facts/DiagnosisSection';
import { LabResultsSection } from './facts/LabResultsSection';
import { InstrumentalSection } from './facts/InstrumentalSection';
import { ClinicalSection } from './facts/ClinicalSection';
import { TreatmentSection } from './facts/TreatmentSection';

type ControlPointViewProps = {
  controlPointInstance: ControlPointInstance;
  enrollment: Enrollment;
  patient: Patient;
  controlPointTemplate: ControlPointTemplate;
  diagnosisEvents: DiagnosisEvent[];
  labResults: LabResult[];
  instrumentalResults: InstrumentalResult[];
  clinicalStates: ClinicalState[];
  treatmentEvents: TreatmentEvent[];
  references: References;
  onBack: () => void;
  onAddDiagnosis: (diagnosis: Omit<DiagnosisEvent, 'id' | 'created_at'>) => void;
  onAddLabResult: (labResult: Omit<LabResult, 'id' | 'created_at'>) => void;
  onAddInstrumentalResult: (result: Omit<InstrumentalResult, 'id' | 'created_at'>) => void;
  onAddClinicalState: (state: Omit<ClinicalState, 'id' | 'created_at'>) => void;
  onAddTreatment: (treatment: Omit<TreatmentEvent, 'id' | 'created_at'>) => void;
};

export function ControlPointView({
  controlPointInstance,
  enrollment,
  patient,
  controlPointTemplate,
  diagnosisEvents,
  labResults,
  instrumentalResults,
  clinicalStates,
  treatmentEvents,
  references,
  onBack,
  onAddDiagnosis,
  onAddLabResult,
  onAddInstrumentalResult,
  onAddClinicalState,
  onAddTreatment,
}: ControlPointViewProps) {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'lab' | 'instrumental' | 'clinical' | 'treatment'>('diagnosis');

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { id: 'diagnosis' as const, label: 'Диагнозы', icon: FileText, count: diagnosisEvents.length },
    { id: 'lab' as const, label: 'Лабораторные', icon: TestTube, count: labResults.length },
    { id: 'instrumental' as const, label: 'Инструментальные', icon: Activity, count: instrumentalResults.length },
    { id: 'clinical' as const, label: 'Клиника', icon: Stethoscope, count: clinicalStates.length },
    { id: 'treatment' as const, label: 'Лечение', icon: Pill, count: treatmentEvents.length },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Назад к участию
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-gray-900">{controlPointTemplate.name}</h2>
            <p className="text-gray-600 mt-1">{patient.full_name}</p>
            <p className="text-sm text-gray-500 mt-2">
              Фактическая дата: {formatDateTime(controlPointInstance.actual_date)}
            </p>
            {controlPointInstance.notes && (
              <p className="text-sm text-gray-600 mt-2 italic">{controlPointInstance.notes}</p>
            )}
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'diagnosis' && (
            <DiagnosisSection
              controlPointId={controlPointInstance.id}
              diagnosisEvents={diagnosisEvents}
              diagnoses={references.diagnoses}
              onAdd={onAddDiagnosis}
            />
          )}

          {activeTab === 'lab' && (
            <LabResultsSection
              controlPointId={controlPointInstance.id}
              labResults={labResults}
              indicators={references.indicators}
              biomaterials={references.biomaterials}
              indicatorGroups={references.indicatorGroups}
              onAdd={onAddLabResult}
            />
          )}

          {activeTab === 'instrumental' && (
            <InstrumentalSection
              controlPointId={controlPointInstance.id}
              instrumentalResults={instrumentalResults}
              studies={references.instrumentalStudies}
              loci={references.loci}
              onAdd={onAddInstrumentalResult}
            />
          )}

          {activeTab === 'clinical' && (
            <ClinicalSection
              controlPointId={controlPointInstance.id}
              clinicalStates={clinicalStates}
              clinicalSigns={references.clinicalSigns}
              loci={references.loci}
              onAdd={onAddClinicalState}
            />
          )}

          {activeTab === 'treatment' && (
            <TreatmentSection
              controlPointId={controlPointInstance.id}
              treatmentEvents={treatmentEvents}
              treatmentMethods={references.treatmentMethods}
              onAdd={onAddTreatment}
            />
          )}
        </div>
      </div>
    </div>
  );
}
