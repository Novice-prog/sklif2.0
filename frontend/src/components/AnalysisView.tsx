import { useState } from 'react';
import { TrendingUp, Users, GitCompare } from 'lucide-react';
import { GroupAnalysis } from './GroupAnalysis';
import { ComparativeAnalysis } from './ComparativeAnalysis';
import type { MedicalCase, Disease, ControlPoint, LabResult, InstrumentalStudy, DiagnosisRecord } from '../types';

interface AnalysisViewProps {
  medicalCases: MedicalCase[];
  diseases: Disease[];
  controlPoints: ControlPoint[];
  labResults: LabResult[];
  instrumentalStudies: InstrumentalStudy[];
  diagnosisRecords: DiagnosisRecord[];
}

export function AnalysisView({
  medicalCases,
  diseases,
  controlPoints,
  labResults,
  instrumentalStudies,
  diagnosisRecords
}: AnalysisViewProps) {
  const [activeTab, setActiveTab] = useState<'group' | 'comparative'>('group');
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-2">Анализ клинических данных</h2>
        <p className="text-sm text-gray-600">
          Групповой анализ и сравнение двух групп пациентов с расчетом статистических показателей
        </p>
      </div>

      {/* Вкладки */}
      <div className="sticky top-[73px] bg-white z-40 -mx-6 px-6 pt-4 pb-2 border-b border-gray-200 shadow-sm">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('group')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'group'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Групповой анализ</span>
            <span className="text-xs opacity-70">({currentYear})</span>
          </button>
          <button
            onClick={() => setActiveTab('comparative')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'comparative'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <GitCompare className="w-5 h-5" />
            <span>Сравнительный анализ</span>
            <span className="text-xs opacity-70">({currentYear})</span>
          </button>
        </div>
      </div>

      {/* Содержимое вкладок */}
      {activeTab === 'group' && (
        <GroupAnalysis
          medicalCases={medicalCases}
          diseases={diseases}
          controlPoints={controlPoints}
          labResults={labResults}
          instrumentalStudies={instrumentalStudies}
        />
      )}

      {activeTab === 'comparative' && (
        <ComparativeAnalysis
          medicalCases={medicalCases}
          diseases={diseases}
          controlPoints={controlPoints}
          labResults={labResults}
          diagnosisRecords={diagnosisRecords}
        />
      )}
    </div>
  );
}