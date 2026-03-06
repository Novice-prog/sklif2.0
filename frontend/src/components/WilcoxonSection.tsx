import { useState } from 'react';
import { BarChart3, Activity, CheckSquare, Square, FileSpreadsheet } from 'lucide-react';

type PairedTestType = 'wilcoxon' | 'paired-t';

type WilcoxonComparison = {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  cp1Index: number;
  cp1Name: string;
  cp2Index: number;
  cp2Name: string;
  pairCount: number;
  statistic: number; // W-статистика или t-статистика
  statisticName: string; // 'W' или 't'
  pValue: number;
  isSignificant: boolean;
  medianDifference: number;
};

type WilcoxonSectionProps = {
  wilcoxonComparisons: WilcoxonComparison[];
  significanceLevel: number;
  onSignificanceLevelChange: (level: number) => void;
  selectedCPIndicesCount: number;
  hasGroupStatistics: boolean;
  pairedTestType: PairedTestType;
  onPairedTestTypeChange: (type: PairedTestType) => void;
};

export function WilcoxonSection({
  wilcoxonComparisons,
  significanceLevel,
  onSignificanceLevelChange,
  selectedCPIndicesCount,
  hasGroupStatistics,
  pairedTestType,
  onPairedTestTypeChange,
}: WilcoxonSectionProps) {
  const [showWilcoxonResults, setShowWilcoxonResults] = useState(false);

  // Функция экспорта результатов Вилкоксона в Excel
  const handleExportToExcel = () => {
    if (wilcoxonComparisons.length === 0) return;

    try {
      const statisticLabel = pairedTestType === 'wilcoxon' ? 'W-статистика' : 't-статистика';
      
      // Подготовка данных для экспорта
      const headers = ['Показатель', 'Единица', 'Сравнение', 'N пар', 'Медиана Δ', statisticLabel, 'p-value', 'Результат'];
      const rows = wilcoxonComparisons.map(comp => [
        comp.indicatorName,
        comp.unit || '',
        `${comp.cp1Name.split(' - ')[0]} → ${comp.cp2Name.split(' - ')[0]}`,
        comp.pairCount.toString(),
        comp.medianDifference.toFixed(2),
        comp.statistic.toFixed(pairedTestType === 'wilcoxon' ? 1 : 3),
        comp.pValue < 0.001 ? '<0.001' : comp.pValue.toFixed(3),
        comp.isSignificant ? 'Значимое' : 'Незначимое'
      ]);

      // Создание CSV
      const csvContent = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n');

      // Скачивание файла
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const testName = pairedTestType === 'wilcoxon' ? 'вилкоксона' : 'парный_t_тест';
      link.download = `критерий_${testName}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Произошла ошибка при экспорте данных');
    }
  };

  if (selectedCPIndicesCount < 2 || !hasGroupStatistics) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="text-gray-900">Критерий Вилкоксона</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Парное сравнение контрольных точек
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWilcoxonResults(!showWilcoxonResults)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showWilcoxonResults
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            {showWilcoxonResults ? 'Скрыть' : 'Показать результаты'}
          </button>
        </div>
      </div>

      {showWilcoxonResults && (
        <>
          {wilcoxonComparisons.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">Недостаточно парных данных для сравнения</p>
              <p className="text-sm text-gray-400 mt-1">
                Для каждого пациента должны быть данные по обеим сравниваемым контрольным точкам
              </p>
            </div>
          ) : (
            <>
              {/* Настройки */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={handleExportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    title="Экспорт результатов в Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Экспорт в Excel
                  </button>
                  
                  <div className="border-l border-gray-300 h-6"></div>
                  
                  <label className="text-sm text-gray-700">
                    Статистический критерий:
                  </label>
                  <select
                    value={pairedTestType}
                    onChange={(e) => onPairedTestTypeChange(e.target.value as PairedTestType)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="wilcoxon">Критерий Вилкоксона</option>
                    <option value="paired-t">Парный t-критерий Стьюдента</option>
                  </select>
                  
                  <div className="border-l border-gray-300 h-6"></div>
                  
                  <label className="text-sm text-gray-700">
                    Уровень значимости α:
                  </label>
                  <select
                    value={significanceLevel}
                    onChange={(e) => onSignificanceLevelChange(parseFloat(e.target.value))}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0.01}>0.01 (99%)</option>
                    <option value={0.05}>0.05 (95%)</option>
                    <option value={0.10}>0.10 (90%)</option>
                  </select>
                  <div className="flex-1"></div>
                  <div className="text-sm text-gray-600">
                    Сравнений: <span className="font-semibold text-indigo-600">{wilcoxonComparisons.length}</span>
                  </div>
                </div>
              </div>

              {/* Таблица результатов */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-indigo-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-700 sticky left-0 bg-indigo-50 z-10">Показатель</th>
                      <th className="px-4 py-3 text-center text-gray-700">Сравнение</th>
                      <th className="px-4 py-3 text-center text-gray-700">N пар</th>
                      <th className="px-4 py-3 text-center text-gray-700">Медиана Δ</th>
                      <th className="px-4 py-3 text-center text-gray-700">
                        {pairedTestType === 'wilcoxon' ? 'W-статистика' : 't-статистика'}
                      </th>
                      <th className="px-4 py-3 text-center text-gray-700">p-value</th>
                      <th className="px-4 py-3 text-center text-gray-700">Результат</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wilcoxonComparisons.map((comparison, index) => (
                      <tr
                        key={`${comparison.indicatorId}-${comparison.cp1Index}-${comparison.cp2Index}`}
                        className={`border-b border-gray-100 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-900 sticky left-0 bg-inherit z-10 border-r border-gray-200">
                          {comparison.indicatorName}
                          {comparison.unit && <span className="text-gray-500 ml-1">({comparison.unit})</span>}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 whitespace-nowrap">
                          <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                            {comparison.cp1Name.split(' - ')[0]}
                          </span>
                          <span className="mx-2">→</span>
                          <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                            {comparison.cp2Name.split(' - ')[0]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-indigo-600 font-semibold">
                          {comparison.pairCount}
                        </td>
                        <td className={`px-4 py-3 text-center font-semibold ${
                          comparison.medianDifference > 0 ? 'text-green-600' :
                          comparison.medianDifference < 0 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {comparison.medianDifference > 0 ? '+' : ''}{comparison.medianDifference.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-900">
                          {comparison.statistic.toFixed(pairedTestType === 'wilcoxon' ? 1 : 3)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-900">
                          {comparison.pValue < 0.001 ? '<0.001' : comparison.pValue.toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {comparison.isSignificant ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                              <CheckSquare className="w-3.5 h-3.5" />
                              Значимое
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                              <Square className="w-3.5 h-3.5" />
                              Незначимое
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Пояснения */}
              <div className="px-6 py-4 bg-indigo-50 border-t border-gray-200 text-sm">
                <h5 className="text-gray-900 mb-2 font-semibold">Интерпретация:</h5>
                <ul className="space-y-1.5 text-gray-700">
                  {pairedTestType === 'wilcoxon' ? (
                    <>
                      <li>
                        <strong>Критерий Вилкоксона</strong> — непараметрический критерий для сравнения двух связанных выборок 
                        (парных измерений от одних и тех же пациентов в разные моменты времени). Не требует нормального распределения данных.
                      </li>
                      <li>
                        <strong>W-статистика</strong> — сумма рангов меньших по модулю разностей. Чем меньше W, тем сильнее различия между группами.
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <strong>Парный t-критерий Стьюдента</strong> — параметрический критерий для сравнения двух связанных выборок 
                        (парных измерений от одних и тех же пациентов в разные моменты времени). Требует нормального распределения разностей.
                      </li>
                      <li>
                        <strong>t-статистика</strong> — отношение средней разности к стандартной ошибке. Чем больше |t|, тем сильнее различия между группами.
                      </li>
                    </>
                  )}
                  <li>
                    <strong>N пар</strong> — количество пациентов, у которых есть данные по обеим сравниваемым контрольным точкам
                  </li>
                  <li>
                    <strong>Медиана Δ</strong> — медиана разностей между КТ (положительное значение означает рост показателя)
                  </li>
                  <li>
                    <strong>p-value &lt; α</strong> — различия статистически значимы (изменения показателя неслучайны)
                  </li>
                  <li>
                    <strong>p-value ≥ α</strong> — различия статистически незначимы (изменения могут быть случайными)
                  </li>
                </ul>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}