import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Users, CheckSquare, Square, Save, FolderOpen, Trash2, X, TrendingUp, Activity, FileSpreadsheet } from 'lucide-react';
import type { MedicalCase, Disease, ControlPoint, LabResult, InstrumentalStudy } from '../types';
import { references } from '../data/mockData';
import { GroupAnalysisCharts } from './GroupAnalysisCharts';
import { createClinicalDataApi } from '../api/clinicalDataApi';
import { WilcoxonSection } from './WilcoxonSection';
import { wilcoxonSignedRankTest, pairedTTest } from '../utils/statisticalTests';
import React from 'react';

type GroupAnalysisProps = {
  medicalCases: MedicalCase[];
  diseases: Disease[];
  controlPoints: ControlPoint[];
  labResults: LabResult[];
  instrumentalStudies: InstrumentalStudy[];
  onBack?: () => void;
};

export type GroupStatistics = {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  cpIndex: number;
  cpName: string;
  patientCount: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
};

type WilcoxonComparison = {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  cp1Index: number;
  cp1Name: string;
  cp2Index: number;
  cp2Name: string;
  pairCount: number; // Количество парных наблюдений
  statistic: number; // W-статистика или t-статистика
  statisticName: string; // 'W' или 't'
  pValue: number;
  isSignificant: boolean;
  medianDifference: number; // Медиана разностей
};

type SavedFilter = {
  id: string;
  name: string;
  diseaseName: string;
  groupIds: string[];
  cpIndices: number[];
  genders: ('male' | 'female')[];
  minAge: string;
  maxAge: string;
  minYear: string; // Фильтр по годам - от
  maxYear: string; // Фильтр по годам - до
  createdAt: string;
};

const api = createClinicalDataApi();

const controlPointNames = [
  'КТ1 - При поступлении',
  'КТ2 - Через 6 часов',
  'КТ3 - Через 24 часа',
  'КТ4 - Перед выпиской'
];

