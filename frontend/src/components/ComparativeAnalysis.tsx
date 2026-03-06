import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Square, AlertCircle, Users, TrendingUp, Activity, Download, FileSpreadsheet } from 'lucide-react';
import type { MedicalCase, Disease, ControlPoint, LabResult, DiagnosisRecord } from '../types';
import { references } from '../data/mockData';
import { ComparativeAnalysisCharts } from './ComparativeAnalysisCharts';
import { createClinicalDataApi } from '../api/clinicalDataApi';
import { mannWhitneyTest, studentTTest, welchTTest, kolmogorovSmirnovTest } from '../utils/statisticalTests';

type ComparativeAnalysisProps = {
  medicalCases: MedicalCase[];
  diseases: Disease[];
  controlPoints: ControlPoint[];
  labResults: LabResult[];
  diagnosisRecords: DiagnosisRecord[];
};

type ComparisonResult = {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  cpIndex: number;
  cpName: string;
  // Группа 1
  group1Count: number;
  group1Median: number;
  group1Mean: number;
  group1Q25: number;
  group1Q75: number;
  // Группа 2
  group2Count: number;
  group2Median: number;
  group2Mean: number;
  group2Q25: number;
  group2Q75: number;
  // Статистика
  statistic: number; // U-статистика, t-статистика или D-статистика
  statisticName: string; // Название статистики
  pValue: number;
  isSignificant: boolean;
};

type StatisticalTest = 'mann-whitney' | 'student-t' | 'welch-t' | 'kolmogorov-smirnov';

const api = createClinicalDataApi();

const controlPointNames = [
  'КТ1 - При поступлении',
  'КТ2 - Через 6 часов',
  'КТ3 - Через 24 часа',
  'КТ4 - Перед выпиской'
];

