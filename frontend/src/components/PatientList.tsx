import { useState } from 'react';
import { Plus, Search, User, Calendar, FlaskConical } from 'lucide-react';
import type { Patient, Enrollment, Experiment } from '../types';
import { AddPatientModal } from './AddPatientModal';
import { AddEnrollmentModal } from './AddEnrollmentModal';

type PatientListProps = {
  patients: Patient[];
  enrollments: Enrollment[];
  experiments: Experiment[];
  onSelectEnrollment: (enrollmentId: string) => void;
  onAddPatient: (patient: Omit<Patient, 'id' | 'created_at'>) => void;
  onAddEnrollment: (enrollment: Omit<Enrollment, 'id' | 'created_at'>) => void;
};

export function PatientList({ 
  patients, 
  enrollments, 
  experiments,
  onSelectEnrollment, 
  onAddPatient,
  onAddEnrollment,
}: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [selectedPatientForEnrollment, setSelectedPatientForEnrollment] = useState<string | null>(null);

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.medical_record_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getPatientEnrollments = (patientId: string) => {
    return enrollments.filter(e => e.patient_id === patientId);
  };

  const getExperimentName = (experimentId: string) => {
    return experiments.find(e => e.id === experimentId)?.name || 'Неизвестное исследование';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Пациенты и участия</h2>
          <p className="text-gray-600 mt-1">
            Управление пациентами и их участием в исследованиях
          </p>
        </div>
        <button
          onClick={() => setIsAddPatientModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Добавить пациента
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по ФИО или номеру карты..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredPatients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Пациенты не найдены</p>
            </div>
          ) : (
            filteredPatients.map(patient => {
              const patientEnrollments = getPatientEnrollments(patient.id);
              return (
                <div key={patient.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg mt-1">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-gray-900">{patient.full_name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(patient.birth_date)}
                          </span>
                          <span>Карта: {patient.medical_record_number}</span>
                          {patient.emias_id && (
                            <span className="text-green-600">ЕМИАС: {patient.emias_id}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {patient.gender === 'male' ? 'М' : 'Ж'}
                      </span>
                      <button
                        onClick={() => setSelectedPatientForEnrollment(patient.id)}
                        className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        + Участие
                      </button>
                    </div>
                  </div>

                  {patientEnrollments.length > 0 && (
                    <div className="ml-12 mt-3 space-y-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Участия в исследованиях ({patientEnrollments.length}):
                      </p>
                      {patientEnrollments.map(enrollment => (
                        <div
                          key={enrollment.id}
                          onClick={() => onSelectEnrollment(enrollment.id)}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-purple-600" />
                            <div>
                              <p className="text-sm text-gray-900">{getExperimentName(enrollment.experiment_id)}</p>
                              <p className="text-xs text-gray-600">
                                Включен: {formatDate(enrollment.enrollment_date)}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(enrollment.status)}`}>
                            {getStatusText(enrollment.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {isAddPatientModalOpen && (
        <AddPatientModal
          onClose={() => setIsAddPatientModalOpen(false)}
          onAdd={onAddPatient}
        />
      )}

      {selectedPatientForEnrollment && (
        <AddEnrollmentModal
          patientId={selectedPatientForEnrollment}
          patient={patients.find(p => p.id === selectedPatientForEnrollment)!}
          experiments={experiments}
          onClose={() => setSelectedPatientForEnrollment(null)}
          onAdd={onAddEnrollment}
        />
      )}
    </div>
  );
}
