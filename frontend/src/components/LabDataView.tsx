import { useState } from 'react';
import { Table, LineChart, History, FileUp } from 'lucide-react';
import type { ControlPoint, LabResult, References, LabResultChangeLog, UserRole } from '../types';
import { LabResultsTable } from './facts/LabResultsTable';
import { LabResultsCharts } from './facts/LabResultsCharts';
import { LabResultsChangeHistory } from './facts/LabResultsChangeHistory';
import { ImportExcelModal } from './ImportExcelModal';

type LabDataViewProps = {
  controlPoints: ControlPoint[];
  labResults: LabResult[];
  labResultChangeLogs: LabResultChangeLog[];
  references: References;
  onAddLabResult: (result: Omit<LabResult, 'id' | 'created_at'>) => void;
  onUpdateLabResult: (id: string, updates: Partial<LabResult>) => void;
  onDeleteLabResult: (id: string) => void;
  onImportFromExcel?: (controlPointId: string, data: Array<{ indicatorId: string; value: number }>) => void;
  caseNumber?: string;
  diseaseName?: string;
  patientGender?: 'male' | 'female';
  userRole?: UserRole;
};

export function LabDataView({
  controlPoints,
  labResults,
  labResultChangeLogs,
  references,
  onAddLabResult,
  onUpdateLabResult,
  onDeleteLabResult,
  onImportFromExcel,
  caseNumber = '',
  diseaseName = '',
  patientGender = 'male',
  userRole = 'doctor',
}: LabDataViewProps) {
  const [view, setView] = useState<'table' | 'charts' | 'history'>('table');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  if (controlPoints.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">Добавьте контрольные точки для начала ввода лабораторных данных</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Переключатель вида */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setView('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'table'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Table className="w-5 h-5" />
          Таблица
        </button>
        <button
          onClick={() => setView('charts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'charts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <LineChart className="w-5 h-5" />
          Графики
        </button>
        <button
          onClick={() => setView('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <History className="w-5 h-5" />
          История изменений
        </button>
      </div>

      {/* Содержимое */}
      {view === 'table' && (
        <LabResultsTable
          controlPoints={controlPoints}
          labResults={labResults}
          labGroups={references.labGroups}
          labIndicators={references.labIndicators}
          onAdd={onAddLabResult}
          onUpdate={onUpdateLabResult}
          onDelete={onDeleteLabResult}
          onOpenImport={onImportFromExcel ? () => setIsImportModalOpen(true) : undefined}
          caseNumber={caseNumber}
          diseaseName={diseaseName}
          patientGender={patientGender}
          userRole={userRole}
        />
      )}

      {view === 'charts' && (
        <LabResultsCharts
          controlPoints={controlPoints}
          labResults={labResults}
          labGroups={references.labGroups}
          labIndicators={references.labIndicators}
          caseNumber={caseNumber}
          diseaseName={diseaseName}
          patientGender={patientGender}
        />
      )}

      {view === 'history' && (
        <LabResultsChangeHistory
          labResultChangeLogs={labResultChangeLogs}
          labGroups={references.labGroups}
          labIndicators={references.labIndicators}
        />
      )}

      {isImportModalOpen && (
        <ImportExcelModal
          controlPoints={controlPoints}
          labIndicators={references.labIndicators}
          onClose={() => setIsImportModalOpen(false)}
          onImport={onImportFromExcel}
        />
      )}
    </div>
  );
}