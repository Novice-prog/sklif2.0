import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ControlPoint, LabResult, References } from '../types';

type DeltaCalculatorProps = {
  controlPoints: ControlPoint[];
  labResults: LabResult[];
  references: References;
};

export function DeltaCalculator({
  controlPoints,
  labResults,
  references,
}: DeltaCalculatorProps) {
  const [selectedCP1, setSelectedCP1] = useState<string>('');
  const [selectedCP2, setSelectedCP2] = useState<string>('');
  const [selectedIndicator, setSelectedIndicator] = useState<string>('');

  // Сортируем КТ по дате
  const sortedCPs = useMemo(() => 
    [...controlPoints].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [controlPoints]
  );

  // Получаем все уникальные показатели, по которым есть хотя бы одно значение
  const availableIndicators = useMemo(() => {
    const indicatorIds = new Set(labResults.map(r => r.indicator_id));
    return references.labIndicators
      .filter(ind => indicatorIds.has(ind.id))
      .sort((a, b) => {
        // Сортируем по группе, затем по порядку
        const groupA = references.labGroups.find(g => g.id === a.group_id);
        const groupB = references.labGroups.find(g => g.id === b.group_id);
        if (groupA && groupB && groupA.order_index !== groupB.order_index) {
          return groupA.order_index - groupB.order_index;
        }
        return a.order_index - b.order_index;
      });
  }, [labResults, references]);

  // Получить результат для конкретной КТ и показателя
  const getResult = (cpId: string, indicatorId: string) => {
    return labResults.find(r => r.control_point_id === cpId && r.indicator_id === indicatorId);
  };

  // Расчет дельт
  const calculation = useMemo(() => {
    if (!selectedCP1 || !selectedCP2 || !selectedIndicator) {
      return null;
    }

    const result1 = getResult(selectedCP1, selectedIndicator);
    const result2 = getResult(selectedCP2, selectedIndicator);
    const indicator = references.labIndicators.find(i => i.id === selectedIndicator);

    if (result1?.value_numeric === undefined || result2?.value_numeric === undefined || !indicator) {
      return null;
    }

    const value1 = result1.value_numeric;
    const value2 = result2.value_numeric;
    const absoluteDelta = value2 - value1;
    const relativeDelta = value1 !== 0 ? (absoluteDelta / value1) * 100 : 0;

    // Проверка на выход за референсные пределы
    const isOutOfRange = (value: number) => {
      if (!indicator.reference_range) return false;
      const rangeMatch = indicator.reference_range.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        return value < min || value > max;
      }
      return false;
    };

    return {
      value1,
      value2,
      absoluteDelta,
      relativeDelta,
      indicator,
      cp1: sortedCPs.find(cp => cp.id === selectedCP1)!,
      cp2: sortedCPs.find(cp => cp.id === selectedCP2)!,
      value1OutOfRange: isOutOfRange(value1),
      value2OutOfRange: isOutOfRange(value2),
    };
  }, [selectedCP1, selectedCP2, selectedIndicator, labResults, references, sortedCPs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getGroupName = (groupId: string) => {
    return references.labGroups.find(g => g.id === groupId)?.name || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-gray-900">Калькулятор дельт</h3>
          <p className="text-sm text-gray-600 mt-1">
            Расчет изменений показателей между контрольными точками
          </p>
        </div>
      </div>

      {/* Панель выбора */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Выбор КТ1 */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Контрольная точка 1 (исходная)
            </label>
            <select
              value={selectedCP1}
              onChange={(e) => setSelectedCP1(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите КТ...</option>
              {sortedCPs.map(cp => (
                <option key={cp.id} value={cp.id}>
                  {cp.name} ({formatDate(cp.date)})
                </option>
              ))}
            </select>
          </div>

          {/* Выбор КТ2 */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Контрольная точка 2 (конечная)
            </label>
            <select
              value={selectedCP2}
              onChange={(e) => setSelectedCP2(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите КТ...</option>
              {sortedCPs.map((cp, index) => {
                // Находим индекс выбранной КТ1
                const selectedCP1Index = sortedCPs.findIndex(c => c.id === selectedCP1);
                // Блокируем выбор КТ с индексом меньше или равным КТ1
                const isDisabled = selectedCP1 ? index <= selectedCP1Index : false;
                
                return (
                  <option key={cp.id} value={cp.id} disabled={isDisabled}>
                    {cp.name} ({formatDate(cp.date)})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Выбор показателя */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Лабораторный показатель
            </label>
            <select
              value={selectedIndicator}
              onChange={(e) => setSelectedIndicator(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedCP1 || !selectedCP2}
            >
              <option value="">Выберите показатель...</option>
              {availableIndicators.map(indicator => (
                <option key={indicator.id} value={indicator.id}>
                  {indicator.name} {indicator.unit ? `(${indicator.unit})` : ''} - {getGroupName(indicator.group_id)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Результаты расчета */}
      {calculation && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Заголовок */}
          <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
            <h4 className="text-gray-900">
              {calculation.indicator.name}
              {calculation.indicator.unit && <span className="text-gray-600"> ({calculation.indicator.unit})</span>}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Группа: {getGroupName(calculation.indicator.group_id)}
            </p>
            {calculation.indicator.reference_range && (
              <p className="text-sm text-gray-600">
                Референсный диапазон: {calculation.indicator.reference_range}
              </p>
            )}
          </div>

          {/* Значения */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* КТ1 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  {calculation.cp1.name} ({formatDate(calculation.cp1.date)})
                </div>
                <div className={`text-3xl ${calculation.value1OutOfRange ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                  {calculation.value1}
                  {calculation.indicator.unit && (
                    <span className="text-lg text-gray-600 ml-2">{calculation.indicator.unit}</span>
                  )}
                </div>
                {calculation.value1OutOfRange && (
                  <div className="text-xs text-red-600 mt-1">⚠ Вне референсного диапазона</div>
                )}
              </div>

              {/* КТ2 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  {calculation.cp2.name} ({formatDate(calculation.cp2.date)})
                </div>
                <div className={`text-3xl ${calculation.value2OutOfRange ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                  {calculation.value2}
                  {calculation.indicator.unit && (
                    <span className="text-lg text-gray-600 ml-2">{calculation.indicator.unit}</span>
                  )}
                </div>
                {calculation.value2OutOfRange && (
                  <div className="text-xs text-red-600 mt-1">⚠ Вне референсного диапазона</div>
                )}
              </div>
            </div>

            {/* Расчетны дельты */}
            <div className="border-t border-gray-200 pt-6">
              <h5 className="text-sm text-gray-700 mb-4">Расчет изменений</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Абсолютная дельта */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-700">Абсолютная дельта (Δ)</div>
                    {calculation.absoluteDelta > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : calculation.absoluteDelta < 0 ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <Minus className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className={`text-3xl ${
                    calculation.absoluteDelta > 0 ? 'text-green-600' :
                    calculation.absoluteDelta < 0 ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {calculation.absoluteDelta > 0 ? '+' : ''}{calculation.absoluteDelta.toFixed(2)}
                    {calculation.indicator.unit && (
                      <span className="text-lg ml-2">{calculation.indicator.unit}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Формула: КТ2 - КТ1 = {calculation.value2} - {calculation.value1}
                  </div>
                </div>

                {/* Относительная дельта */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-700">Относительная дельта (Δ%)</div>
                    {calculation.relativeDelta > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : calculation.relativeDelta < 0 ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <Minus className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className={`text-3xl ${
                    calculation.relativeDelta > 0 ? 'text-green-600' :
                    calculation.relativeDelta < 0 ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {calculation.relativeDelta > 0 ? '+' : ''}{calculation.relativeDelta.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Формула: ((КТ2 - КТ1) / КТ1) × 100% = (({calculation.value2} - {calculation.value1}) / {calculation.value1}) × 100%
                  </div>
                </div>
              </div>

              {/* Интерпретация */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-700">
                  <strong>Интерпретация:</strong>
                  {calculation.absoluteDelta > 0 ? (
                    <span className="ml-2">
                      Показатель <strong>увеличился</strong> на {Math.abs(calculation.absoluteDelta).toFixed(2)} {calculation.indicator.unit || 'ед.'} 
                      ({Math.abs(calculation.relativeDelta).toFixed(2)}%) от {calculation.cp1.name} до {calculation.cp2.name}.
                    </span>
                  ) : calculation.absoluteDelta < 0 ? (
                    <span className="ml-2">
                      Показатель <strong>уменьшился</strong> на {Math.abs(calculation.absoluteDelta).toFixed(2)} {calculation.indicator.unit || 'ед.'} 
                      ({Math.abs(calculation.relativeDelta).toFixed(2)}%) от {calculation.cp1.name} до {calculation.cp2.name}.
                    </span>
                  ) : (
                    <span className="ml-2">
                      Показатель <strong>не изменился</strong> между {calculation.cp1.name} и {calculation.cp2.name}.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Подсказка если нет данных */}
      {!calculation && selectedCP1 && selectedCP2 && selectedIndicator && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            ⚠ Нет числовых данных для выбранного показателя в одной или обеих контрольных точках.
            Убедитесь, что значения введены для обеих КТ.
          </p>
        </div>
      )}

      {/* Инструкция */}
      {!selectedCP1 || !selectedCP2 || !selectedIndicator ? (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h5 className="text-sm text-gray-900 mb-3">Как использовать калькулятор:</h5>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Выберите первую контрольную точку (исходную) - это будет базовое значение для сравнения</li>
            <li>Выберите вторую контрольную точку (конечную) - это значение будет сравниваться с первым</li>
            <li>Выберите лабораторный показатель, для которого нужно рассчитать изменение</li>
            <li>Калькулятор автоматически рассчитает абсолютную (Δ) и относительную (Δ%) дельты</li>
          </ol>
          <div className="mt-4 pt-4 border-t border-gray-300 space-y-2 text-sm text-gray-600">
            <p><strong>Абсолютная дельта (Δ):</strong> разница между значениями (КТ2 - КТ1)</p>
            <p><strong>Относительная дельта (Δ%):</strong> процентное изменение от исходного значения ((КТ2 - КТ1) / КТ1 × 100%)</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
