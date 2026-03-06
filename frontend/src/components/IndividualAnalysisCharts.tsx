import { useState, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { TrendingUp, BarChart3, Download, CheckSquare, Square, ChevronDown, ChevronUp, Activity } from 'lucide-react';

type AnalysisData = {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  groupName: string;
  values: (number | null)[];
  deltas: {
    delta1: number | null;
    delta2: number | null;
    delta3: number | null;
  };
  median: number | null;
  q25: number | null;
  q75: number | null;
};

type IndividualAnalysisChartsProps = {
  analysisData: AnalysisData[];
  selectedIndicatorIds: string[];
  onSelectIndicators: (ids: string[]) => void;
  caseNumber?: string;
  diseaseName?: string;
};

const controlPointNames = ['КТ1', 'КТ2', 'КТ3', 'КТ4'];
const CHART_COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const INITIAL_LEGEND_ITEMS = 6;

export function IndividualAnalysisCharts({
  analysisData,
  selectedIndicatorIds,
  onSelectIndicators,
  caseNumber = '',
  diseaseName = '',
}: IndividualAnalysisChartsProps) {
  const valuesChartRef = useRef<HTMLDivElement>(null);
  const deltasChartRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [showDeltasChart, setShowDeltasChart] = useState(false);

  const needsExpandableLegend = selectedIndicatorIds.length > INITIAL_LEGEND_ITEMS;
  const showLabels = selectedIndicatorIds.length <= 4;

  // Данные для графика значений
  const valuesChartData = controlPointNames.map((cpName, cpIndex) => {
    const dataPoint: any = { name: cpName };
    
    selectedIndicatorIds.forEach(indicatorId => {
      const indicator = analysisData.find(d => d.indicatorId === indicatorId);
      if (indicator && indicator.values[cpIndex] !== null) {
        dataPoint[indicatorId] = indicator.values[cpIndex];
      }
    });
    
    return dataPoint;
  });

  // Данные для графика дельт
  const deltasChartData = [
    { name: '1Δ% (КТ1→КТ2)' },
    { name: '2Δ% (КТ2→КТ3)' },
    { name: '3Δ% (КТ3→КТ4)' },
  ];

  selectedIndicatorIds.forEach(indicatorId => {
    const indicator = analysisData.find(d => d.indicatorId === indicatorId);
    if (indicator) {
      deltasChartData[0][indicatorId] = indicator.deltas.delta1;
      deltasChartData[1][indicatorId] = indicator.deltas.delta2;
      deltasChartData[2][indicatorId] = indicator.deltas.delta3;
    }
  });

  // Переключение выбора показателя
  const toggleIndicator = (indicatorId: string) => {
    if (selectedIndicatorIds.includes(indicatorId)) {
      onSelectIndicators(selectedIndicatorIds.filter(id => id !== indicatorId));
    } else {
      onSelectIndicators([...selectedIndicatorIds, indicatorId]);
    }
  };

  // Экспорт графика в PNG
  const handleExportChart = async (chartRef: React.RefObject<HTMLDivElement>, chartName: string) => {
    if (!chartRef.current) return;

    try {
      const domtoimage = await import('dom-to-image');
      
      const dataUrl = await domtoimage.toPng(chartRef.current, {
        quality: 1,
        bgcolor: '#ffffff',
      });
      
      // Формируем понятное имя файла
      const dateStr = new Date().toISOString().split('T')[0];
      const caseInfo = caseNumber ? `_ИБ${caseNumber}` : '';
      const diseaseInfo = diseaseName ? `_${diseaseName.replace(/[/\\?%*:|"<>]/g, '-')}` : '';
      const filename = `${chartName}${caseInfo}${diseaseInfo}_${dateStr}.png`;
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Ошибка экспорта графика:', error);
      alert('Произошла ошибка при экспорте графика в PNG. Попробуйте использовать скриншот экрана.');
    }
  };

  if (analysisData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Фильтр по показателям */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm text-gray-700">Выберите показатели для визуализации</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectIndicators(analysisData.map(d => d.indicatorId))}
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
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {analysisData.map(data => (
            <button
              key={data.indicatorId}
              onClick={() => toggleIndicator(data.indicatorId)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                selectedIndicatorIds.includes(data.indicatorId)
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {selectedIndicatorIds.includes(data.indicatorId) ? (
                <CheckSquare className="w-4 h-4 flex-shrink-0 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 flex-shrink-0 text-gray-400" />
              )}
              <span className="truncate">
                {data.indicatorName} {data.unit ? `(${data.unit})` : ''}
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
      {selectedIndicatorIds.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm text-gray-700 mb-2">Настройки визуализации</label>
          <div className="flex flex-wrap gap-2">
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
            <button
              onClick={() => setShowDeltasChart(!showDeltasChart)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showDeltasChart
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-5 h-5" />
              {showDeltasChart ? 'Скрыть график дельт' : 'Показать график дельт'}
            </button>
          </div>
        </div>
      )}

      {/* График динамики значений */}
      {selectedIndicatorIds.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4" ref={valuesChartRef}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="text-gray-900">Динамика показателей по контрольным точкам</h4>
            </div>
            <button
              onClick={() => handleExportChart(valuesChartRef, 'динамика_показателей')}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title="Сохранить этот график"
            >
              <Download className="w-3.5 h-3.5" />
              Сохранить
            </button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={valuesChartData}>
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
                  const indicator = analysisData.find(d => d.indicatorId === indicatorId);
                  return (
                    <Line 
                      key={indicatorId}
                      type="monotone" 
                      dataKey={indicatorId}
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      strokeWidth={2}
                      name={`${indicator?.indicatorName || indicatorId}`}
                      dot={{ fill: CHART_COLORS[idx % CHART_COLORS.length], r: 4 }}
                      connectNulls
                    >
                      {showLabels && <LabelList 
                        dataKey={indicatorId}
                        position="top"
                        style={{ fontSize: '10px', fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                        formatter={(value: any) => value ? value.toFixed(1) : ''}
                      />}
                    </Line>
                  );
                })}
              </LineChart>
            ) : (
              <BarChart data={valuesChartData}>
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
                  const indicator = analysisData.find(d => d.indicatorId === indicatorId);
                  return (
                    <Bar 
                      key={indicatorId}
                      dataKey={indicatorId}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      name={`${indicator?.indicatorName || indicatorId}`}
                    >
                      {showLabels && <LabelList 
                        dataKey={indicatorId}
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

          {/* Легенда с раскрытием */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {selectedIndicatorIds
                .slice(0, isLegendExpanded ? selectedIndicatorIds.length : INITIAL_LEGEND_ITEMS)
                .map((indicatorId, idx) => {
                  const indicator = analysisData.find(d => d.indicatorId === indicatorId);
                  return (
                    <div key={indicatorId} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="text-xs text-gray-700 truncate">
                        {indicator?.indicatorName || indicatorId}
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
        </div>
      )}

      {/* График процентных изменений (дельт) */}
      {selectedIndicatorIds.length > 0 && showDeltasChart && (
        <div className="bg-white rounded-lg border border-gray-200 p-4" ref={deltasChartRef}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <h4 className="text-gray-900">Процентные изменения показателей (Δ%)</h4>
            </div>
            <button
              onClick={() => handleExportChart(deltasChartRef, 'дельты_показателей')}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              title="Сохранить этот график"
            >
              <Download className="w-3.5 h-3.5" />
              Сохранить
            </button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={deltasChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#9ca3af"
                  label={{ value: '%', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => value !== null ? `${value.toFixed(1)}%` : '-'}
                />
                {selectedIndicatorIds.map((indicatorId, idx) => {
                  const indicator = analysisData.find(d => d.indicatorId === indicatorId);
                  return (
                    <Line 
                      key={indicatorId}
                      type="monotone" 
                      dataKey={indicatorId}
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      strokeWidth={2}
                      name={`${indicator?.indicatorName || indicatorId}`}
                      dot={{ fill: CHART_COLORS[idx % CHART_COLORS.length], r: 4 }}
                      connectNulls
                    >
                      {showLabels && <LabelList 
                        dataKey={indicatorId}
                        position="top"
                        style={{ fontSize: '10px', fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                        formatter={(value: any) => value !== null ? `${value.toFixed(1)}%` : ''}
                      />}
                    </Line>
                  );
                })}
              </LineChart>
            ) : (
              <BarChart data={deltasChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#9ca3af"
                  label={{ value: '%', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => value !== null ? `${value.toFixed(1)}%` : '-'}
                />
                {selectedIndicatorIds.map((indicatorId, idx) => {
                  const indicator = analysisData.find(d => d.indicatorId === indicatorId);
                  return (
                    <Bar 
                      key={indicatorId}
                      dataKey={indicatorId}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      name={`${indicator?.indicatorName || indicatorId}`}
                    >
                      {showLabels && <LabelList 
                        dataKey={indicatorId}
                        position="top"
                        style={{ fontSize: '10px', fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                        formatter={(value: any) => value !== null ? `${value.toFixed(1)}%` : ''}
                      />}
                    </Bar>
                  );
                })}
              </BarChart>
            )}
          </ResponsiveContainer>

          {/* Легенда с раскрытием */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {selectedIndicatorIds
                .slice(0, isLegendExpanded ? selectedIndicatorIds.length : INITIAL_LEGEND_ITEMS)
                .map((indicatorId, idx) => {
                  const indicator = analysisData.find(d => d.indicatorId === indicatorId);
                  return (
                    <div key={indicatorId} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="text-xs text-gray-700 truncate">
                        {indicator?.indicatorName || indicatorId}
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
        </div>
      )}
    </div>
  );
}
