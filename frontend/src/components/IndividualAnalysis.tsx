import { useState, useMemo } from 'react';
import { Activity, CheckSquare, Square, Download } from 'lucide-react';
import type { ControlPoint, LabResult, References } from '../types';
import * as XLSX from 'xlsx';
import { IndividualAnalysisCharts } from './IndividualAnalysisCharts';

type IndividualAnalysisProps = {
  controlPoints: ControlPoint[];
  labResults: LabResult[];
  references: References;
  caseNumber?: string;
  diseaseName?: string;
};

type AnalysisData = {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  groupName: string;
  values: (number | null)[];
  deltas: {
    delta1: number | null;  // Δ между КТ1 и КТ2
    delta2: number | null;  // Δ между КТ2 и КТ3
    delta3: number | null;  // Δ между КТ3 и КТ4
  };
  median: number | null;
  q25: number | null;
  q75: number | null;
};

export function IndividualAnalysis({
  controlPoints,
  labResults,
  references,
  caseNumber = '',
  diseaseName = '',
}: IndividualAnalysisProps) {
  // Выбранные группы показателей (по умолчанию ничего не выбрано)
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  
  // Выбранные показатели для графиков
  const [selectedChartIndicatorIds, setSelectedChartIndicatorIds] = useState<string[]>([]);

  // Сортируем контрольные точки по дате
  const sortedControlPoints = useMemo(() => 
    [...controlPoints].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [controlPoints]
  );

  // Вычисление квартиля
  const calculateQuantile = (values: number[], q: number): number | null => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };

  // Вычисление процентной дельты
  const calculatePercentDelta = (from: number | null, to: number | null): number | null => {
    if (from === null || to === null || from === 0) return null;
    return ((to - from) / from) * 100;
  };

  // Получить индикаторы выбранных групп
  const selectedIndicators = useMemo(() => 
    references.labIndicators
      .filter(i => selectedGroupIds.includes(i.group_id) && i.data_type === 'numeric')
      .sort((a, b) => {
        const groupOrderA = references.labGroups.find(g => g.id === a.group_id)?.order_index || 0;
        const groupOrderB = references.labGroups.find(g => g.id === b.group_id)?.order_index || 0;
        if (groupOrderA !== groupOrderB) return groupOrderA - groupOrderB;
        return a.order_index - b.order_index;
      }),
    [selectedGroupIds, references]
  );

  // Формирование данных для анализа
  const analysisData = useMemo<AnalysisData[]>(() => {
    return selectedIndicators.map(indicator => {
      const groupName = references.labGroups.find(g => g.id === indicator.group_id)?.name || '';
      
      // Получаем значения для каждой КТ
      const values = sortedControlPoints.map(cp => {
        const result = labResults.find(
          r => r.control_point_id === cp.id && 
               r.indicator_id === indicator.id && 
               r.value_numeric !== undefined
        );
        return result?.value_numeric ?? null;
      });

      // Дополняем массив null до 4 элементов
      while (values.length < 4) {
        values.push(null);
      }

      // Вычисляем дельты
      const delta1 = calculatePercentDelta(values[0], values[1]);
      const delta2 = calculatePercentDelta(values[1], values[2]);
      const delta3 = calculatePercentDelta(values[2], values[3]);

      // Вычисляем статистику по всем непустым значениям
      const validValues = values.filter((v): v is number => v !== null);
      const median = calculateQuantile(validValues, 0.5);
      const q25 = calculateQuantile(validValues, 0.25);
      const q75 = calculateQuantile(validValues, 0.75);

      return {
        indicatorId: indicator.id,
        indicatorName: indicator.name,
        unit: indicator.unit || '',
        groupName,
        values,
        deltas: { delta1, delta2, delta3 },
        median,
        q25,
        q75,
      };
    }).filter(data => data.values.some(v => v !== null)); // Показываем только показатели с данными
  }, [selectedIndicators, sortedControlPoints, labResults, references]);

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

  // Форматирование значения с цветом для дельты
  const formatDelta = (delta: number | null) => {
    if (delta === null) return { text: '-', color: 'text-gray-400' };
    const sign = delta > 0 ? '+' : '';
    const color = delta > 0 ? 'text-red-600' : delta < 0 ? 'text-green-600' : 'text-gray-600';
    return { text: `${sign}${delta.toFixed(1)}%`, color };
  };

  // Экспорт данных в Excel
  const exportToExcel = () => {
    const worksheetData = [
      ['Показатель', 'КТ1', 'КТ2', '1Δ%', 'КТ3', '2Δ%', 'КТ4', '3Δ%', 'Медиана', 'Q25', 'Q75'],
      ...analysisData.map(data => {
        const delta1 = formatDelta(data.deltas.delta1);
        const delta2 = formatDelta(data.deltas.delta2);
        const delta3 = formatDelta(data.deltas.delta3);

        return [
          `${data.indicatorName} (${data.unit}) - ${data.groupName}`,
          data.values[0] !== null ? data.values[0].toFixed(2) : '-',
          data.values[1] !== null ? data.values[1].toFixed(2) : '-',
          delta1.text,
          data.values[2] !== null ? data.values[2].toFixed(2) : '-',
          delta2.text,
          data.values[3] !== null ? data.values[3].toFixed(2) : '-',
          delta3.text,
          data.median !== null ? data.median.toFixed(2) : '-',
          data.q25 !== null ? data.q25.toFixed(2) : '-',
          data.q75 !== null ? data.q75.toFixed(2) : '-',
        ];
      }),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Анализ');
    
    // Формируем понятное имя файла
    const dateStr = new Date().toISOString().split('T')[0];
    const caseInfo = caseNumber ? `_ИБ${caseNumber}` : '';
    const diseaseInfo = diseaseName ? `_${diseaseName.replace(/[/\\?%*:|"<>]/g, '-')}` : '';
    const filename = `индивидуальный_анализ${caseInfo}${diseaseInfo}_${dateStr}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-gray-900">Индивидуальный анализ показателей</h3>
          <p className="text-sm text-gray-600">
            Динамика показателей по контрольным точкам с расчетом процентных дельт
          </p>
        </div>
      </div>

      {/* Фильтры групп показателей */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-gray-700">Выберите группы показателей</label>
          <div className="flex gap-2">
            <button
              onClick={selectAllGroups}
              className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
                  ? 'bg-blue-600 text-white'
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
          Выбрано групп: <span className="font-semibold text-blue-600">{selectedGroupIds.length}</span>
        </div>
      </div>

      {/* Таблица анализа */}
      {sortedControlPoints.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Нет контрольных точек для анализа</p>
          <p className="text-sm text-gray-400 mt-1">Добавьте контрольные точки и лабораторные данные</p>
        </div>
      ) : analysisData.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Нет данных для анализа в выбранных группах</p>
          <p className="text-sm text-gray-400 mt-1">Выберите другие группы или добавьте лабораторные результаты</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Заголовок таблицы с кнопкой экспорта */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-50">
            <div>
              <h4 className="text-gray-900 font-semibold">Результаты анализа</h4>
              <p className="text-sm text-gray-600 mt-0.5">Динамика показателей по контрольным точкам</p>
            </div>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Экспорт в Excel
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 border-b border-gray-200 sticky top-0 z-20">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 sticky left-0 bg-blue-50 z-30">Показатель</th>
                  <th className="px-4 py-3 text-center text-gray-700">КТ1</th>
                  <th className="px-4 py-3 text-center text-gray-700">КТ2</th>
                  <th className="px-4 py-3 text-center text-gray-700">1Δ%</th>
                  <th className="px-4 py-3 text-center text-gray-700">КТ3</th>
                  <th className="px-4 py-3 text-center text-gray-700">2Δ%</th>
                  <th className="px-4 py-3 text-center text-gray-700">КТ4</th>
                  <th className="px-4 py-3 text-center text-gray-700">3Δ%</th>
                  <th className="px-4 py-3 text-center text-gray-700">Медиана</th>
                  <th className="px-4 py-3 text-center text-gray-700">Q25</th>
                  <th className="px-4 py-3 text-center text-gray-700">Q75</th>
                </tr>
              </thead>
              <tbody>
                {analysisData.map((data, index) => {
                  const delta1 = formatDelta(data.deltas.delta1);
                  const delta2 = formatDelta(data.deltas.delta2);
                  const delta3 = formatDelta(data.deltas.delta3);

                  return (
                    <tr 
                      key={data.indicatorId}
                      className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 text-gray-900 sticky left-0 bg-inherit z-10 border-r border-gray-200">
                        <div>{data.indicatorName}</div>
                        {data.unit && <div className="text-xs text-gray-500 mt-1">({data.unit})</div>}
                        <div className="text-xs text-blue-600 mt-1">{data.groupName}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {data.values[0] !== null ? data.values[0].toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {data.values[1] !== null ? data.values[1].toFixed(2) : '-'}
                      </td>
                      <td className={`px-4 py-3 text-center font-semibold ${delta1.color}`}>
                        {delta1.text}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {data.values[2] !== null ? data.values[2].toFixed(2) : '-'}
                      </td>
                      <td className={`px-4 py-3 text-center font-semibold ${delta2.color}`}>
                        {delta2.text}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {data.values[3] !== null ? data.values[3].toFixed(2) : '-'}
                      </td>
                      <td className={`px-4 py-3 text-center font-semibold ${delta3.color}`}>
                        {delta3.text}
                      </td>
                      <td className="px-4 py-3 text-center text-blue-600">
                        {data.median !== null ? data.median.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {data.q25 !== null ? data.q25.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {data.q75 !== null ? data.q75.toFixed(2) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Графики визуализации */}
      {analysisData.length > 0 && (
        <IndividualAnalysisCharts
          analysisData={analysisData}
          selectedIndicatorIds={selectedChartIndicatorIds}
          onSelectIndicators={setSelectedChartIndicatorIds}
          caseNumber={caseNumber}
          diseaseName={diseaseName}
        />
      )}

      {/* Подсказки */}
      <div className="bg-blue-50 rounded-lg p-4 text-sm">
        <h5 className="text-gray-900 mb-2">Обозначения:</h5>
        <ul className="space-y-1 text-gray-700">
          <li><strong>КТ1-КТ4</strong> - значения показателей на контрольных точках</li>
          <li><strong>1Δ%</strong> - процентное изменение от КТ1 к КТ2 (зеленый - снижение, красный - повышение)</li>
          <li><strong>2Δ%</strong> - процентное изменение от КТ2 к КТ3</li>
          <li><strong>3Δ%</strong> - процентное изменение от КТ3 к КТ4</li>
          <li><strong>Медиана</strong> - срединное значение по всем КТ</li>
          <li><strong>Q25/Q75</strong> - 25-й и 75-й квартили</li>
        </ul>
      </div>
    </div>
  );
}