export function ComparativeAnalysis({
  medicalCases,
  diseases,
  controlPoints,
  labResults,
  diagnosisRecords,
}: ComparativeAnalysisProps) {
  // Фильтры для группы 1
  const [group1DiseaseName, setGroup1DiseaseName] = useState<string>('');
  const [group1Treatment, setGroup1Treatment] = useState<string>('');
  const [group1Genders, setGroup1Genders] = useState<('male' | 'female')[]>(['male', 'female']);
  const [group1MinAge, setGroup1MinAge] = useState<string>('');
  const [group1MaxAge, setGroup1MaxAge] = useState<string>('');
  const [group1MinYear, setGroup1MinYear] = useState<string>(''); // Фильтр по годам - от
  const [group1MaxYear, setGroup1MaxYear] = useState<string>(''); // Фильтр по годам - до

  // Фильтры для группы 2
  const [group2DiseaseName, setGroup2DiseaseName] = useState<string>('');
  const [group2Treatment, setGroup2Treatment] = useState<string>('');
  const [group2Genders, setGroup2Genders] = useState<('male' | 'female')[]>(['male', 'female']);
  const [group2MinAge, setGroup2MinAge] = useState<string>('');
  const [group2MaxAge, setGroup2MaxAge] = useState<string>('');
  const [group2MinYear, setGroup2MinYear] = useState<string>(''); // Фильтр по годам - от
  const [group2MaxYear, setGroup2MaxYear] = useState<string>(''); // Фильтр по годам - до

  // Общие фильтры
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedCPIndices, setSelectedCPIndices] = useState<number[]>([]);
  const [significanceLevel, setSignificanceLevel] = useState<number>(0.05);
  const [statisticalTest, setStatisticalTest] = useState<StatisticalTest>('mann-whitney');
  
  // Фильтр по показателю для графиков
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);
  const [showGraphs, setShowGraphs] = useState(false);
  const isBackendMode = (import.meta.env.VITE_USE_BACKEND ?? 'true').toLowerCase() === 'true';
  const [serverComparisonResults, setServerComparisonResults] = useState<ComparisonResult[] | null>(null);

  // Получить уникальные названия заболеваний
  const diseaseNames = useMemo(() => {
    if (!diseases || diseases.length === 0) return [];
    return Array.from(new Set(diseases.map(d => d.disease_name)));
  }, [diseases]);

  useEffect(() => {
    if (diseaseNames.length === 0) return;
    if (!group1DiseaseName) setGroup1DiseaseName(diseaseNames[0]);
    if (!group2DiseaseName) setGroup2DiseaseName(diseaseNames[0]);
  }, [diseaseNames, group1DiseaseName, group2DiseaseName]);

  // Получить уникальные годы из медицинских карт
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    medicalCases.forEach(mc => {
      if (mc.admission_date) {
        const year = new Date(mc.admission_date).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // От новых к старым
  }, [medicalCases]);

  // Получить уникальные методы лечения из диагностических записей
  const treatmentMethods = useMemo(() => {
    if (!diagnosisRecords || diagnosisRecords.length === 0) return [];
    const treatments = diagnosisRecords
      .filter(dr => dr.treatment && dr.treatment.trim() !== '')
      .map(dr => dr.treatment!.trim());
    return Array.from(new Set(treatments)).sort();
  }, [diagnosisRecords]);

  const diseaseControlPointsMap = useMemo(() => {
    const map = new Map<string, ControlPoint[]>();
    for (const cp of controlPoints) {
      const current = map.get(cp.disease_id);
      if (current) {
        current.push(cp);
      } else {
        map.set(cp.disease_id, [cp]);
      }
    }
    for (const [, points] of map) {
      points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return map;
  }, [controlPoints]);

  const labNumericValueMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const result of labResults) {
      if (result.value_numeric === undefined) continue;
      map.set(`${result.control_point_id}:${result.indicator_id}`, result.value_numeric);
    }
    return map;
  }, [labResults]);

  // Функця фильтрации заболеваний
  const filterDiseases = (
    diseaseName: string,
    treatment: string,
    genders: ('male' | 'female')[],
    minAge: string,
    maxAge: string,
    minYear: string,
    maxYear: string
  ) => {
    return diseases.filter(d => {
      // Фильтр по заболеванию
      if (d.disease_name !== diseaseName) return false;

      // Получаем медицинскую карту
      const medicalCase = medicalCases.find(mc => mc.id === d.medical_case_id);
      if (!medicalCase) return false;

      // Фильтр по полу
      if (!genders.includes(medicalCase.gender)) return false;

      // Фильтр по возрасту
      const minAgeNum = minAge ? parseInt(minAge) : 0;
      const maxAgeNum = maxAge ? parseInt(maxAge) : Infinity;
      if (medicalCase.age < minAgeNum || medicalCase.age > maxAgeNum) return false;

      // Фильтр по годам
      if (minYear || maxYear) {
        const minYearNum = minYear ? parseInt(minYear) : 0;
        const maxYearNum = maxYear ? parseInt(maxYear) : Infinity;
        const caseYear = new Date(medicalCase.admission_date).getFullYear();
        if (caseYear < minYearNum || caseYear > maxYearNum) return false;
      }

      // Фильтр по лечению
      if (treatment) {
        const diseaseCPs = controlPoints.filter(cp => cp.disease_id === d.id);
        const hasTreatment = diseaseCPs.some(cp => {
          return diagnosisRecords.some(dr => 
            dr.control_point_id === cp.id && 
            dr.treatment && 
            dr.treatment.trim() === treatment
          );
        });
        if (!hasTreatment) return false;
      }

      return true;
    });
  };

  // Отфильтрованные заболевания для каждой группы
  const group1Diseases = useMemo(() => 
    filterDiseases(group1DiseaseName, group1Treatment, group1Genders, group1MinAge, group1MaxAge, group1MinYear, group1MaxYear),
    [diseases, medicalCases, controlPoints, diagnosisRecords, group1DiseaseName, group1Treatment, group1Genders, group1MinAge, group1MaxAge, group1MinYear, group1MaxYear]
  );

  const group2Diseases = useMemo(() =>
    filterDiseases(group2DiseaseName, group2Treatment, group2Genders, group2MinAge, group2MaxAge, group2MinYear, group2MaxYear),
    [diseases, medicalCases, controlPoints, diagnosisRecords, group2DiseaseName, group2Treatment, group2Genders, group2MinAge, group2MaxAge, group2MinYear, group2MaxYear]
  );

  // Получить индикаторы выбранных групп
  const groupIndicators = useMemo(() =>
    references.labIndicators
      .filter(i => selectedGroupIds.includes(i.group_id) && i.data_type === 'numeric')
      .sort((a, b) => {
        const groupOrderA = references.labGroups.find(g => g.id === a.group_id)?.order_index || 0;
        const groupOrderB = references.labGroups.find(g => g.id === b.group_id)?.order_index || 0;
        if (groupOrderA !== groupOrderB) return groupOrderA - groupOrderB;
        return a.order_index - b.order_index;
      }),
    [selectedGroupIds]
  );


  useEffect(() => {
    if (!isBackendMode) {
      setServerComparisonResults(null);
      return;
    }

    if (!group1DiseaseName || !group2DiseaseName || selectedCPIndices.length === 0 || groupIndicators.length === 0) {
      setServerComparisonResults([]);
      return;
    }

    const run = async () => {
      try {
        const response = await api.getComparativeAnalytics({
          group1: {
            disease_name: group1DiseaseName,
            treatment: group1Treatment || undefined,
            genders: group1Genders,
            min_age: group1MinAge ? parseInt(group1MinAge, 10) : undefined,
            max_age: group1MaxAge ? parseInt(group1MaxAge, 10) : undefined,
            min_year: group1MinYear ? parseInt(group1MinYear, 10) : undefined,
            max_year: group1MaxYear ? parseInt(group1MaxYear, 10) : undefined,
          },
          group2: {
            disease_name: group2DiseaseName,
            treatment: group2Treatment || undefined,
            genders: group2Genders,
            min_age: group2MinAge ? parseInt(group2MinAge, 10) : undefined,
            max_age: group2MaxAge ? parseInt(group2MaxAge, 10) : undefined,
            min_year: group2MinYear ? parseInt(group2MinYear, 10) : undefined,
            max_year: group2MaxYear ? parseInt(group2MaxYear, 10) : undefined,
          },
          indicator_ids: groupIndicators.map(indicator => indicator.id),
          cp_indices: selectedCPIndices,
          significance_level: significanceLevel,
          statistical_test: statisticalTest,
        });

        const mapped: ComparisonResult[] = response.map(item => {
          const indicator = references.labIndicators.find(ind => ind.id === item.indicator_id);
          return {
            indicatorId: item.indicator_id,
            indicatorName: indicator?.name ?? item.indicator_id,
            unit: indicator?.unit ?? '',
            cpIndex: item.cp_index,
            cpName: controlPointNames[item.cp_index] ?? ('КТ' + (item.cp_index + 1)),
            group1Count: item.group1_n,
            group1Median: item.group1_median,
            group1Mean: item.group1_mean,
            group1Q25: item.group1_q25,
            group1Q75: item.group1_q75,
            group2Count: item.group2_n,
            group2Median: item.group2_median,
            group2Mean: item.group2_mean,
            group2Q25: item.group2_q25,
            group2Q75: item.group2_q75,
            statistic: item.statistic,
            statisticName: item.statistic_name,
            pValue: item.p_value,
            isSignificant: item.is_significant,
          };
        });

        setServerComparisonResults(mapped);
      } catch {
        setServerComparisonResults(null);
      }
    };

    void run();
  }, [
    isBackendMode,
    group1DiseaseName,
    group2DiseaseName,
    group1Treatment,
    group2Treatment,
    group1Genders,
    group2Genders,
    group1MinAge,
    group1MaxAge,
    group2MinAge,
    group2MaxAge,
    group1MinYear,
    group1MaxYear,
    group2MinYear,
    group2MaxYear,
    selectedCPIndices,
    groupIndicators,
    significanceLevel,
    statisticalTest,
  ]);
  // Вычисление квартиля
  const calculateQuantile = (values: number[], q: number): number => {
    const sorted = [...values].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };

  // Получить значения показателя для группы
  const getGroupValues = (diseases: Disease[], cpIndex: number, indicatorId: string): number[] => {
    const values: number[] = [];

    for (const disease of diseases) {
      const diseaseCPs = diseaseControlPointsMap.get(disease.id);
      if (!diseaseCPs || !diseaseCPs[cpIndex]) continue;

      const cp = diseaseCPs[cpIndex];
      const value = labNumericValueMap.get(`${cp.id}:${indicatorId}`);
      if (value !== undefined) {
        values.push(value);
      }
    }

    return values;
  };

  // Сравнительная статистика
  const localComparisonResults = useMemo<ComparisonResult[]>(() => {
    if (isBackendMode) {
      return [];
    }
    const results: ComparisonResult[] = [];

    selectedCPIndices.forEach(cpIndex => {
      groupIndicators.forEach(indicator => {
        const group1Values = getGroupValues(group1Diseases, cpIndex, indicator.id);
        const group2Values = getGroupValues(group2Diseases, cpIndex, indicator.id);

        if (group1Values.length > 0 || group2Values.length > 0) {
          const group1Mean = group1Values.length > 0 
            ? group1Values.reduce((sum, v) => sum + v, 0) / group1Values.length 
            : 0;
          const group2Mean = group2Values.length > 0
            ? group2Values.reduce((sum, v) => sum + v, 0) / group2Values.length
            : 0;

          let statistic: number;
          let pValue: number;
          let statisticName: string;

          switch (statisticalTest) {
            case 'mann-whitney':
              const mwResult = mannWhitneyTest(group1Values, group2Values);
              statistic = mwResult.statistic;
              pValue = mwResult.pValue;
              statisticName = mwResult.statisticName;
              break;
            case 'student-t':
              const stResult = studentTTest(group1Values, group2Values);
              statistic = stResult.statistic;
              pValue = stResult.pValue;
              statisticName = stResult.statisticName;
              break;
            case 'welch-t':
              const wtResult = welchTTest(group1Values, group2Values);
              statistic = wtResult.statistic;
              pValue = wtResult.pValue;
              statisticName = wtResult.statisticName;
              break;
            case 'kolmogorov-smirnov':
              const ksResult = kolmogorovSmirnovTest(group1Values, group2Values);
              statistic = ksResult.statistic;
              pValue = ksResult.pValue;
              statisticName = ksResult.statisticName;
              break;
            default:
              const defResult = mannWhitneyTest(group1Values, group2Values);
              statistic = defResult.statistic;
              pValue = defResult.pValue;
              statisticName = defResult.statisticName;
              break;
          }

          results.push({
            indicatorId: indicator.id,
            indicatorName: indicator.name,
            unit: indicator.unit || '',
            cpIndex,
            cpName: controlPointNames[cpIndex],
            group1Count: group1Values.length,
            group1Median: group1Values.length > 0 ? calculateQuantile(group1Values, 0.5) : 0,
            group1Mean,
            group1Q25: group1Values.length > 0 ? calculateQuantile(group1Values, 0.25) : 0,
            group1Q75: group1Values.length > 0 ? calculateQuantile(group1Values, 0.75) : 0,
            group2Count: group2Values.length,
            group2Median: group2Values.length > 0 ? calculateQuantile(group2Values, 0.5) : 0,
            group2Mean,
            group2Q25: group2Values.length > 0 ? calculateQuantile(group2Values, 0.25) : 0,
            group2Q75: group2Values.length > 0 ? calculateQuantile(group2Values, 0.75) : 0,
            statistic,
            statisticName,
            pValue,
            isSignificant: pValue < significanceLevel,
          });
        }
      });
    });

    return results;
  }, [isBackendMode, groupIndicators, group1Diseases, group2Diseases, selectedCPIndices, significanceLevel, statisticalTest, diseaseControlPointsMap, labNumericValueMap]);

  const comparisonResults = isBackendMode && serverComparisonResults ? serverComparisonResults : localComparisonResults;

  // Обработчики для контрольных точек
  const toggleCPIndex = (index: number) => {
    if (selectedCPIndices.includes(index)) {
      setSelectedCPIndices(selectedCPIndices.filter(i => i !== index));
    } else {
      setSelectedCPIndices([...selectedCPIndices, index].sort());
    }
  };

  const toggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const toggleGender = (group: 1 | 2, gender: 'male' | 'female') => {
    if (group === 1) {
      if (group1Genders.includes(gender)) {
        const newGenders = group1Genders.filter(g => g !== gender);
        if (newGenders.length > 0) setGroup1Genders(newGenders);
      } else {
        setGroup1Genders([...group1Genders, gender]);
      }
    } else {
      if (group2Genders.includes(gender)) {
        const newGenders = group2Genders.filter(g => g !== gender);
        if (newGenders.length > 0) setGroup2Genders(newGenders);
      } else {
        setGroup2Genders([...group2Genders, gender]);
      }
    }
  };

  const selectAllCP = () => {
    setSelectedCPIndices([0, 1, 2, 3]);
  };

  const deselectAllCP = () => {
    setSelectedCPIndices([]);
  };

  const selectAllGroups = () => {
    setSelectedGroupIds(references.labGroups.map(g => g.id));
  };

  const deselectAllGroups = () => {
    setSelectedGroupIds([]);
  };

  // Функция экспорта таблицы в Excel (CSV)
  const handleExportTableToExcel = () => {
    if (comparisonResults.length === 0) return;

    // Определяем название статистики для экспорта
    let statisticLabel = 'U-статистика';
    switch (statisticalTest) {
      case 'mann-whitney':
        statisticLabel = 'U-статистика';
        break;
      case 'student-t':
      case 'welch-t':
        statisticLabel = 't-статистика';
        break;
      case 'kolmogorov-smirnov':
        statisticLabel = 'D-статистика';
        break;
    }

    // Создаем CSV контент
    let csv = `Показатель,Единица,КТ,N (Эксп.),N (Контр.),Медиана (Эксп.),Медиана (Контр.),Среднее (Эксп.),Среднее (Контр.),Q25 (Эксп.),Q25 (Контр.),Q75 (Эксп.),Q75 (Контр.),${statisticLabel},p-value,Результат\n`;
    
    comparisonResults.forEach(result => {
      const row = [
        `"${result.indicatorName}"`,
        `"${result.unit}"`,
        `"${result.cpName.split(' - ')[0]}"`,
        result.group1Count || 0,
        result.group2Count || 0,
        result.group1Median != null ? result.group1Median.toFixed(2) : '—',
        result.group2Median != null ? result.group2Median.toFixed(2) : '—',
        result.group1Mean != null ? result.group1Mean.toFixed(2) : '—',
        result.group2Mean != null ? result.group2Mean.toFixed(2) : '—',
        result.group1Q25 != null ? result.group1Q25.toFixed(2) : '—',
        result.group2Q25 != null ? result.group2Q25.toFixed(2) : '—',
        result.group1Q75 != null ? result.group1Q75.toFixed(2) : '—',
        result.group2Q75 != null ? result.group2Q75.toFixed(2) : '—',
        result.statistic != null ? result.statistic.toFixed(statisticalTest === 'mann-whitney' ? 1 : 3) : '—',
        result.pValue != null ? (result.pValue < 0.001 ? '<0.001' : result.pValue.toFixed(3)) : '—',
        result.isSignificant ? 'Значимое' : 'Незначимое',
      ].join(',');
      csv += row + '\n';
    });

    // Добавляем BOM для правильного отображения кириллицы в Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `сравнительный_анализ_${group1DiseaseName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Информация */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-900 mb-1">Сравнительный анализ двух групп</h3>
            <p className="text-sm text-blue-800">
              Настройте фильтры для двух групп пациентов (например, по методу лечения), выберите показатели и контрольные точки. 
              Система автоматически выполнит статистическое сравнение с использованием критерия Манна-Уитни и покажет значимость различий.
            </p>
          </div>
        </div>
      </div>

      {/* Фильтры дл групп */}
      <div className="space-y-6">
        {/* Общее заболевание для обеих групп */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Заболевание для обеих групп</h3>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Выберите заболевание</label>
            <select
              value={group1DiseaseName}
              onChange={(e) => {
                setGroup1DiseaseName(e.target.value);
                setGroup2DiseaseName(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {diseaseNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              В сравнительном анализе обе группы должны иметь одинаковое заболевание
            </p>
          </div>
        </div>

        {/* Фильтры для двух групп */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Экспериментальная группа */}
          <div className="bg-white rounded-lg border border-blue-200 p-6">
            <h3 className="text-gray-900 mb-4">Экспериментальная группа</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Лечение</label>
                <select
                  value={group1Treatment}
                  onChange={(e) => setGroup1Treatment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все методы лечения</option>
                  {treatmentMethods.map(treatment => (
                    <option key={treatment} value={treatment}>{treatment}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Пол</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => toggleGender(1, 'male')}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    {group1Genders.includes('male') ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                    Мужчины
                  </button>
                  <button
                    onClick={() => toggleGender(1, 'female')}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    {group1Genders.includes('female') ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                    Женщины
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Возраст от</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={group1MinAge}
                    onChange={(e) => setGroup1MinAge(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">до</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={group1MaxAge}
                    onChange={(e) => setGroup1MaxAge(e.target.value)}
                    placeholder="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Год от</label>
                  <select
                    value={group1MinYear}
                    onChange={(e) => setGroup1MinYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Все годы</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">до</label>
                  <select
                    value={group1MaxYear}
                    onChange={(e) => setGroup1MaxYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Все годы</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Пациентов в группе: <span className="font-medium text-gray-900">{group1Diseases.length}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Контрольная группа */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">Контрольная группа</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Лечение</label>
                <select
                  value={group2Treatment}
                  onChange={(e) => setGroup2Treatment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все методы лечения</option>
                  {treatmentMethods.map(treatment => (
                    <option key={treatment} value={treatment}>{treatment}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Пол</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => toggleGender(2, 'male')}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    {group2Genders.includes('male') ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                    Мужчины
                  </button>
                  <button
                    onClick={() => toggleGender(2, 'female')}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    {group2Genders.includes('female') ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                    Женщины
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Возраст от</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={group2MinAge}
                    onChange={(e) => setGroup2MinAge(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">до</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={group2MaxAge}
                    onChange={(e) => setGroup2MaxAge(e.target.value)}
                    placeholder="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Год от</label>
                  <select
                    value={group2MinYear}
                    onChange={(e) => setGroup2MinYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Все годы</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">до</label>
                  <select
                    value={group2MaxYear}
                    onChange={(e) => setGroup2MaxYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Все годы</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Пациентов в группе: <span className="font-medium text-gray-900">{group2Diseases.length}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Настройки анализа */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">Настройки анализа</h3>
        
        <div className="space-y-4">
          {/* Выбор контрольных точек */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-700">Контрольные точки для сравнения</label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllCP}
                  className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
                >
                  Выбрать все
                </button>
                <button
                  onClick={deselectAllCP}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  Снять все
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {controlPointNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => toggleCPIndex(index)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    selectedCPIndices.includes(index)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {selectedCPIndices.includes(index) ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Выбор групп анализов */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-700">Группы анализов</label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllGroups}
                  className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
                >
                  Выбрать все
                </button>
                <button
                  onClick={deselectAllGroups}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  Снять все
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {references.labGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    selectedGroupIds.includes(group.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {selectedGroupIds.includes(group.id) ? (
                    <CheckSquare className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{group.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Уровень значимости */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Статистический критерий
              </label>
              <select
                value={statisticalTest}
                onChange={(e) => setStatisticalTest(e.target.value as StatisticalTest)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mann-whitney">Критерий Манна-Уитни (U-тест)</option>
                <option value="student-t">t-критерий Стьюдента</option>
                <option value="welch-t">t-критерий Уэлча</option>
                <option value="kolmogorov-smirnov">Критерий Колмогорова-Смирнова</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {statisticalTest === 'mann-whitney' && 'Непараметрический тест для независимых выборок'}
                {statisticalTest === 'student-t' && 'Параметрический тест для выборок с равными дисперсиями'}
                {statisticalTest === 'welch-t' && 'Параметрический тест для выборок с неравными дисперсиями'}
                {statisticalTest === 'kolmogorov-smirnov' && 'Тест для сравнения распределений'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Уровень значимости (α)
              </label>
              <select
                value={significanceLevel}
                onChange={(e) => setSignificanceLevel(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0.01}>0.01 (99% уверенности)</option>
                <option value={0.05}>0.05 (95% уверенности)</option>
                <option value={0.10}>0.10 (90% уверенности)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Результаты сравнения */}
      {comparisonResults.length > 0 ? (
        <div className="space-y-4">
          {/* Памятка по интерпретации результатов */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-5">
            <h4 className="text-purple-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Интерпретация результатов
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border border-purple-100">
                {statisticalTest === 'mann-whitney' && (
                  <>
                    <div className="font-medium text-purple-900 mb-1">U-статистика (критерий Манна-Уитни)</div>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      Непараметрический критерий для сравнения двух независимых групп. Чем меньше значение U, 
                      тем больше различие между группами. Используется для оценки значимости различий в 
                      распределениях показателей.
                    </p>
                  </>
                )}
                {statisticalTest === 'student-t' && (
                  <>
                    <div className="font-medium text-purple-900 mb-1">t-статистика (критерий Стьюдента)</div>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      Параметрический критерий для сравнения средних значений двух независимых групп с равными дисперсиями. 
                      Чем больше абсолютное значение t, тем больше различие между группами. 
                      Предполагает нормальное распределение данных.
                    </p>
                  </>
                )}
                {statisticalTest === 'welch-t' && (
                  <>
                    <div className="font-medium text-purple-900 mb-1">t-статистика (критерий Уэлча)</div>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      Параметрический критерий для сравнения средних значений двух независимых групп с неравными дисперсиями. 
                      Адаптация критерия Стьюдента, не требующая ра��енства дисперсий. 
                      Предполагает нормальное распределение данных.
                    </p>
                  </>
                )}
                {statisticalTest === 'kolmogorov-smirnov' && (
                  <>
                    <div className="font-medium text-purple-900 mb-1">D-статистика (критерий Колмогорова-Смирнова)</div>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      Непараметрический критерий для сравнения распределений двух независимых групп. 
                      D показывает максимальное расстояние между кумулятивными функциями распределения. 
                      Чем больше D, тем сильнее различаются распределения.
                    </p>
                  </>
                )}
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="font-medium text-purple-900 mb-1">p-value (уровень значимости)</div>
                <p className="text-gray-700 text-xs leading-relaxed">
                  Вероятность получить наблюдаемые различия случайно. 
                  <span className="block mt-1 text-purple-800">
                    • p &lt; 0.05 — различия <strong>статистически значимы</strong><br/>
                    • p ≥ 0.05 — различия <strong>незначимы</strong>
                  </span>
                  Чем меньше p-value, тем больше уверенность в различиях.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="font-medium text-purple-900 mb-1">Результат</div>
                <p className="text-gray-700 text-xs leading-relaxed">
                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs mb-1">Значимое</span> 
                  — между группами есть статистически значимые различия (p &lt; α).
                  Метод лечения или фактор влияет на показатель.
                  <span className="block mt-1">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">Незначимое</span> 
                    — различия могут быть случайными.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Таблица результатов */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-gray-900">Результаты сравнительного анализа</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {statisticalTest === 'mann-whitney' && 'Критерий Манна-Уитни (U-критерий) для независимых выборок'}
                  {statisticalTest === 'student-t' && 'Критерий Стьюдента (t-тест) для независимых выборок с равными дисперсиями'}
                  {statisticalTest === 'welch-t' && 'Критерий Уэлча (t-тест) для независимых выборок с неравными дисперсиями'}
                  {statisticalTest === 'kolmogorov-smirnov' && 'Критерий Колмогорова-Смирнова для сравнения распределений'}
                </p>
              </div>
              <button
                onClick={handleExportTableToExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Экспорт в Excel
              </button>
            </div>
            
            <div className="overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-30" rowSpan={2}>
                        Показатель
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase tracking-wider" rowSpan={2}>
                        КТ
                      </th>
                      <th className="px-3 py-2 text-center text-xs text-gray-700 uppercase tracking-wider border-l border-gray-200" colSpan={2}>
                        N пациентов
                      </th>
                      <th className="px-3 py-2 text-center text-xs text-gray-700 uppercase tracking-wider border-l border-gray-200" colSpan={2}>
                        Медиана
                      </th>
                      <th className="px-3 py-2 text-center text-xs text-gray-700 uppercase tracking-wider border-l border-gray-200" colSpan={2}>
                        Среднее
                      </th>
                      <th className="px-3 py-2 text-center text-xs text-gray-700 uppercase tracking-wider border-l border-gray-200" colSpan={2}>
                        Q25
                      </th>
                      <th className="px-3 py-2 text-center text-xs text-gray-700 uppercase tracking-wider border-l border-gray-200" colSpan={2}>
                        Q75
                      </th>
                      <th className="px-3 py-2 text-center text-xs text-gray-700 uppercase tracking-wider border-l border-gray-200" rowSpan={2}>
                        {statisticalTest === 'mann-whitney' && 'U-статистика'}
                        {statisticalTest === 'student-t' && 't-статистика'}
                        {statisticalTest === 'welch-t' && 't-статистика'}
                        {statisticalTest === 'kolmogorov-smirnov' && 'D-статистика'}
                      </th>
                      <th className="px-3 py-2 text-center text-xs text-gray-700 uppercase tracking-wider" rowSpan={2}>
                        p-value
                      </th>
                      <th className="px-3 py-2 text-center text-xs text-gray-700 uppercase tracking-wider" rowSpan={2}>
                        Результат
                      </th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-200 sticky top-[56px] z-20">
                      {/* N */}
                      <th className="px-2 py-2 text-xs text-gray-600 border-l border-gray-200 bg-blue-50">Эксп.</th>
                      <th className="px-2 py-2 text-xs text-gray-600 bg-green-50">Контр.</th>
                      {/* Медиана */}
                      <th className="px-2 py-2 text-xs text-gray-600 border-l border-gray-200 bg-blue-50">Эксп.</th>
                      <th className="px-2 py-2 text-xs text-gray-600 bg-green-50">Контр.</th>
                      {/* Среднее */}
                      <th className="px-2 py-2 text-xs text-gray-600 border-l border-gray-200 bg-blue-50">Эксп.</th>
                      <th className="px-2 py-2 text-xs text-gray-600 bg-green-50">Контр.</th>
                      {/* Q25 */}
                      <th className="px-2 py-2 text-xs text-gray-600 border-l border-gray-200 bg-blue-50">Эксп.</th>
                      <th className="px-2 py-2 text-xs text-gray-600 bg-green-50">Контр.</th>
                      {/* Q75 */}
                      <th className="px-2 py-2 text-xs text-gray-600 border-l border-gray-200 bg-blue-50">Эксп.</th>
                      <th className="px-2 py-2 text-xs text-gray-600 bg-green-50">Контр.</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparisonResults.map((result, index) => (
                      <tr key={`${result.indicatorId}-${result.cpIndex}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 z-10 bg-inherit">
                          <div>
                            <div>{result.indicatorName}</div>
                            {result.unit && <div className="text-xs text-gray-500">{result.unit}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {result.cpName.split(' - ')[0]}
                        </td>
                        {/* N */}
                        <td className="px-2 py-3 text-sm text-gray-900 text-center border-l border-gray-200 bg-blue-50">
                          {result.group1Count || 0}
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-900 text-center bg-green-50">
                          {result.group2Count || 0}
                        </td>
                        {/* Медиана */}
                        <td className="px-2 py-3 text-sm text-gray-900 text-center border-l border-gray-200 bg-blue-50">
                          {result.group1Median != null ? result.group1Median.toFixed(2) : '—'}
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-900 text-center bg-green-50">
                          {result.group2Median != null ? result.group2Median.toFixed(2) : '—'}
                        </td>
                        {/* Среднее */}
                        <td className="px-2 py-3 text-sm text-gray-900 text-center border-l border-gray-200 bg-blue-50">
                          {result.group1Mean != null ? result.group1Mean.toFixed(2) : '—'}
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-900 text-center bg-green-50">
                          {result.group2Mean != null ? result.group2Mean.toFixed(2) : '—'}
                        </td>
                        {/* Q25 */}
                        <td className="px-2 py-3 text-sm text-gray-600 text-center border-l border-gray-200 bg-blue-50">
                          {result.group1Q25 != null ? result.group1Q25.toFixed(2) : '—'}
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-600 text-center bg-green-50">
                          {result.group2Q25 != null ? result.group2Q25.toFixed(2) : '—'}
                        </td>
                        {/* Q75 */}
                        <td className="px-2 py-3 text-sm text-gray-600 text-center border-l border-gray-200 bg-blue-50">
                          {result.group1Q75 != null ? result.group1Q75.toFixed(2) : '—'}
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-600 text-center bg-green-50">
                          {result.group2Q75 != null ? result.group2Q75.toFixed(2) : '—'}
                        </td>
                        {/* Статистика */}
                        <td className="px-2 py-3 text-sm text-gray-900 text-center border-l border-gray-200">
                          {result.statistic != null ? result.statistic.toFixed(1) : '—'}
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-900 text-center">
                          {result.pValue != null ? (result.pValue < 0.001 ? '<0.001' : result.pValue.toFixed(3)) : '—'}
                        </td>
                        <td className="px-2 py-3 text-sm text-center">
                          {result.isSignificant ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              Значимое
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                              Незначимое
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Графики */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">Графики сравнения</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm text-gray-700">Показатели для графиков</label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllGroups}
                    className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  >
                    Выбрать все
                  </button>
                  <button
                    onClick={deselectAllGroups}
                    className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    Снять все
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {references.labGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedGroupIds.includes(group.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {selectedGroupIds.includes(group.id) ? (
                      <CheckSquare className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{group.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <ComparativeAnalysisCharts
                comparisonResults={comparisonResults}
                selectedIndicatorIds={selectedIndicatorIds}
                groupIndicators={groupIndicators}
                group1Name={`${group1DiseaseName}${group1Treatment ? ` (${group1Treatment})` : ''}`}
                group2Name={`${group2DiseaseName}${group2Treatment ? ` (${group2Treatment})` : ''}`}
                onSelectIndicators={setSelectedIndicatorIds}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Настройте параметры сравнения</p>
          <p className="text-sm text-gray-400">
            Выберите группы анализов и контрольные точки для начала сравнительного анализа
          </p>
        </div>
      )}
    </div>
  );
}











