import { FileText, TrendingUp, Database, Shield } from 'lucide-react';

import { AnalysisView } from './components/AnalysisView';
import { AdminPanel } from './components/AdminPanel';
import { DiseaseView } from './components/DiseaseView';
import { ExportImportView } from './components/ExportImportView';
import { LoginModal } from './components/LoginModal';
import { MedicalCaseList } from './components/MedicalCaseList';
import { MedicalCaseView } from './components/MedicalCaseView';
import { Toast } from './components/Toast';
import { UserProfile } from './components/UserProfile';
import { references } from './data/mockData';
import { useAppState } from './features/app/useAppState';

export default function App() {
  const state = useAppState();
  const currentMedicalCaseId = state.selectedMedicalCaseId;

  if (!state.isAuthenticated) {
    return <LoginModal onLogin={state.handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[74rem] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🏥</span>
              </div>
              <div>
                <h1 className="text-gray-900">НИИ скорой помощи им. Н.В. Склифосовского</h1>
                <p className="text-sm text-gray-600">Smart Токсикология</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <nav className="flex gap-2" aria-label="Основная навигация">
                <button
                  onClick={() => state.handleTabChange('cases')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${state.activeTab === 'cases' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}
                  `}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-sm">Истории болезни</span>
                </button>

                <button
                  onClick={() => state.handleTabChange('analysis')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${state.activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}
                  `}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm">Анализ данных</span>
                </button>

                <button
                  onClick={() => state.handleTabChange('data-exchange')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${state.activeTab === 'data-exchange' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}
                  `}
                >
                  <Database className="w-5 h-5" />
                  <span className="text-sm">Импорт/Экспорт</span>
                </button>

                {state.userRole === 'admin' && (
                  <button
                    onClick={() => state.handleTabChange('admin')}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                      ${state.activeTab === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}
                    `}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">Администрирование</span>
                  </button>
                )}
              </nav>
              <UserProfile
                userName={state.currentUser}
                userRole={state.userRole}
                userEmail={state.userEmail}
                onLogout={state.handleLogout}
                onUpdateSettings={(settings) => {
                  if (settings.language) {
                    state.setUserLanguage(settings.language);
                    localStorage.setItem('userLanguage', settings.language);
                  }
                  state.setToastMessage('Настройки успешно сохранены');
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {state.toastMessage && (
        <Toast
          message={state.toastMessage}
          type="success"
          onClose={() => state.setToastMessage(null)}
        />
      )}

      <main className="max-w-[74rem] mx-auto px-6 py-6">
        {state.dataLoading && (
          <div className="mb-4 text-sm text-gray-600">Загрузка данных из backend...</div>
        )}

        {state.activeTab === 'cases' && (
          <>
            {state.view === 'list' && (
              <MedicalCaseList
                medicalCases={state.medicalCases}
                onSelectMedicalCase={state.handleSelectMedicalCase}
                onAddMedicalCase={state.handleAddMedicalCase}
              />
            )}

            {state.view === 'medical-case' && currentMedicalCaseId && state.selectedMedicalCase && (
              <MedicalCaseView
                medicalCase={state.selectedMedicalCase}
                diseases={state.diseases.filter(d => d.medical_case_id === currentMedicalCaseId)}
                onBack={state.handleBackToList}
                onSelectDisease={state.handleSelectDisease}
                onAddDisease={state.handleAddDisease}
                onUpdateStatus={(status) => state.handleUpdateMedicalCase(currentMedicalCaseId, { status })}
              />
            )}

            {state.view === 'disease' && state.selectedDiseaseId && (() => {
              if (!state.selectedDisease) return null;
              const currentDisease = state.selectedDisease;
              const cpIds = state.controlPointIdsByDiseaseId.get(state.selectedDiseaseId) ?? [];
              const caseDiseases = state.diseases.filter(d => d.medical_case_id === currentDisease.medical_case_id);
              const currentMedicalCase = state.medicalCases.find(mc => mc.id === currentDisease.medical_case_id);

              return (
                <DiseaseView
                  disease={currentDisease}
                  allDiseases={caseDiseases}
                  controlPoints={state.controlPoints.filter(cp => cp.disease_id === state.selectedDiseaseId)}
                  labResults={state.labResults.filter(lr => cpIds.includes(lr.control_point_id))}
                  instrumentalStudies={state.instrumentalStudies.filter(study => cpIds.includes(study.control_point_id))}
                  diagnosisRecords={state.diagnosisRecords.filter(dr => cpIds.includes(dr.control_point_id))}
                  labResultChangeLogs={state.labResultChangeLogs.filter(log => cpIds.includes(log.control_point_id))}
                  references={references}
                  caseNumber={currentMedicalCase?.case_number}
                  patientGender={currentMedicalCase?.gender}
                  userRole={state.userRole}
                  onBack={state.handleBackToMedicalCase}
                  onUpdateDisease={state.handleUpdateDisease}
                  onDeleteDisease={state.handleDeleteDisease}
                  onAddControlPoint={state.handleAddControlPoint}
                  onUpdateControlPoint={state.handleUpdateControlPoint}
                  onDeleteControlPoint={state.handleDeleteControlPoint}
                  onAddLabResult={state.handleAddLabResult}
                  onUpdateLabResult={state.handleUpdateLabResult}
                  onDeleteLabResult={state.handleDeleteLabResult}
                  onAddInstrumentalStudy={state.handleAddInstrumentalStudy}
                  onAddDiagnosisRecord={state.handleAddDiagnosisRecord}
                  onUpdateDiagnosisRecord={state.handleUpdateDiagnosisRecord}
                  onDeleteDiagnosisRecord={state.handleDeleteDiagnosisRecord}
                />
              );
            })()}
          </>
        )}

        {state.activeTab === 'analysis' && (
          <AnalysisView
            medicalCases={state.medicalCases}
            diseases={state.diseases}
            controlPoints={state.controlPoints}
            labResults={state.labResults}
            instrumentalStudies={state.instrumentalStudies}
            diagnosisRecords={state.diagnosisRecords}
          />
        )}

        {state.activeTab === 'data-exchange' && (
          <ExportImportView
            medicalCases={state.medicalCases}
            diseases={state.diseases}
            controlPoints={state.controlPoints}
            labResults={state.labResults}
            diagnosisRecords={state.diagnosisRecords}
            onImport={(data) => void state.handleImportData(data)}
          />
        )}

        {state.activeTab === 'admin' && (
          <>
            {state.userRole === 'admin' ? (
              <AdminPanel />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Доступ запрещен</h3>
                <p className="text-gray-600">
                  Эта страница доступна только для администраторов системы.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}


