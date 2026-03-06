import { useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import type { LabResult, LabIndicator, LabGroup, ControlPoint } from '../../types';
import domtoimage from 'dom-to-image';

type LabResultsChartsProps = {
  controlPoints: ControlPoint[];
  labResults: LabResult[];
  labGroups: LabGroup[];
  labIndicators: LabIndicator[];
  caseNumber?: string;
  diseaseName?: string;
  patientGender?: 'male' | 'female';
};

export function LabResultsCharts({
  controlPoints,
  labResults,
  labGroups,
  labIndicators,
  caseNumber = '',
  diseaseName = '',
  patientGender = 'male',
}: LabResultsChartsProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(labGroups[0]?.id || '');
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(new Set());
  const [hoveredPoint, setHoveredPoint] = useState<{ cpId: string; indicatorId: string } | null>(null);
  const [hoveredCP, setHoveredCP] = useState<string | null>(null); // Для отслеживания наведения на контрольную точку
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Сортируем КТ по дате
  const sortedCPs = [...controlPoints].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  // Получить индикаторы выбранной группы (только числовые)
  const groupIndicators = labIndicators
    .filter(i => i.group_id === selectedGroupId && i.data_type === 'numeric')
    .sort((a, b) => a.order_index - b.order_index);

  // Если не выбрано ни одного показателя, выбираем первые 3
  if (selectedIndicators.size === 0 && groupIndicators.length > 0) {
    const initialSelection = new Set(groupIndicators.slice(0, Math.min(3, groupIndicators.length)).map(i => i.id));
    setSelectedIndicators(initialSelection);
  }

  const toggleIndicator = (indicatorId: string) => {
    const newSelection = new Set(selectedIndicators);
    if (newSelection.has(indicatorId)) {
      if (newSelection.size > 1) {
        newSelection.delete(indicatorId);
      }
    } else {
      newSelection.add(indicatorId);
    }
    setSelectedIndicators(newSelection);
  };

  // Цвета для линий
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
    '#6366f1', // indigo
    '#84cc16', // lime
    '#f43f5e', // rose
    '#0ea5e9', // sky
    '#a855f7', // purple
    '#22d3ee', // cyan-400
    '#eab308', // yellow
    '#64748b', // slate
    '#78716c', // stone
    '#dc2626', // red-600
    '#059669', // emerald
  ];

  // Получить строку референсных значений с учетом пола
  const getRefRange = (indicator: LabIndicator) => {
    if (patientGender === 'male' && indicator.reference_range_male) {
      return indicator.reference_range_male;
    }
    if (patientGender === 'female' && indicator.reference_range_female) {
      return indicator.reference_range_female;
    }
    return indicator.reference_range;
  };

  // Получить референсные границы для показателя (числовые)
  const getReferenceRange = (indicatorId: string) => {
    const indicator = labIndicators.find(i => i.id === indicatorId);
    if (!indicator) return null;
    
    const rangeStr = getRefRange(indicator);
    if (!rangeStr) return null;

    const rangeMatch = rangeStr.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (rangeMatch) {
      return {
        min: parseFloat(rangeMatch[1]),
        max: parseFloat(rangeMatch[2]),
      };
    }
    return null;
  };

  // Подготовить данные для графика
  const prepareChartData = () => {
    if (selectedIndicators.size === 0 || sortedCPs.length === 0) return null;

    const selectedIndicatorIds = Array.from(selectedIndicators);
    const allValues: number[] = [];

    // Собираем все значения для расчета масштаба
    selectedIndicatorIds.forEach(indicatorId => {
      sortedCPs.forEach(cp => {
        const result = labResults.find(
          r => r.control_point_id === cp.id && r.indicator_id === indicatorId
        );
        if (result?.value_numeric !== undefined) {
          allValues.push(result.value_numeric);
        }
      });
    });

    if (allValues.length === 0) return null;

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.1 || 1;

    return {
      minValue: minValue - padding,
      maxValue: maxValue + padding,
      selectedIndicatorIds,
    };
  };

  const chartData = prepareChartData();

  // Размеры графика
  const width = 900;
  const height = 500; // Увеличено
  const paddingLeft = 70;
  const paddingRight = 40;
  const paddingTop = 50; // Увеличено для подписей значений
  const paddingBottom = 80; // Увеличено для текста КТ
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Функция для преобразования значения в Y координату
  const getY = (value: number) => {
    if (!chartData) return 0;
    const { minValue, maxValue } = chartData;
    const ratio = (value - minValue) / (maxValue - minValue);
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  // Функция для получения X координаты
  const getX = (index: number) => {
    if (sortedCPs.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (sortedCPs.length - 1)) * chartWidth;
  };

  // Функция для получения X координаты для гистограммы
  const getBarX = (cpIndex: number, indicatorIndex: number, totalIndicators: number) => {
    const spacing = chartWidth / sortedCPs.length;
    const barGroupWidth = spacing * 0.7;
    const barWidth = barGroupWidth / totalIndicators;
    const centerX = paddingLeft + spacing * cpIndex + spacing / 2;
    const groupStartX = centerX - barGroupWidth / 2;
    return groupStartX + indicatorIndex * barWidth;
  };

  const getBarWidth = () => {
    if (!chartData) return 0;
    const spacing = chartWidth / sortedCPs.length;
    const barGroupWidth = spacing * 0.7;
    return Math.max(barGroupWidth / chartData.selectedIndicatorIds.length - 2, 5); // Минимум 5px
  };

  const downloadChart = () => {
    const chartElement = document.getElementById('lab-results-chart');
    if (!chartElement) return;

    domtoimage.toPng(chartElement)
      .then(function (dataUrl) {
        // Формируем понятное имя файла
        const dateStr = new Date().toISOString().split('T')[0];
        const caseInfo = caseNumber ? `_ИБ${caseNumber}` : '';
        const diseaseInfo = diseaseName ? `_${diseaseName.replace(/[/\\?%*:|"<>]/g, '-')}` : '';
        const selectedGroup = labGroups.find(g => g.id === selectedGroupId);
        const groupInfo = selectedGroup ? `_${selectedGroup.name.replace(/[/\\?%*:|"<>]/g, '-')}` : '';
        const filename = `график_лабораторных_данных${caseInfo}${diseaseInfo}${groupInfo}_${dateStr}.png`;
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
      })
      .catch(function (error) {
        console.error('Ошибка при сохранении изображения:', error);
      });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-gray-900">Графики лабораторных показателей</h3>
        <p className="text-sm text-gray-600 mt-1">
          Визуализация динамики показателей по контрольным точкам
        </p>
      </div>

      {/* Выбор группы */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm text-gray-700 mb-2">Выберите группу показателей</label>
        <div className="flex flex-wrap gap-2">
          {labGroups.map(group => (
            <button
              key={group.id}
              onClick={() => {
                setSelectedGroupId(group.id);
                setSelectedIndicators(new Set());
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedGroupId === group.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {/* Тип визуализации */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm text-gray-700 mb-2">Тип визуализации</label>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              chartType === 'line'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Линейный график
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Гистограмма
          </button>
        </div>
      </div>

      {/* Выбор показателей */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm text-gray-700 mb-2">
          Выберите показатели для отображения
        </label>
        <div className="flex flex-wrap gap-2">
          {groupIndicators.map((indicator) => (
            <button
              key={indicator.id}
              onClick={() => toggleIndicator(indicator.id)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                selectedIndicators.has(indicator.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {selectedIndicators.has(indicator.id) && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[Array.from(selectedIndicators).indexOf(indicator.id) % colors.length] }}
                />
              )}
              {indicator.name}
              {indicator.unit && <span className="text-xs opacity-75">({indicator.unit})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* График */}
      {chartData && sortedCPs.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6" id="lab-results-chart">
          <svg width={width} height={height} className="mx-auto">
            {/* Сетка */}
            <g>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingTop + chartHeight - ratio * chartHeight;
                const value = chartData.minValue + (chartData.maxValue - chartData.minValue) * ratio;
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={paddingLeft + chartWidth}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeDasharray="3,3"
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="#6b7280"
                    >
                      {value.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Оси */}
            <line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={paddingTop + chartHeight}
              stroke="#9ca3af"
              strokeWidth="2"
            />
            <line
              x1={paddingLeft}
              y1={paddingTop + chartHeight}
              x2={paddingLeft + chartWidth}
              y2={paddingTop + chartHeight}
              stroke="#9ca3af"
              strokeWidth="2"
            />

            {/* Подписи контрольных точек */}
            {sortedCPs.map((cp, index) => {
              const x = getX(index);
              return (
                <g key={cp.id}>
                  <text
                    x={x}
                    y={paddingTop + chartHeight + 20}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#374151"
                  >
                    {cp.name}
                  </text>
                  <text
                    x={x}
                    y={paddingTop + chartHeight + 35}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {formatDate(cp.date)}
                  </text>
                </g>
              );
            })}

            {/* Линии или столбцы показателей */}
            {chartType === 'line' ? (
              <>
                {/* ЛИНЕЙНЫЙ ГРАФИК */}
                {chartData.selectedIndicatorIds.map((indicatorId, colorIndex) => {
                  const points: Array<{ x: number; y: number; value: number; cpId: string }> = [];
                  
                  sortedCPs.forEach((cp, index) => {
                    const result = labResults.find(
                      r => r.control_point_id === cp.id && r.indicator_id === indicatorId
                    );
                    if (result?.value_numeric !== undefined) {
                      points.push({
                        x: getX(index),
                        y: getY(result.value_numeric),
                        value: result.value_numeric,
                        cpId: cp.id,
                      });
                    }
                  });

                  if (points.length === 0) return null;

                  const pathD = points.map((p, i) => 
                    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                  ).join(' ');

                  const color = colors[colorIndex % colors.length];

                  return (
                    <g key={indicatorId}>
                      {/* Линия */}
                      <path
                        d={pathD}
                        stroke={color}
                        strokeWidth="2"
                        fill="none"
                      />
                      {/* Точки с подписями значений */}
                      {points.map((point, pointIndex) => (
                        <g key={pointIndex}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={hoveredCP === point.cpId ? 6 : 4}
                            fill={color}
                            stroke="white"
                            strokeWidth="2"
                          />
                          {/* Всегда видимые значения */}
                          <text
                            x={point.x}
                            y={point.y - 10}
                            textAnchor="middle"
                            fontSize="10"
                            fill={color}
                            fontWeight="600"
                          >
                            {point.value.toFixed(1)}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })}
                
                {/* Невидимые области для отлова наведения на контрольные точки */}
                {sortedCPs.map((cp, index) => {
                  const x = getX(index);
                  const spacing = sortedCPs.length > 1 ? chartWidth / (sortedCPs.length - 1) : chartWidth;
                  const rectWidth = spacing * 0.4;
                  
                  return (
                    <rect
                      key={cp.id}
                      x={x - rectWidth / 2}
                      y={paddingTop}
                      width={rectWidth}
                      height={chartHeight}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredCP(cp.id)}
                      onMouseLeave={() => setHoveredCP(null)}
                    />
                  );
                })}

                {/* Всплывающее окно с информацией обо всех показателях для выбранной КТ */}
                {hoveredCP && (() => {
                  const cpIndex = sortedCPs.findIndex(cp => cp.id === hoveredCP);
                  if (cpIndex === -1) return null;
                  
                  const cp = sortedCPs[cpIndex];
                  const x = getX(cpIndex);
                  
                  // Собираем все значения для этой КТ
                  const cpValues = chartData.selectedIndicatorIds.map((indicatorId, idx) => {
                    const result = labResults.find(
                      r => r.control_point_id === cp.id && r.indicator_id === indicatorId
                    );
                    const indicator = labIndicators.find(i => i.id === indicatorId);
                    return {
                      name: indicator?.name || '',
                      value: result?.value_numeric,
                      unit: indicator?.unit || '',
                      color: colors[idx % colors.length],
                    };
                  }).filter(v => v.value !== undefined);
                  
                  if (cpValues.length === 0) return null;
                  
                  // Рассчитываем размер всплывающего окна
                  const tooltipWidth = 200;
                  const lineHeight = 20;
                  const headerHeight = 25;
                  const tooltipHeight = headerHeight + cpValues.length * lineHeight + 15;
                  
                  // Позиционируем окно (слева или справа от точки)
                  const tooltipX = x > width / 2 ? x - tooltipWidth - 15 : x + 15;
                  const tooltipY = paddingTop + 10;
                  
                  return (
                    <g>
                      {/* Фон всплывающего окна */}
                      <rect
                        x={tooltipX}
                        y={tooltipY}
                        width={tooltipWidth}
                        height={tooltipHeight}
                        fill="white"
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        rx="8"
                        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                      />
                      
                      {/* Заголовок */}
                      <text
                        x={tooltipX + 10}
                        y={tooltipY + 18}
                        fontSize="12"
                        fontWeight="600"
                        fill="#374151"
                      >
                        {cp.name} — {formatDate(cp.date)}
                      </text>
                      
                      {/* Линия-разделитель */}
                      <line
                        x1={tooltipX + 10}
                        y1={tooltipY + headerHeight}
                        x2={tooltipX + tooltipWidth - 10}
                        y2={tooltipY + headerHeight}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                      
                      {/* Список показателей */}
                      {cpValues.map((item, idx) => (
                        <g key={idx}>
                          {/* Цветной индикатор */}
                          <circle
                            cx={tooltipX + 15}
                            cy={tooltipY + headerHeight + 10 + idx * lineHeight + lineHeight / 2}
                            r="4"
                            fill={item.color}
                          />
                          {/* Название показателя */}
                          <text
                            x={tooltipX + 25}
                            y={tooltipY + headerHeight + 10 + idx * lineHeight + lineHeight / 2 + 4}
                            fontSize="11"
                            fill="#6b7280"
                          >
                            {item.name}:
                          </text>
                          {/* Значение */}
                          <text
                            x={tooltipX + tooltipWidth - 15}
                            y={tooltipY + headerHeight + 10 + idx * lineHeight + lineHeight / 2 + 4}
                            fontSize="11"
                            fontWeight="600"
                            fill="#374151"
                            textAnchor="end"
                          >
                            {item.value?.toFixed(2)} {item.unit}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })()}
              </>
            ) : (
              // ГИСТОГРАММА
              chartData.selectedIndicatorIds.map((indicatorId, indicatorIndex) => {
                const color = colors[indicatorIndex % colors.length];
                const barWidth = getBarWidth();
                
                return sortedCPs.map((cp, cpIndex) => {
                  const result = labResults.find(
                    r => r.control_point_id === cp.id && r.indicator_id === indicatorId
                  );
                  
                  if (!result?.value_numeric) return null;
                  
                  const value = result.value_numeric;
                  const x = getBarX(cpIndex, indicatorIndex, chartData.selectedIndicatorIds.length);
                  const y = getY(value);
                  const barHeight = paddingTop + chartHeight - y;
                  
                  return (
                    <g key={`${indicatorId}-${cp.id}`}>
                      {/* Столбец */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth - 2}
                        height={barHeight}
                        fill={color}
                        opacity={hoveredPoint?.cpId === cp.id && hoveredPoint?.indicatorId === indicatorId ? 1 : 0.85}
                        onMouseEnter={() => setHoveredPoint({ cpId: cp.id, indicatorId })}
                        onMouseLeave={() => setHoveredPoint(null)}
                        style={{ cursor: 'pointer' }}
                      />
                      {/* Значение над столбцом */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fill={color}
                        fontWeight="600"
                      >
                        {value.toFixed(1)}
                      </text>
                      {/* Тултип при наведении */}
                      {hoveredPoint?.cpId === cp.id && hoveredPoint?.indicatorId === indicatorId && (
                        <g>
                          <rect
                            x={x + barWidth / 2 + 5}
                            y={y - 40}
                            width="100"
                            height="40"
                            fill="white"
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            rx="4"
                            opacity="0.95"
                          />
                          <text
                            x={x + barWidth / 2 + 55}
                            y={y - 25}
                            textAnchor="middle"
                            fontSize="11"
                            fill="#374151"
                            fontWeight="600"
                          >
                            {value.toFixed(2)}
                          </text>
                          <text
                            x={x + barWidth / 2 + 55}
                            y={y - 13}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#6b7280"
                          >
                            {labIndicators.find(i => i.id === indicatorId)?.unit || ''}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                });
              })
            )}
          </svg>

          {/* Легенда */}
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {chartData.selectedIndicatorIds.map((indicatorId, index) => {
              const indicator = labIndicators.find(i => i.id === indicatorId);
              return (
                <div key={indicatorId} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm text-gray-700">{indicator?.name}</span>
                </div>
              );
            })}
          </div>

          {/* Кнопка для скачивания */}
          <button
            onClick={downloadChart}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors hover:bg-blue-700"
          >
            <Download className="w-5 h-5" />
            Скачать график
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          <p>Выберите показатели для отображения графика</p>
        </div>
      )}

      {/* Информация о референсных значениях */}
      {selectedIndicators.size > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm text-gray-900 mb-2">Референсные значения:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {Array.from(selectedIndicators).map((indicatorId, index) => {
              const indicator = labIndicators.find(i => i.id === indicatorId);
              if (!indicator) return null;
              
              return (
                <div key={indicatorId} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-gray-700">
                    {indicator.name}: {getRefRange(indicator) || 'не указано'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}