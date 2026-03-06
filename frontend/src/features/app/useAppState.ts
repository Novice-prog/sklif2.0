import { useEffect, useMemo, useRef, useState } from 'react';

import { createClinicalDataApi } from '../../api/clinicalDataApi';
import { controlPoints as initialControlPoints, diseases as initialDiseases, medicalCases as initialMedicalCases } from '../../data/mockData';
import type {
  ControlPoint,
  DiagnosisRecord,
  Disease,
  InstrumentalStudy,
  LabResult,
  LabResultChangeLog,
  MedicalCase,
  UserRole,
} from '../../types';

export type AppTab = 'cases' | 'analysis' | 'data-exchange' | 'admin';
export type AppView = 'list' | 'medical-case' | 'disease';

const api = createClinicalDataApi();

export function useAppState() {
  const isBackendMode = (import.meta.env.VITE_USE_BACKEND ?? 'true').toLowerCase() === 'true';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>('doctor');
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userLanguage, setUserLanguage] = useState<string>('ru');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const [medicalCases, setMedicalCases] = useState<MedicalCase[]>(isBackendMode ? [] : initialMedicalCases);
  const [diseases, setDiseases] = useState<Disease[]>(isBackendMode ? [] : initialDiseases);
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>(isBackendMode ? [] : initialControlPoints);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [instrumentalStudies, setInstrumentalStudies] = useState<InstrumentalStudy[]>([]);
  const [diagnosisRecords, setDiagnosisRecords] = useState<DiagnosisRecord[]>([]);
  const [labResultChangeLogs, setLabResultChangeLogs] = useState<LabResultChangeLog[]>([]);

  const [activeTab, setActiveTab] = useState<AppTab>('cases');
  const [selectedMedicalCaseId, setSelectedMedicalCaseId] = useState<string | null>(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);
  const [view, setView] = useState<AppView>('list');
  const hasLoadedFromBackend = useRef(false);

  const selectedMedicalCase = useMemo(
    () => medicalCases.find(mc => mc.id === selectedMedicalCaseId) ?? null,
    [medicalCases, selectedMedicalCaseId]
  );

  const selectedDisease = useMemo(
    () => diseases.find(d => d.id === selectedDiseaseId) ?? null,
    [diseases, selectedDiseaseId]
  );

  const controlPointIdsByDiseaseId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const cp of controlPoints) {
      const current = map.get(cp.disease_id);
      if (current) {
        current.push(cp.id);
      } else {
        map.set(cp.disease_id, [cp.id]);
      }
    }
    return map;
  }, [controlPoints]);

  useEffect(() => {
    if (!isAuthenticated || !isBackendMode || hasLoadedFromBackend.current) return;

    const loadData = async () => {
      try {
        setDataLoading(true);
        const [mc, d, cp, lr, dr] = await Promise.all([
          api.getMedicalCases(),
          api.getDiseases(),
          api.getControlPoints(),
          api.getLabResults(),
          api.getDiagnosisRecords(),
        ]);

        setMedicalCases(mc as MedicalCase[]);
        setDiseases(d as Disease[]);
        setControlPoints(cp as ControlPoint[]);
        setLabResults(lr as LabResult[]);
        setDiagnosisRecords(dr as DiagnosisRecord[]);
        hasLoadedFromBackend.current = true;
      } catch {
        setMedicalCases([]);
        setDiseases([]);
        setControlPoints([]);
        setLabResults([]);
        setDiagnosisRecords([]);
        setToastMessage('Не удалось загрузить данные из backend. Проверьте API и базу данных.');
      } finally {
        setDataLoading(false);
      }
    };

    void loadData();
  }, [isAuthenticated, isBackendMode]);

  const handleSelectMedicalCase = (caseId: string) => {
    setSelectedMedicalCaseId(caseId);
    setSelectedDiseaseId(null);
    setView('medical-case');
  };

  const handleSelectDisease = (diseaseId: string) => {
    setSelectedDiseaseId(diseaseId);
    setView('disease');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedMedicalCaseId(null);
    setSelectedDiseaseId(null);
  };

  const handleBackToMedicalCase = () => {
    setView('medical-case');
    setSelectedDiseaseId(null);
  };

  const handleAddMedicalCase = (medicalCase: Omit<MedicalCase, 'id' | 'created_at'>) => {
    const newMedicalCase: MedicalCase = {
      ...medicalCase,
      id: `mc${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setMedicalCases(prev => [...prev, newMedicalCase]);
  };

  const handleAddDisease = (disease: Omit<Disease, 'id' | 'created_at'>) => {
    const newDisease: Disease = {
      ...disease,
      id: `d${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setDiseases(prev => [...prev, newDisease]);
  };

  const handleUpdateDisease = (id: string, updates: Partial<Disease>) => {
    setDiseases(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
  };

  const handleUpdateMedicalCase = (id: string, updates: Partial<MedicalCase>) => {
    setMedicalCases(prev => prev.map(mc => (mc.id === id ? { ...mc, ...updates } : mc)));
  };

  const handleDeleteDisease = (id: string) => {
    setDiseases(prev => prev.filter(d => d.id !== id));
    const diseaseControlPoints = controlPoints.filter(cp => cp.disease_id === id);
    const cpIds = diseaseControlPoints.map(cp => cp.id);
    setControlPoints(prev => prev.filter(cp => cp.disease_id !== id));
    setLabResults(prev => prev.filter(lr => !cpIds.includes(lr.control_point_id)));
    setInstrumentalStudies(prev => prev.filter(study => !cpIds.includes(study.control_point_id)));
    setDiagnosisRecords(prev => prev.filter(dr => !cpIds.includes(dr.control_point_id)));
    handleBackToMedicalCase();
  };

  const handleAddControlPoint = (cp: Omit<ControlPoint, 'id' | 'created_at'>) => {
    const newCP: ControlPoint = {
      ...cp,
      id: `cp${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setControlPoints(prev => [...prev, newCP]);
  };

  const handleUpdateControlPoint = (id: string, updates: Partial<ControlPoint>) => {
    setControlPoints(prev => prev.map(cp => (cp.id === id ? { ...cp, ...updates } : cp)));
  };

  const handleDeleteControlPoint = (id: string) => {
    setControlPoints(prev => prev.filter(cp => cp.id !== id));
    setLabResults(prev => prev.filter(lr => lr.control_point_id !== id));
    setInstrumentalStudies(prev => prev.filter(study => study.control_point_id !== id));
  };

  const handleAddLabResult = (result: Omit<LabResult, 'id' | 'created_at'>) => {
    if (userRole !== 'admin') return;

    const newResult: LabResult = {
      ...result,
      id: `lr${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setLabResults(prev => [...prev, newResult]);

    const newLog: LabResultChangeLog = {
      id: `log${Date.now()}`,
      control_point_id: result.control_point_id,
      change_type: 'manual_add',
      changed_by_user_id: userId,
      changed_by_user_name: currentUser,
      changed_by_user_role: userRole,
      changed_at: new Date().toISOString(),
      affected_count: 1,
      details: 'Добавлен показатель вручную',
      indicator_ids: [result.indicator_id],
    };
    setLabResultChangeLogs(prev => [...prev, newLog]);
  };

  const handleUpdateLabResult = (id: string, updates: Partial<LabResult>) => {
    if (userRole !== 'admin') return;

    const updatedResult = labResults.find(lr => lr.id === id);
    if (!updatedResult) return;

    setLabResults(prev => prev.map(lr => (lr.id === id ? { ...lr, ...updates } : lr)));

    const newLog: LabResultChangeLog = {
      id: `log${Date.now()}`,
      control_point_id: updatedResult.control_point_id,
      change_type: 'manual_edit',
      changed_by_user_id: userId,
      changed_by_user_name: currentUser,
      changed_by_user_role: userRole,
      changed_at: new Date().toISOString(),
      affected_count: 1,
      details: 'Изменен показатель',
      indicator_ids: [updatedResult.indicator_id],
    };
    setLabResultChangeLogs(prev => [...prev, newLog]);
  };

  const handleDeleteLabResult = (id: string) => {
    if (userRole !== 'admin') return;

    const deletedResult = labResults.find(lr => lr.id === id);
    if (!deletedResult) return;

    setLabResults(prev => prev.filter(lr => lr.id !== id));

    const newLog: LabResultChangeLog = {
      id: `log${Date.now()}`,
      control_point_id: deletedResult.control_point_id,
      change_type: 'manual_delete',
      changed_by_user_id: userId,
      changed_by_user_name: currentUser,
      changed_by_user_role: userRole,
      changed_at: new Date().toISOString(),
      affected_count: 1,
      details: 'Удален показатель',
      indicator_ids: [deletedResult.indicator_id],
    };
    setLabResultChangeLogs(prev => [...prev, newLog]);
  };

  const handleAddInstrumentalStudy = (study: Omit<InstrumentalStudy, 'id' | 'created_at'>) => {
    const newStudy: InstrumentalStudy = {
      ...study,
      id: `is${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setInstrumentalStudies(prev => [...prev, newStudy]);
  };

  const handleAddDiagnosisRecord = (record: Omit<DiagnosisRecord, 'id' | 'created_at'>) => {
    const newRecord: DiagnosisRecord = {
      ...record,
      id: `dr${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setDiagnosisRecords(prev => [...prev, newRecord]);
  };

  const handleUpdateDiagnosisRecord = (id: string, updates: Partial<DiagnosisRecord>) => {
    setDiagnosisRecords(prev => prev.map(dr => (dr.id === id ? { ...dr, ...updates } : dr)));
  };

  const handleDeleteDiagnosisRecord = (id: string) => {
    setDiagnosisRecords(prev => prev.filter(dr => dr.id !== id));
  };

  const handleImportData = async (data: {
    medicalCases?: MedicalCase[];
    diseases?: Disease[];
    controlPoints?: ControlPoint[];
    labResults?: LabResult[];
    diagnosisRecords?: DiagnosisRecord[];
  }) => {
    if (isBackendMode) {
      try {
        await api.bulkUpsert({
          medicalCases: data.medicalCases,
          diseases: data.diseases,
          controlPoints: data.controlPoints,
          labResults: data.labResults,
          diagnosisRecords: data.diagnosisRecords,
        });
      } catch {
        setToastMessage('Не удалось синхронизировать импорт с backend');
      }
    }

    if (data.medicalCases) {
      setMedicalCases(prev => {
        const existingIds = new Set(prev.map(mc => mc.id));
        const newCases = data.medicalCases!.filter(mc => !existingIds.has(mc.id));
        const updatedCases = prev.map(mc => data.medicalCases!.find(imc => imc.id === mc.id) || mc);
        return [...updatedCases, ...newCases];
      });
    }

    if (data.diseases) {
      setDiseases(prev => {
        const existingIds = new Set(prev.map(d => d.id));
        const newDiseases = data.diseases!.filter(d => !existingIds.has(d.id));
        const updatedDiseases = prev.map(d => data.diseases!.find(id => id.id === d.id) || d);
        return [...updatedDiseases, ...newDiseases];
      });
    }

    if (data.controlPoints) {
      setControlPoints(prev => {
        const existingIds = new Set(prev.map(cp => cp.id));
        const newCPs = data.controlPoints!.filter(cp => !existingIds.has(cp.id));
        const updatedCPs = prev.map(cp => data.controlPoints!.find(icp => icp.id === cp.id) || cp);
        return [...updatedCPs, ...newCPs];
      });
    }

    if (data.labResults) {
      setLabResults(prev => {
        const existingIds = new Set(prev.map(lr => lr.id));
        const newResults = data.labResults!.filter(lr => !existingIds.has(lr.id));
        const updatedResults = prev.map(lr => data.labResults!.find(ilr => ilr.id === lr.id) || lr);
        return [...updatedResults, ...newResults];
      });
    }

    if (data.diagnosisRecords) {
      setDiagnosisRecords(prev => {
        const existingIds = new Set(prev.map(dr => dr.id));
        const newRecords = data.diagnosisRecords!.filter(dr => !existingIds.has(dr.id));
        const updatedRecords = prev.map(dr => data.diagnosisRecords!.find(idr => idr.id === dr.id) || dr);
        return [...updatedRecords, ...newRecords];
      });
    }
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    if (tab === 'cases') {
      setView('list');
      setSelectedMedicalCaseId(null);
      setSelectedDiseaseId(null);
    }
  };

  const handleLogin = (username: string, role: UserRole, id: string, email: string) => {
    setCurrentUser(username);
    setUserRole(role);
    setUserId(id);
    setUserEmail(email);
    setIsAuthenticated(true);

    if (role === 'admin' && labResultChangeLogs.length === 0) {
      const firstCP = controlPoints[0];
      if (firstCP) {
        const demoLogs: LabResultChangeLog[] = [
          {
            id: 'log-demo-1',
            control_point_id: firstCP.id,
            change_type: 'import',
            changed_by_user_id: 'admin-1',
            changed_by_user_name: 'Иванов И.И.',
            changed_by_user_role: 'admin',
            changed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            affected_count: 15,
            details: 'Импортированы показатели общего анализа крови из файла "анализы_05_2024.xlsx"',
            indicator_ids: ['hgb', 'rbc', 'wbc', 'plt'],
          },
        ];
        setLabResultChangeLogs(demoLogs);
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setCurrentUser('');
    setUserRole('doctor');
    setUserId('');
    setUserEmail('');
    setView('list');
    setSelectedMedicalCaseId(null);
    setSelectedDiseaseId(null);
    hasLoadedFromBackend.current = false;
  };

  return {
    isAuthenticated,
    currentUser,
    userRole,
    userEmail,
    userLanguage,
    toastMessage,
    dataLoading,
    medicalCases,
    diseases,
    controlPoints,
    labResults,
    instrumentalStudies,
    diagnosisRecords,
    labResultChangeLogs,
    activeTab,
    selectedMedicalCaseId,
    selectedDiseaseId,
    view,
    selectedMedicalCase,
    selectedDisease,
    controlPointIdsByDiseaseId,
    setUserLanguage,
    setToastMessage,
    handleSelectMedicalCase,
    handleSelectDisease,
    handleBackToList,
    handleBackToMedicalCase,
    handleAddMedicalCase,
    handleAddDisease,
    handleUpdateDisease,
    handleUpdateMedicalCase,
    handleDeleteDisease,
    handleAddControlPoint,
    handleUpdateControlPoint,
    handleDeleteControlPoint,
    handleAddLabResult,
    handleUpdateLabResult,
    handleDeleteLabResult,
    handleAddInstrumentalStudy,
    handleAddDiagnosisRecord,
    handleUpdateDiagnosisRecord,
    handleDeleteDiagnosisRecord,
    handleImportData,
    handleTabChange,
    handleLogin,
    handleLogout,
  };
}
