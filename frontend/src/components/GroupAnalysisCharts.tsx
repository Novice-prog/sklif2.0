import { useMemo, useRef, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label, LabelList } from 'recharts';
import { TrendingUp, BarChart3, Download, CheckSquare, Square } from 'lucide-react';
import type { GroupStatistics } from './GroupAnalysis';

type GroupAnalysisChartsProps = {
  groupStatistics: GroupStatistics[];
  selectedIndicatorIds: string[];
  groupIndicators: Array<{
    id: string;
    name: string;
    unit?: string;
  }>;
  onSelectIndicators: (ids: string[]) => void;
};

const controlPointNames = ['КТ1', 'КТ2', 'КТ3', 'КТ4'];

const CHART_COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export function GroupAnalysisCharts({
  groupStatistics,
  selectedIndicatorIds,
  groupIndicators,
  onSelectIndicators,
}: GroupAnalysisChartsProps) {
  const chartsRef = useRef<HTMLDivElement>(null);
  const medianChartRef = useRef<HTMLDivElement>(null);
  const meanChartRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Данные для графиков по выбранным показателям
  const chartData = useMemo(() => {
    if (selectedIndicatorIds.length === 0) return [];
    
    return controlPointNames.map((cpName, cpIndex) => {
      const dataPoint: any = { name: cpName };
      
      selectedIndicatorIds.forEach(indicatorId => {
        const stat = groupStatistics.find(s => s.indicatorId === indicatorId && s.cpIndex === cpIndex);
        if (stat) {
          dataPoint[`${indicatorId}_median`] = stat.median;
          dataPoint[`${indicatorId}_mean`] = stat.mean;
        }
      });
      
      return dataPoint;
    });
  }, [groupStatistics, selectedIndicatorIds]);

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
      // Используем dom-to-image как альтернативу html2canvas
      const domtoimage = await import('dom-to-image');
      
      const dataUrl = await domtoimage.toPng(chartsRef.current, {
        quality: 1,
        bgcolor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `графики_групповой_анализ_${new Date().toISOString().split('T')[0]}.png`;
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

  if (groupStatistics.length === 0) {
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
                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {selectedIndicatorIds.includes(indicator.id) ? (
                <CheckSquare className="w-4 h-4 flex-shrink-0 text-purple-600" />
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
                  ? 'bg-purple-600 text-white'
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
                  ? 'bg-purple-600 text-white'
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
        <div className="space-y-4" ref={chartsRef}>
          {/* График Медианы всех выбранных показателей */}
          <div className="bg-white rounded-lg border border-gray-200 p-4" ref={medianChartRef}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {chartType === 'line' ? (
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                ) : (
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                )}
                <h4 className="text-gray-900">
                  Динамика показателей - Медиана
                </h4>
              </div>
              <button
                onClick={() => handleExportSingleChart(medianChartRef, 'график_медиана')}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
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
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                  {selectedIndicatorIds.map((indicatorId, idx) => {
                    const indicator = groupIndicators.find(i => i.id === indicatorId);
                    return (
                      <Line
                        key={indicatorId}
                        type="monotone"
                        dataKey={`${indicatorId}_median`}
                        stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                        strokeWidth={2}
                        name={`${indicator?.name || indicatorId}`}
                        dot={{ fill: CHART_COLORS[idx % CHART_COLORS.length], r: 4 }}
                        connectNulls
                      >
                        <LabelList 
                          dataKey={`${indicatorId}_median`}
                          position="top"
                          style={{ fontSize: '10px', fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                          formatter={(value: any) => value ? value.toFixed(1) : ''}
                        />
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
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                  {selectedIndicatorIds.map((indicatorId, idx) => {
                    const indicator = groupIndicators.find(i => i.id === indicatorId);
                    return (
                      <Bar
                        key={indicatorId}
                        dataKey={`${indicatorId}_median`}
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        name={`${indicator?.name || indicatorId}`}
                      >
                        <LabelList 
                          dataKey={`${indicatorId}_median`}
                          position="top"
                          style={{ fontSize: '10px', fill: '#374151' }}
                          formatter={(value: any) => value ? value.toFixed(1) : ''}
                        />
                      </Bar>
                    );
                  })}
                </BarChart>
              )}
            </ResponsiveContainer>
            <div className="mt-3 text-xs text-gray-600">
              <p>• Медиана - срединное значение (устойчиво к выбросам)</p>
            </div>
          </div>

          {/* График Средние всех выбранных показателей */}
          <div className="bg-white rounded-lg border border-gray-200 p-4" ref={meanChartRef}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {chartType === 'line' ? (
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                ) : (
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                )}
                <h4 className="text-gray-900">
                  Динамика показателей - Среднее значение
                </h4>
              </div>
              <button
                onClick={() => handleExportSingleChart(meanChartRef, 'график_среднее')}
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
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                  {selectedIndicatorIds.map((indicatorId, idx) => {
                    const indicator = groupIndicators.find(i => i.id === indicatorId);
                    return (
                      <Line
                        key={indicatorId}
                        type="monotone"
                        dataKey={`${indicatorId}_mean`}
                        stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                        strokeWidth={2}
                        name={`${indicator?.name || indicatorId}`}
                        dot={{ fill: CHART_COLORS[idx % CHART_COLORS.length], r: 4 }}
                        strokeDasharray="5 5"
                        connectNulls
                      >
                        <LabelList 
                          dataKey={`${indicatorId}_mean`}
                          position="top"
                          style={{ fontSize: '10px', fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                          formatter={(value: any) => value ? value.toFixed(1) : ''}
                        />
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
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                  {selectedIndicatorIds.map((indicatorId, idx) => {
                    const indicator = groupIndicators.find(i => i.id === indicatorId);
                    return (
                      <Bar
                        key={indicatorId}
                        dataKey={`${indicatorId}_mean`}
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        name={`${indicator?.name || indicatorId}`}
                        fillOpacity={0.7}
                      >
                        <LabelList 
                          dataKey={`${indicatorId}_mean`}
                          position="top"
                          style={{ fontSize: '10px', fill: '#374151' }}
                          formatter={(value: any) => value ? value.toFixed(1) : ''}
                        />
                      </Bar>
                    );
                  })}
                </BarChart>
              )}
            </ResponsiveContainer>
            <div className="mt-3 text-xs text-gray-600">
              <p>• Среднее арифметическое - может изменяться под влиянием выбросов</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}