import { useMemo, useRef, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { TrendingUp, BarChart3, AlertTriangle, Download, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';

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
  uStatistic: number;
  pValue: number;
  isSignificant: boolean;
};

type ComparativeAnalysisChartsProps = {
  comparisonResults: ComparisonResult[];
  selectedIndicatorIds: string[];
  groupIndicators: Array<{
    id: string;
    name: string;
    unit?: string;
  }>;
  group1Name: string;
  group2Name: string;
  onSelectIndicators: (ids: string[]) => void;
};

const controlPointNames = ['КТ1', 'КТ2', 'КТ3', 'КТ4'];

const CHART_COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const MAX_INDICATORS = 10; // Максимальное количество показателей для графиков

export function ComparativeAnalysisCharts({
  comparisonResults,
  selectedIndicatorIds,
  groupIndicators,
  group1Name,
  group2Name,
  onSelectIndicators,
}: ComparativeAnalysisChartsProps) {
  const chartsRef = useRef<HTMLDivElement>(null);
  const group1ChartRef = useRef<HTMLDivElement>(null);
  const group2ChartRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Проверка на превышение лимита показателей
  const isOverLimit = selectedIndicatorIds.length > MAX_INDICATORS;
  
  // Состояние для раскрытия легенды
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  
  // Адаптивные настройки отображения
  const showLabels = selectedIndicatorIds.length <= 4; // Метки на точках только при <= 4 показателях
  const INITIAL_LEGEND_ITEMS = 6; // Показываем первые 6 показателей в легенде
  const needsExpandableLegend = selectedIndicatorIds.length > INITIAL_LEGEND_ITEMS;

  // Данные для графиков по выбранным показателям
  const chartData = useMemo(() => {
    if (selectedIndicatorIds.length === 0) return [];
    
    return controlPointNames.map((cpName, cpIndex) => {
      const dataPoint: any = { name: cpName };
      
      selectedIndicatorIds.forEach(indicatorId => {
        const result = comparisonResults.find(r => r.indicatorId === indicatorId && r.cpIndex === cpIndex);
        if (result) {
          dataPoint[`${indicatorId}_group1Median`] = result.group1Median;
          dataPoint[`${indicatorId}_group2Median`] = result.group2Median;
          dataPoint[`${indicatorId}_group1Mean`] = result.group1Mean;
          dataPoint[`${indicatorId}_group2Mean`] = result.group2Mean;
          dataPoint[`${indicatorId}_isSignificant`] = result.isSignificant;
          dataPoint[`${indicatorId}_pValue`] = result.pValue;
        }
      });
      
      return dataPoint;
    });
  }, [comparisonResults, selectedIndicatorIds]);

  // Функция переключения выбора показателя
  const toggleIndicator = (indicatorId: string) => {
    if (selectedIndicatorIds.includes(indicatorId)) {
      onSelectIndicators(selectedIndicatorIds.filter(id => id !== indicatorId));
    } else {
      onSelectIndicators([...selectedIndicatorIds, indicatorId]);
    }
  };

  // Функция экспорта графиков в PNG
  const handleExportChartsToPNG = async () => {
    if (!chartsRef.current || selectedIndicatorIds.length === 0) return;

    try {
      const domtoimage = await import('dom-to-image');
      
      const dataUrl = await domtoimage.toPng(chartsRef.current, {
        quality: 1,
        bgcolor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `сравнение_групп_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Ошибка экспорта графиков:', error);
      alert('Произошла ошибка при экспорте графиков в PNG. Попробуйте использовать скриншот экрана.');
    }
  };

  // Функция экспорта одного графика в PNG
  const handleExportSingleChart = async (chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!chartRef.current) return;

    try {
      const domtoimage = await import('dom-to-image');
      
      const dataUrl = await domtoimage.toPng(chartRef.current, {
        quality: 1,
        bgcolor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Ошибка экспорта графика:', error);
      alert('Произошла ошибка при экспорте графика в PNG. Попробуйте использовать скриншот экрана.');
    }
  };

  if (comparisonResults.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Фильтр по показателям - множественный выбор */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm text-gray-700">Выберите показатели для визуализации (можно выбрать несколько)</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectIndicators(groupIndicators.map(i => i.id))}
              className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
            >
              Выбрать все
            </button>
            <button
              onClick={() => onSelectIndicators([])}
              className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Снять все
            </button>
            {selectedIndicatorIds.length > 0 && (
              <button
                onClick={handleExportChartsToPNG}
                className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Экспорт графиков в PNG"
              >
                <Download className="w-4 h-4" />
                Экспорт в PNG
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {groupIndicators.map(indicator => (
            <button
              key={indicator.id}
              onClick={() => toggleIndicator(indicator.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                selectedIndicatorIds.includes(indicator.id)
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {selectedIndicatorIds.includes(indicator.id) ? (
                <CheckSquare className="w-4 h-4 flex-shrink-0 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 flex-shrink-0 text-gray-400" />
              )}
              <span className="truncate">
                {indicator.name} {indicator.unit ? `(${indicator.unit})` : ''}
              </span>
            </button>
          ))}
        </div>
        {selectedIndicatorIds.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            Выбрано показателей: {selectedIndicatorIds.length}
          </div>
        )}
        {isOverLimit && (
          <div className="mt-2 text-xs text-red-500">
            Превышен лимит показателей для графиков (максимум {MAX_INDICATORS}).
          </div>
        )}
      </div>

      {/* Тип визуализации */}
      {selectedIndicatorIds.length > 0 && chartData.length > 0 && (
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
              <TrendingUp className="w-5 h-5" />
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
      )}

      {/* Графики */}
      {selectedIndicatorIds.length > 0 && chartData.length > 0 && (
        <>
          {/* Предупреждение при превышении рекомендованного количества */}
          {isOverLimit && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-amber-900 mb-1">Слишком много показателей</h4>
                  <p className="text-sm text-amber-800">
                    Вы выбрали {selectedIndicatorIds.length} показателей, что превышает рекомендованный лимит ({MAX_INDICATORS}).
                    Графики могут отображаться некорректно. Рекомендуем выбрать не более {MAX_INDICATORS} показателей для оптимальной визуализации.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4" ref={chartsRef}>
            {/* График сравнения медиан - Группа 1 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4" ref={group1ChartRef}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h4 className="text-gray-900">
                    {group1Name} - Медиана
                  </h4>
                </div>
                <button
                  onClick={() => handleExportSingleChart(group1ChartRef, `график_${group1Name}_медиана`)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  title="Сохранить этот график"
                >
                  <Download className="w-3.5 h-3.5" />
                  Сохранить
                </button>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'line' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => value?.toFixed(2)}
                    />
                    {selectedIndicatorIds.map((indicatorId, idx) => {
                      const indicator = groupIndicators.find(i => i.id === indicatorId);
                      return (
                        <Line 
                          key={indicatorId}
                          type="monotone" 
                          dataKey={`${indicatorId}_group1Median`}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                          strokeWidth={2}
                          name={`${indicator?.name || indicatorId}`}
                          dot={{ fill: CHART_COLORS[idx % CHART_COLORS.length], r: 4 }}
                          connectNulls
                        >
                          {showLabels && <LabelList 
                            dataKey={`${indicatorId}_group1Median`}
                            position="top"
                            style={{ fontSize: '10px', fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                            formatter={(value: any) => value ? value.toFixed(1) : ''}
                          />}
                        </Line>
                      );
                    })}
                  </LineChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => value?.toFixed(2)}
                    />
                    {selectedIndicatorIds.map((indicatorId, idx) => {
                      const indicator = groupIndicators.find(i => i.id === indicatorId);
                      return (
                        <Bar 
                          key={indicatorId}
                          dataKey={`${indicatorId}_group1Median`}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                          name={`${indicator?.name || indicatorId}`}
                        >
                          {showLabels && <LabelList 
                            dataKey={`${indicatorId}_group1Median`}
                            position="top"
                            style={{ fontSize: '10px', fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                            formatter={(value: any) => value ? value.toFixed(1) : ''}
                          />}
                        </Bar>
                      );
                    })}
                  </BarChart>
                )}
              </ResponsiveContainer>
              
              {/* Пользовательская легенда с раскрытием */}
              {needsExpandableLegend && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedIndicatorIds
                      .slice(0, isLegendExpanded ? selectedIndicatorIds.length : INITIAL_LEGEND_ITEMS)
                      .map((indicatorId, idx) => {
                        const indicator = groupIndicators.find(i => i.id === indicatorId);
                        return (
                          <div key={indicatorId} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                            />
                            <span className="text-xs text-gray-700 truncate">
                              {indicator?.name || indicatorId}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  {needsExpandableLegend && (
                    <button
                      onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                      className="mt-3 flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      {isLegendExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Скрыть
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Показать все ({selectedIndicatorIds.length - INITIAL_LEGEND_ITEMS} еще)
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* График сравнения медиан - Группа 2 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4" ref={group2ChartRef}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                  <h4 className="text-gray-900">
                    {group2Name} - Медиана
                  </h4>
                </div>
                <button
                  onClick={() => handleExportSingleChart(group2ChartRef, `график_${group2Name}_медиана`)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  title="Сохранить этот график"
                >
                  <Download className="w-3.5 h-3.5" />
                  Сохранить
                </button>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'line' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => value?.toFixed(2)}
                    />
                    {selectedIndicatorIds.map((indicatorId, idx) => {
                      const indicator = groupIndicators.find(i => i.id === indicatorId);
                      return (
                        <Line 
                          key={indicatorId}
                          type="monotone" 
                          dataKey={`${indicatorId}_group2Median`}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                          strokeWidth={2}
                          name={`${indicator?.name || indicatorId}`}
                          dot={{ fill: CHART_COLORS[idx % CHART_COLORS.length], r: 4 }}
                          connectNulls
                        >
                          {showLabels && <LabelList 
                            dataKey={`${indicatorId}_group2Median`}
                            position="top"
                            style={{ fontSize: '10px', fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                            formatter={(value: any) => value ? value.toFixed(1) : ''}
                          />}
                        </Line>
                      );
                    })}
                  </LineChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => value?.toFixed(2)}
                    />
                    {selectedIndicatorIds.map((indicatorId, idx) => {
                      const indicator = groupIndicators.find(i => i.id === indicatorId);
                      return (
                        <Bar 
                          key={indicatorId}
                          dataKey={`${indicatorId}_group2Median`}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                          name={`${indicator?.name || indicatorId}`}
                        >
                          {showLabels && <LabelList 
                            dataKey={`${indicatorId}_group2Median`}
                            position="top"
                            style={{ fontSize: '10px', fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                            formatter={(value: any) => value ? value.toFixed(1) : ''}
                          />}
                        </Bar>
                      );
                    })}
                  </BarChart>
                )}
              </ResponsiveContainer>
              
              {/* Пользовательская легенда с раскрытием */}
              {needsExpandableLegend && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedIndicatorIds
                      .slice(0, isLegendExpanded ? selectedIndicatorIds.length : INITIAL_LEGEND_ITEMS)
                      .map((indicatorId, idx) => {
                        const indicator = groupIndicators.find(i => i.id === indicatorId);
                        return (
                          <div key={indicatorId} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                            />
                            <span className="text-xs text-gray-700 truncate">
                              {indicator?.name || indicatorId}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  {needsExpandableLegend && (
                    <button
                      onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                      className="mt-3 flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      {isLegendExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Скрыть
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Показать все ({selectedIndicatorIds.length - INITIAL_LEGEND_ITEMS} еще)
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Статистическая значимость */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h4 className="text-gray-900">Статистическая значимость различий</h4>
              </div>
              <div className="space-y-3">
                {selectedIndicatorIds.map(indicatorId => {
                  const indicator = groupIndicators.find(i => i.id === indicatorId);
                  const significantPoints = chartData.filter(point => point[`${indicatorId}_isSignificant`]);
                  
                  return (
                    <div key={indicatorId} className="border-l-4 border-purple-400 pl-3">
                      <p className="text-sm text-gray-900">
                        <strong>{indicator?.name || indicatorId}</strong>
                      </p>
                      {significantPoints.length > 0 ? (
                        <div className="mt-1 text-xs text-gray-600">
                          {significantPoints.map((point, idx) => (
                            <p key={idx}>
                              • <strong>{point.name}</strong>: различия значимы (p = {point[`${indicatorId}_pValue`]?.toFixed(4)})
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          Нет статистически значимых различий между группами (p &gt; 0.05)
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}