export function GroupAnalysis({
  medicalCases,
  diseases,
  controlPoints,
  labResults,
  onBack,
}: GroupAnalysisProps) {
  const [selectedDiseaseName, setSelectedDiseaseName] = useState<string>('');
  const [diseaseSearchQuery, setDiseaseSearchQuery] = useState<string>(''); // Поиск заболеваний
  const [showAllDiseases, setShowAllDiseases] = useState(false); // Показать все заболевания
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedCPIndices, setSelectedCPIndices] = useState<number[]>([]); // Выбранные индексы КТ
  
  // Фильтры по полу и возрасту
  const [selectedGenders, setSelectedGenders] = useState<('male' | 'female')[]>(['male', 'female']);
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  const [minYear, setMinYear] = useState<string>(''); // Фильтр по годам - от
  const [maxYear, setMaxYear] = useState<string>(''); // Фильтр по годам - до

  // Фильтр по показателю для графиков
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);
  const [showGraphs, setShowGraphs] = useState(false);
  const isBackendMode = (import.meta.env.VITE_USE_BACKEND ?? 'true').toLowerCase() === 'true';
  const [serverGroupStatistics, setServerGroupStatistics] = useState<GroupStatistics[] | null>(null);

  // Настройки для критерия Вилкоксона
  const [significanceLevel, setSignificanceLevel] = useState<number>(0.05);
  const [pairedTestType, setPairedTestType] = useState<'wilcoxon' | 'paired-t'>('wilcoxon');

  // Сохраненные фильтры
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isSaveFilterModalOpen, setIsSaveFilterModalOpen] = useState(false);
  const [isLoadFilterModalOpen, setIsLoadFilterModalOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

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

  // Получить уникальные названия заболеваний
  const diseaseNames = useMemo(() => {
    if (!diseases || diseases.length === 0) return [];
    return Array.from(new Set(diseases.map(d => d.disease_name)));
  }, [diseases]);

  useEffect(() => {
    if (diseaseNames.length === 0 || selectedDiseaseName) return;
    setSelectedDiseaseName(diseaseNames[0]);
  }, [diseaseNames, selectedDiseaseName]);

  // Фильтрация заболеваний по поисковому запросу
  const filteredDiseaseNames = useMemo(() => {
    if (!diseaseSearchQuery) return diseaseNames;
    const query = diseaseSearchQuery.toLowerCase();
    return diseaseNames.filter(name => name.toLowerCase().includes(query));
  }, [diseaseNames, diseaseSearchQuery]);

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

  // Фильтр пациентов по выбранному заболеванию, полу и возрасту
  const filteredDiseases = useMemo(() => {
    if (!diseases || diseases.length === 0) return [];
    
    return diseases.filter(d => {
      // Фильтр по заболеванию
      if (d.disease_name !== selectedDiseaseName) return false;
      
      // Получаем медицинскую карту для данного заболевания
      const medicalCase = medicalCases.find(mc => mc.id === d.medical_case_id);
      if (!medicalCase) return false;
      
      // Фильтр по полу
      if (!selectedGenders.includes(medicalCase.gender)) return false;
      
      // Фильтр по возрасту
      const minAgeNum = minAge ? parseInt(minAge) : 0;
      const maxAgeNum = maxAge ? parseInt(maxAge) : Infinity;
      if (medicalCase.age < minAgeNum || medicalCase.age > maxAgeNum) return false;
      
      // Фильтр по годам (диапазон)
      if (minYear || maxYear) {
        const minYearNum = minYear ? parseInt(minYear) : 0;
        const maxYearNum = maxYear ? parseInt(maxYear) : Infinity;
        const caseYear = new Date(medicalCase.admission_date).getFullYear();
        if (caseYear < minYearNum || caseYear > maxYearNum) return false;
      }
      
      return true;
    });
  }, [diseases, medicalCases, selectedDiseaseName, selectedGenders, minAge, maxAge, minYear, maxYear]);

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
      setServerGroupStatistics(null);
      return;
    }

    if (!selectedDiseaseName || selectedCPIndices.length === 0 || groupIndicators.length === 0) {
      setServerGroupStatistics([]);
      return;
    }

    const run = async () => {
      try {
        const response = await api.getGroupAnalytics({
          group_filter: {
            disease_name: selectedDiseaseName,
            genders: selectedGenders,
            min_age: minAge ? parseInt(minAge, 10) : undefined,
            max_age: maxAge ? parseInt(maxAge, 10) : undefined,
            min_year: minYear ? parseInt(minYear, 10) : undefined,
            max_year: maxYear ? parseInt(maxYear, 10) : undefined,
          },
          indicator_ids: groupIndicators.map(indicator => indicator.id),
          cp_indices: selectedCPIndices,
        });

        const mapped: GroupStatistics[] = response.map(item => {
          const indicator = references.labIndicators.find(ind => ind.id === item.indicator_id);
          return {
            indicatorId: item.indicator_id,
            indicatorName: indicator?.name ?? item.indicator_id,
            unit: indicator?.unit ?? '',
            cpIndex: item.cp_index,
            cpName: controlPointNames[item.cp_index] ?? ('КТ' + (item.cp_index + 1)),
            patientCount: item.sample_size,
            mean: item.mean,
            median: item.median,
            stdDev: item.std_dev,
            min: item.min,
            max: item.max,
            q25: item.q25,
            q75: item.q75,
          };
        });

        setServerGroupStatistics(mapped);
      } catch {
        setServerGroupStatistics(null);
      }
    };

    void run();
  }, [
    isBackendMode,
    selectedDiseaseName,
    selectedGenders,
    minAge,
    maxAge,
    minYear,
    maxYear,
    selectedCPIndices,
    groupIndicators,
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

  // Вычисление стандартного отклонения
  const calculateStdDev = (values: number[], mean: number): number => {
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.sqrt(variance);
  };

  // Функция нормального кумулятивного распределения (приближение)
  const normalCDF = (z: number): number => {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  };

  // Критерий Вилкоксона для парных выборок
  const wilcoxonTest = (values1: number[], values2: number[]): { wStatistic: number; pValue: number } => {
    // Для парного теста нужно одинаковое количество наблюдений
    const n = Math.min(values1.length, values2.length);
    
    if (n === 0) {
      return { wStatistic: 0, pValue: 1 };
    }

    // Вычисляем разности
    const differences: { diff: number; absDiff: number; sign: number }[] = [];
    for (let i = 0; i < n; i++) {
      const diff = values2[i] - values1[i];
      if (diff !== 0) { // Исключаем нулевые разности
        differences.push({
          diff: diff,
          absDiff: Math.abs(diff),
          sign: diff > 0 ? 1 : -1
        });
      }
    }

    if (differences.length === 0) {
      return { wStatistic: 0, pValue: 1 };
    }

    // Сортируем по абсолютным значениям разностей
    differences.sort((a, b) => a.absDiff - b.absDiff);

    // Присваиваем ранги (с учетом связанных рангов)
    const rankedDifferences: { diff: number; rank: number; sign: number }[] = [];
    let i = 0;
    while (i < differences.length) {
      let j = i;
      // Находим все элементы с одинаковым абсолютным значением
      while (j < differences.length && differences[j].absDiff === differences[i].absDiff) {
        j++;
      }
      // Средний ранг для связанных значений
      const avgRank = (i + 1 + j) / 2;
      for (let k = i; k < j; k++) {
        rankedDifferences.push({
          diff: differences[k].diff,
          rank: avgRank,
          sign: differences[k].sign
        });
      }
      i = j;
    }

    // Сумма рангов для положительных разностей
    const WPlus = rankedDifferences
      .filter(d => d.sign > 0)
      .reduce((sum, d) => sum + d.rank, 0);

    // Сумма рангов для отрицательных разностей
    const WMinus = rankedDifferences
      .filter(d => d.sign < 0)
      .reduce((sum, d) => sum + d.rank, 0);

    // W-статистика (меньшая из двух сумм)
    const W = Math.min(WPlus, WMinus);

    // Аппроксимация нормальным распределением для вычисления p-value
    const nRanked = rankedDifferences.length;
    const meanW = (nRanked * (nRanked + 1)) / 4;
    const stdW = Math.sqrt((nRanked * (nRanked + 1) * (2 * nRanked + 1)) / 24);
    
    // Поправка на непрерывность
    const z = Math.abs((W - meanW + 0.5) / stdW);

    // Двусторонний p-value
    const pValue = 2 * (1 - normalCDF(z));

    return { wStatistic: W, pValue };
  };

  // Групповая статистика для всех выбранных КТ
  const localGroupStatistics = useMemo<GroupStatistics[]>(() => {
    if (isBackendMode) {
      return [];
    }
    const stats: GroupStatistics[] = [];

    selectedCPIndices.forEach(cpIndex => {
      groupIndicators.forEach(indicator => {
        // Собираем значения от всех пациентов для данного показателя на выбранной КТ
        const values: number[] = [];

        filteredDiseases.forEach(disease => {
          const diseaseCPs = diseaseControlPointsMap.get(disease.id);
          if (!diseaseCPs || !diseaseCPs[cpIndex]) return;

          const cp = diseaseCPs[cpIndex];
          const value = labNumericValueMap.get(`${cp.id}:${indicator.id}`);
          if (value !== undefined) {
            values.push(value);
          }
        });

        if (values.length > 0) {
          const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
          const median = calculateQuantile(values, 0.5);
          const stdDev = calculateStdDev(values, mean);
          const min = Math.min(...values);
          const max = Math.max(...values);
          const q25 = calculateQuantile(values, 0.25);
          const q75 = calculateQuantile(values, 0.75);

          stats.push({
            indicatorId: indicator.id,
            indicatorName: indicator.name,
            unit: indicator.unit || '',
            cpIndex,
            cpName: controlPointNames[cpIndex],
            patientCount: values.length,
            mean,
            median,
            stdDev,
            min,
            max,
            q25,
            q75,
          });
        }
      });
    });

    return stats;
  }, [isBackendMode, groupIndicators, filteredDiseases, selectedCPIndices, diseaseControlPointsMap, labNumericValueMap]);

  const groupStatistics = isBackendMode && serverGroupStatistics ? serverGroupStatistics : localGroupStatistics;

  // Обработчики для контрольных точек
  const toggleCPIndex = (index: number) => {
    if (selectedCPIndices.includes(index)) {
      setSelectedCPIndices(selectedCPIndices.filter(i => i !== index));
    } else {
      setSelectedCPIndices([...selectedCPIndices, index].sort((a, b) => a - b));
    }
  };

  const selectAllCPs = () => {
    setSelectedCPIndices([0, 1, 2, 3]);
  };

  const deselectAllCPs = () => {
    setSelectedCPIndices([]);
  };

  // Обработчики для групп показателей
  const toggleGroupId = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const selectAllGroups = () => {
    setSelectedGroupIds(references.labGroups.map(g => g.id));
  };

  const deselectAllGroups = () => {
    setSelectedGroupIds([]);
  };

  // Обработчики для фильтров пола
  const toggleGender = (gender: 'male' | 'female') => {
    if (selectedGenders.includes(gender)) {
      setSelectedGenders(selectedGenders.filter(g => g !== gender));
    } else {
      setSelectedGenders([...selectedGenders, gender]);
    }
  };

  // Группируем статистику по показателям
  const groupedStats = useMemo(() => {
    const grouped = new Map<string, GroupStatistics[]>();
    groupStatistics.forEach(stat => {
      if (!grouped.has(stat.indicatorId)) {
        grouped.set(stat.indicatorId, []);
      }
      grouped.get(stat.indicatorId)!.push(stat);
    });
    return grouped;
  }, [groupStatistics]);

  // Функция для получения парных значений от одних и тех же пациентов для двух КТ
  const getPairedValues = (cpIndex1: number, cpIndex2: number, indicatorId: string): { values1: number[]; values2: number[] } => {
    const values1: number[] = [];
    const values2: number[] = [];

    filteredDiseases.forEach(disease => {
      const diseaseCPs = diseaseControlPointsMap.get(disease.id);
      if (!diseaseCPs || !diseaseCPs[cpIndex1] || !diseaseCPs[cpIndex2]) return;

      const cp1 = diseaseCPs[cpIndex1];
      const cp2 = diseaseCPs[cpIndex2];
      const value1 = labNumericValueMap.get(`${cp1.id}:${indicatorId}`);
      const value2 = labNumericValueMap.get(`${cp2.id}:${indicatorId}`);

      // Добавляем только если есть оба значения (парные данные)
      if (value1 !== undefined && value2 !== undefined) {
        values1.push(value1);
        values2.push(value2);
      }
    });

    return { values1, values2 };
  };

  // Парные сравнения контрольных точек с помощью критерия Вилкоксона
  const wilcoxonComparisons = useMemo<WilcoxonComparison[]>(() => {
    if (isBackendMode) {
      return [];
    }

    const comparisons: WilcoxonComparison[] = [];

    // Проверяем, что выбрано хотя бы 2 контрольные точки
    if (selectedCPIndices.length < 2) {
      return comparisons;
    }

    // Сортируем индексы КТ
    const sortedCPIndices = [...selectedCPIndices].sort((a, b) => a - b);

    // Создаем парные сравнения последовательных КТ
    for (let i = 0; i < sortedCPIndices.length - 1; i++) {
      const cp1Index = sortedCPIndices[i];
      const cp2Index = sortedCPIndices[i + 1];

      groupIndicators.forEach(indicator => {
        const { values1, values2 } = getPairedValues(cp1Index, cp2Index, indicator.id);

        if (values1.length > 0 && values2.length > 0) {
          // Используем выбранный статистический тест
          let testResult;
          if (pairedTestType === 'wilcoxon') {
            testResult = wilcoxonSignedRankTest(values1, values2);
          } else {
            testResult = pairedTTest(values1, values2);
          }

          // Вычисляем медиану разностей
          const differences = values1.map((v, idx) => values2[idx] - v);
          const medianDifference = calculateQuantile(differences, 0.5);

          comparisons.push({
            indicatorId: indicator.id,
            indicatorName: indicator.name,
            unit: indicator.unit || '',
            cp1Index,
            cp1Name: controlPointNames[cp1Index],
            cp2Index,
            cp2Name: controlPointNames[cp2Index],
            pairCount: values1.length,
            statistic: testResult.statistic,
            statisticName: testResult.statisticName,
            pValue: testResult.pValue,
            isSignificant: testResult.pValue < significanceLevel,
            medianDifference,
          });
        }
      });
    }

    return comparisons;
  }, [isBackendMode, groupIndicators, filteredDiseases, selectedCPIndices, significanceLevel, pairedTestType, diseaseControlPointsMap, labNumericValueMap]);

  // Обработчики для сохраненных фильтров
  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    
    const newFilter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name: filterName.trim(),
      diseaseName: selectedDiseaseName,
      groupIds: selectedGroupIds,
      cpIndices: selectedCPIndices,
      genders: selectedGenders,
      minAge,
      maxAge,
      minYear, // Фильтр по годам - от
      maxYear, // Фильтр по годам - до
      createdAt: new Date().toISOString(),
    };
    
    setSavedFilters([...savedFilters, newFilter]);
    setFilterName('');
    setIsSaveFilterModalOpen(false);
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    setSelectedDiseaseName(filter.diseaseName);
    setSelectedGroupIds(filter.groupIds);
    setSelectedCPIndices(filter.cpIndices);
    setSelectedGenders(filter.genders);
    setMinAge(filter.minAge);
    setMaxAge(filter.maxAge);
    setMinYear(filter.minYear); // Фильтр по годам - от
    setMaxYear(filter.maxYear); // Фильтр по годам - до
    setIsLoadFilterModalOpen(false);
  };

  const handleDeleteFilter = (filterId: string) => {
    setSavedFilters(savedFilters.filter(f => f.id !== filterId));
  };

  // Функция экспорта таблицы в Excel (CSV)
  const handleExportTableToExcel = () => {
    if (groupStatistics.length === 0) return;

    // Создаем CSV контент
    let csv = 'Показатель,Единица,Контрольная точка,N,Среднее,Медиана,Ст. откл.,Min,Max,Q25,Q75,IQR\n';
    
    Array.from(groupedStats.entries()).forEach(([indicatorId, stats]) => {
      stats.forEach(stat => {
        const row = [
          `"${stat.indicatorName}"`,
          `"${stat.unit}"`,
          `"${stat.cpName}"`,
          stat.patientCount,
          stat.mean.toFixed(2),
          stat.median.toFixed(2),
          stat.stdDev.toFixed(2),
          stat.min.toFixed(2),
          stat.max.toFixed(2),
          stat.q25.toFixed(2),
          stat.q75.toFixed(2),
          (stat.q75 - stat.q25).toFixed(2),
        ].join(',');
        csv += row + '\n';
      });
    });

    // Добавляем BOM для правильного отображения кириллицы в Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `групповой_анализ_${selectedDiseaseName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-purple-600" />
            <h2 className="text-gray-900">Групповой анализ</h2>
          </div>
          <p className="text-sm text-gray-600">
            Сравнительный анализ показателей по группе пациентов с одинаковым заболеванием
          </p>
        </div>
      </div>

      {diseaseNames.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Нет данных для группового анализа</p>
          <p className="text-sm text-gray-400">Создайте истории болезни и добавьте диагнозы для проведения анализа</p>
        </div>
      ) : (
        <>
          {/* Выбор заболевания */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="block text-sm text-gray-700 mb-2">Выберите заболевание</label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Поиск заболевания"
                value={diseaseSearchQuery}
                onChange={(e) => setDiseaseSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex flex-wrap gap-2">
                {(showAllDiseases ? filteredDiseaseNames : filteredDiseaseNames.slice(0, 6)).map(name => (
                  <button
                    key={name}
                    onClick={() => setSelectedDiseaseName(name)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedDiseaseName === name
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
                {filteredDiseaseNames.length > 6 && (
                  <button
                    onClick={() => setShowAllDiseases(!showAllDiseases)}
                    className="px-4 py-2 rounded-lg transition-colors bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 hover:from-purple-100 hover:to-blue-100 border border-purple-200 flex items-center gap-2"
                  >
                    {showAllDiseases ? (
                      <>
                        Скрыть
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                          -{filteredDiseaseNames.length - 6}
                        </span>
                      </>
                    ) : (
                      <>
                        Показать ещё
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                          +{filteredDiseaseNames.length - 6}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Пациентов в группе: <span className="font-semibold text-purple-600">{filteredDiseases.length}</span>
            </div>
          </div>

          {/* Сохраненные фильтры */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm text-gray-700">Сохраненные фильры</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsSaveFilterModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Сохранить текущий
                </button>
                {savedFilters.length > 0 && (
                  <button
                    onClick={() => setIsLoadFilterModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Загрузить ({savedFilters.length})
                  </button>
                )}
              </div>
            </div>
            {savedFilters.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">
                Нет сохраненных фильтров. Настройте фильтры и сохраните их для быстрого доступа.
              </p>
            ) : (
              <div className="text-sm text-gray-600">
                Сохранено фильтров: <span className="font-semibold text-purple-600">{savedFilters.length}</span>
              </div>
            )}
          </div>

          {/* Фильтры по полу и возрасту */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="block text-sm text-gray-700 mb-3">Фильтры по демографическим данным</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Фильтр по полу */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Пол</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleGender('male')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 ${
                      selectedGenders.includes('male')
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedGenders.includes('male') ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Мужской
                  </button>
                  <button
                    onClick={() => toggleGender('female')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 ${
                      selectedGenders.includes('female')
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedGenders.includes('female') ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Женский
                  </button>
                </div>
              </div>

              {/* Фильтр по возрасту */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Возраст (лет)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="От"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="До"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Фильтр по годам (диапазон) */}
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-2">Годы</label>
                {availableYears.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={minYear}
                      onChange={(e) => setMinYear(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Все годы</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <span className="text-gray-400">—</span>
                    <select
                      value={maxYear}
                      onChange={(e) => setMaxYear(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Все годы</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 py-2">Нет данных по годам</p>
                )}
              </div>
            </div>

            {/* Статистика по фильтрам */}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
              <div>
                Пол: <span className="font-semibold text-purple-600">
                  {selectedGenders.length === 2 ? 'Все' : selectedGenders.includes('male') ? 'Мужской' : 'Женский'}
                </span>
              </div>
              <div>
                Возраст: <span className="font-semibold text-purple-600">
                  {!minAge && !maxAge ? 'Все' : `${minAge || '0'} - ${maxAge || '120'} лет`}
                </span>
              </div>
              <div>
                Годы: <span className="font-semibold text-purple-600">
                  {!minYear && !maxYear ? 'Все' : `${minYear || '2010'} - ${maxYear || '2025'}`}
                </span>
              </div>
              {(selectedGenders.length < 2 || minAge || maxAge || minYear || maxYear) && (
                <button
                  onClick={() => {
                    setSelectedGenders(['male', 'female']);
                    setMinAge('');
                    setMaxAge('');
                    setMinYear('');
                    setMaxYear('');
                  }}
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          </div>

          {/* Выбор контрольных точек */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm text-gray-700">Выберите контрольные точки</label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllCPs}
                  className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
                >
                  Выбрать все
                </button>
                <button
                  onClick={deselectAllCPs}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  Снять все
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {controlPointNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => toggleCPIndex(index)}
                  className={`px-4 py-3 rounded-lg transition-colors text-left flex items-center gap-2 ${
                    selectedCPIndices.includes(index)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedCPIndices.includes(index) ? (
                    <CheckSquare className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="text-sm">{name}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Выбрано точек: <span className="font-semibold text-purple-600">{selectedCPIndices.length}</span>
            </div>
          </div>

          {/* Выбор групп показателей */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm text-gray-700">Выберите группы показателей</label>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {references.labGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => toggleGroupId(group.id)}
                  className={`px-4 py-3 rounded-lg transition-colors text-left flex items-center gap-2 ${
                    selectedGroupIds.includes(group.id)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedGroupIds.includes(group.id) ? (
                    <CheckSquare className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="text-sm">{group.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Выбрано групп: <span className="font-semibold text-purple-600">{selectedGroupIds.length}</span>
            </div>
          </div>

          {/* Таблица групповой статистики */}
          {!isBackendMode && filteredDiseases.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Нет пациентов с выбранным заболеванем</p>
            </div>
          ) : groupStatistics.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Нет данных для анализа в выбранных группах</p>
              <p className="text-sm text-gray-400 mt-1">Добавьте лабораторные результаты для пациентов</p>
            </div>
          ) : (
            <>
              {/* Переключатель Таблица/Графики */}
              <div className="flex gap-2 bg-gray-50 -mx-6 px-6 py-4 border-b border-gray-200">
                <button
                  onClick={() => setShowGraphs(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    !showGraphs
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Таблица статистики
                </button>
                <button
                  onClick={() => setShowGraphs(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    showGraphs
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Графики и визуализация
                </button>
                <div className="flex-1"></div>
                {!showGraphs && (
                  <button
                    onClick={handleExportTableToExcel}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700 shadow-sm"
                    title="Экспорт таблицы в Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Экспорт в Excel
                  </button>
                )}
              </div>

              {/* Таблица */}
              {!showGraphs && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-purple-50 border-b border-gray-200 sticky top-0 z-20">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-700 sticky left-0 bg-purple-50 z-30">Показатель</th>
                          <th className="px-4 py-3 text-left text-gray-700">КТ</th>
                          <th className="px-4 py-3 text-center text-gray-700">N</th>
                          <th className="px-4 py-3 text-center text-gray-700">Среднее</th>
                          <th className="px-4 py-3 text-center text-gray-700">Медиана</th>
                          <th className="px-4 py-3 text-center text-gray-700">Ст. откл.</th>
                          <th className="px-4 py-3 text-center text-gray-700">Min</th>
                          <th className="px-4 py-3 text-center text-gray-700">Max</th>
                          <th className="px-4 py-3 text-center text-gray-700">Q25</th>
                          <th className="px-4 py-3 text-center text-gray-700">Q75</th>
                          <th className="px-4 py-3 text-center text-gray-700">IQR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(groupedStats.entries()).map(([indicatorId, stats], groupIndex) => (
                          <React.Fragment key={indicatorId}>
                            {stats.map((stat, statIndex) => (
                              <tr 
                                key={`${stat.indicatorId}-${stat.cpIndex}`}
                                className={`border-b border-gray-100 ${
                                  groupIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }`}
                              >
                                {statIndex === 0 ? (
                                  <td 
                                    className="px-4 py-3 text-gray-900 sticky left-0 bg-inherit z-10 border-r border-gray-200"
                                    rowSpan={stats.length}
                                  >
                                    {stat.indicatorName}
                                    {stat.unit && <span className="text-gray-500 ml-1">({stat.unit})</span>}
                                  </td>
                                ) : null}
                                <td className="px-4 py-3 text-gray-700 text-sm">
                                  {stat.cpName}
                                </td>
                                <td className="px-4 py-3 text-center text-purple-600 font-semibold">
                                  {stat.patientCount}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-900">
                                  {stat.mean.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-900">
                                  {stat.median.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-600">
                                  {stat.stdDev.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center text-blue-600">
                                  {stat.min.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center text-red-600">
                                  {stat.max.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-900">
                                  {stat.q25.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-900">
                                  {stat.q75.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-600">
                                  {(stat.q75 - stat.q25).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Графики */}
              {showGraphs && (
                <GroupAnalysisCharts
                  groupStatistics={groupStatistics}
                  selectedIndicatorIds={selectedIndicatorIds}
                  groupIndicators={groupIndicators}
                  onSelectIndicators={setSelectedIndicatorIds}
                />
              )}
            </>
          )}

          {/* Критерий Вилкоксона для сравнения контрольных точек */}
          <WilcoxonSection
            wilcoxonComparisons={wilcoxonComparisons}
            significanceLevel={significanceLevel}
            onSignificanceLevelChange={setSignificanceLevel}
            selectedCPIndicesCount={selectedCPIndices.length}
            hasGroupStatistics={groupStatistics.length > 0}
            pairedTestType={pairedTestType}
            onPairedTestTypeChange={setPairedTestType}
          />

          {/* Подскзки */}
          <div className="bg-purple-50 rounded-lg p-4 text-sm">
            <h5 className="text-gray-900 mb-2">Обозначения:</h5>
            <ul className="space-y-1 text-gray-700">
              <li><strong>N</strong> - количество пациентов с данным показателем</li>
              <li><strong>Среднее</strong> - среднее арифметическое значение по группе</li>
              <li><strong>Медиана</strong> - срединное значение выборки</li>
              <li><strong>Ст. откл.</strong> - стандартное отклонение (разброс значений)</li>
              <li><strong>Min/Max</strong> - минимальное и максимальное значения</li>
              <li><strong>Q25/Q75</strong> - 25-й и 75-й квартили (границы интерквартильного размаха)</li>
              <li><strong>IQR</strong> - межквартильный размах (Q75 - Q25), показывает разброс центральных 50% данных</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-purple-200">
              <p className="text-gray-700">
                <strong>Фильтрация:</strong> Используйте фильтры по полу и возрасту для анализа конкретных подгрупп пациентов. 
                Фильтры применяются автматически и влияют на все асчеты.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно сохранения фильтра */}
      {isSaveFilterModalOpen && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-gray-900">Сохранить филтр</h3>
              <button
                onClick={() => setIsSaveFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm text-gray-700 mb-2">
                Название фильтра <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Например: Мужчины 30-50 лет"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
              />
              <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm text-gray-700">
                <p className="font-semibold mb-1">Будут сохранены:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Заболевание: {selectedDiseaseName}</li>
                  <li>• Пол: {selectedGenders.length === 2 ? 'Все' : selectedGenders.includes('male') ? 'Мужской' : 'Женский'}</li>
                  <li>• Возраст: {!minAge && !maxAge ? 'Все' : `${minAge || '0'} - ${maxAge || '120'} лет`}</li>
                  <li>• Годы: {!minYear && !maxYear ? 'Все' : `${minYear || '2010'} - ${maxYear || '2025'}`}</li>
                  <li>• Контрольные точки: {selectedCPIndices.length}</li>
                  <li>• Группы показателей: {selectedGroupIds.length}</li>
                </ul>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveFilter}
                  disabled={!filterName.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setIsSaveFilterModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно загрузки фильтра */}
      {isLoadFilterModalOpen && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-gray-900">Загрузить сохраненный фильтр</h3>
              <button
                onClick={() => setIsLoadFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {savedFilters.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Нет сохраненных фильтров</p>
              ) : (
                <div className="space-y-3">
                  {savedFilters
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(filter => (
                      <div
                        key={filter.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-gray-900 mb-1">{filter.name}</h4>
                            <p className="text-xs text-gray-500">
                              Создан {new Date(filter.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteFilter(filter.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Удалить фильтр"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                          <div>
                            <span className="font-semibold">Заболевание:</span> {filter.diseaseName}
                          </div>
                          <div>
                            <span className="font-semibold">Пол:</span>{' '}
                            {filter.genders.length === 2 ? 'Все' : filter.genders.includes('male') ? 'Мужской' : 'Женский'}
                          </div>
                          <div>
                            <span className="font-semibold">Возраст:</span>{' '}
                            {!filter.minAge && !filter.maxAge ? 'Все' : `${filter.minAge || '0'} - ${filter.maxAge || '120'} лет`}
                          </div>
                          <div>
                            <span className="font-semibold">Годы:</span> {!filter.minYear && !filter.maxYear ? 'Все' : `${filter.minYear || '2010'} - ${filter.maxYear || '2025'}`}
                          </div>
                          <div>
                            <span className="font-semibold">КТ:</span> {filter.cpIndices.length} точек
                          </div>
                          <div className="col-span-2">
                            <span className="font-semibold">Группы:</span> {filter.groupIds.length} выбрано
                          </div>
                        </div>
                        <button
                          onClick={() => handleLoadFilter(filter)}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          Загрузить этот фильтр
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}












