import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, FlaskConical, Calendar, Clock, Table, LineChart } from 'lucide-react';
import type { Enrollment, ControlPoint, LabResult, InstrumentalStudy, References } from '../types';
import { AddControlPointModal } from './AddControlPointModal';
import { LabResultsTable } from './facts/LabResultsTable';
import { LabResultsCharts } from './facts/LabResultsCharts';

type EnrollmentViewProps = {
  enrollment: Enrollment;
  controlPoints: ControlPoint[];
  labResults: LabResult[];
  instrumentalStudies: InstrumentalStudy[];
  references: References;
  onBack: () => void;
  onSelectControlPoint: (cpId: string) => void;
  onAddControlPoint: (cp: Omit<ControlPoint, 'id' | 'created_at'>) => void;
  onAddLabResult: (labResult: Omit<LabResult, 'id' | 'created_at'>) => void;
};

export function EnrollmentView({
  enrollment,
  controlPoints,
  labResults,
  instrumentalStudies,
  references,
  onBack,
  onSelectControlPoint,
  onAddControlPoint,
  onAddLabResult,
}: EnrollmentViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [view, setView] = useState<'timeline' | 'labtable' | 'charts'>('labtable');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Enrollment['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: Enrollment['status']) => {
    switch (status) {
      case 'active':
        return 'Активно';
      case 'completed':
        return 'Завершено';
      case 'withdrawn':
        return 'Прервано';
    }
  };

  const getTemplateName = (templateId: string) => {
    return controlPoints.find(t => t.id === templateId)?.name || 'Неизвестная КТ';
  };

  const sortedInstances = [...controlPoints].sort((a, b) => {
    return (a.order_index || 0) - (b.order_index || 0);
  });

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Назад к списку пациентов
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <FlaskConical className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-gray-900">Участие в исследовании</h2>
              <p className="text-gray-600 mt-1">{enrollment.patient.full_name}</p>
            </div>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(enrollment.status)}`}>
            {getStatusText(enrollment.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Исследование</p>
            <p className="text-gray-900 mt-1">{enrollment.experiment.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Дата включения</p>
            <p className="text-gray-900 mt-1">{formatDate(enrollment.enrollment_date)}</p>
          </div>
          {enrollment.control_group && (
            <div>
              <p className="text-sm text-gray-600">Контрольная группа</p>
              <p className="text-gray-900 mt-1">{enrollment.control_group.name}</p>
            </div>
          )}
          {enrollment.notes && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Примечания</p>
              <p className="text-gray-900 mt-1">{enrollment.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-900">Контрольные точки (КТ)</h3>
          <p className="text-sm text-gray-600 mt-1">
            Визиты и наблюдения в рамках участия
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Добавить КТ
        </button>
      </div>

      <div className="space-y-3">
        {sortedInstances.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Контрольные точки не зафиксированы</p>
            <p className="text-sm text-gray-400 mt-1">
              Добавьте первую контрольную точку для начала сбора данных
            </p>
          </div>
        ) : (
          sortedInstances.map((instance) => {
            return (
              <div
                key={instance.id}
                onClick={() => onSelectControlPoint(instance.id)}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:border-blue-300 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg mt-1">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-gray-900">{instance.name || 'КТ'}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateTime(instance.actual_date)}
                        </span>
                      </div>
                      {instance.notes && (
                        <p className="text-sm text-gray-600 mt-2">{instance.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isAddModalOpen && (
        <AddControlPointModal
          enrollmentId={enrollment.id}
          templates={controlPoints}
          existingInstances={controlPoints}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={onAddControlPoint}
        />
      )}

      <div className="flex items-center justify-between mt-6">
        <div>
          <h3 className="text-gray-900">Лабораторные результаты</h3>
          <p className="text-sm text-gray-600 mt-1">
            Результаты анализов в рамках участия
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              view === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            Таймлайн
          </button>
          <button
            onClick={() => setView('labtable')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              view === 'labtable'
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
        </div>
      </div>

      {view === 'labtable' && (
        <LabResultsTable
          enrollmentId={enrollment.id}
          controlPointInstances={controlPoints}
          labResults={labResults}
          indicators={references.indicators}
          biomaterials={references.biomaterials}
          indicatorGroups={references.indicatorGroups}
          controlPointTemplates={controlPoints}
          onAdd={onAddLabResult}
        />
      )}

      {view === 'charts' && (
        <LabResultsCharts
          controlPointInstances={controlPoints}
          labResults={labResults}
          indicators={references.indicators}
          indicatorGroups={references.indicatorGroups}
          controlPointTemplates={controlPoints}
        />
      )}

      {view === 'timeline' && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Представление таймлайна в разработке</p>
          <p className="text-sm text-gray-400 mt-1">
            Используйте таблицу или графики для просмотра результатов
          </p>
        </div>
      )}
    </div>
  );
}