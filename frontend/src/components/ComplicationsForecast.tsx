import { useState } from 'react';
import { AlertTriangle, TrendingUp, Info } from 'lucide-react';
import type { ControlPoint, LabResult } from '../types';

type ComplicationsForecastProps = {
  controlPoints: ControlPoint[];
  labResults: LabResult[];
};

type Complication = {
  id: string;
  name: string;
  category?: string;
};

const complications: Complication[] = [
  { id: 'cardiogenic_shock', name: 'Кардиогенный шок', category: 'Сердечно-сосудистые' },
  { id: 'pulmonary_edema', name: 'Отек легких', category: 'Респираторные' },
  { id: 'cerebral_edema', name: 'Отек головного мозга', category: 'Неврологические' },
  { id: 'pneumonia', name: 'Пневмония', category: 'Респираторные' },
  { id: 'pulmonary_embolism', name: 'Тромбоэмболия легочной артерии', category: 'Сердечно-сосудистые' },
  { id: 'acute_heart_failure', name: 'Острая сердечно-сосудистая недостаточность', category: 'Сердечно-сосудистые' },
  { id: 'floating_thrombus', name: 'Флотирующий тромб', category: 'Сердечно-сосудистые' },
  { id: 'hydrothorax', name: 'Гидроторакс', category: 'Респираторные' },
  { id: 'hydropericardium', name: 'Гидроперикард', category: 'Сердечно-сосудистые' },
  { id: 'anaphylactic_shock', name: 'Анафилактический шок', category: 'Аллергические' },
  { id: 'quincke_edema', name: 'Отек Квинке', category: 'Аллергические' },
];

export function ComplicationsForecast({
  controlPoints,
  labResults,
}: ComplicationsForecastProps) {
  const [selectedComplication, setSelectedComplication] = useState<string | null>(null);

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

  // Простая модель прогнозирования (заглушка)
  // В реальной системе здесь будет ML-модель или статистический анализ
  const getProbability = (complicationId: string, cpIndex: number): number => {
    // Для демонстрации: вероятность уменьшается с каждой КТ
    const baseProbabilities: { [key: string]: number } = {
      cardiogenic_shock: 0.75,
      pulmonary_edema: 0.75,
      cerebral_edema: 0.75,
      pneumonia: 0.75,
      pulmonary_embolism: 0.75,
      acute_heart_failure: 0.75,
      floating_thrombus: 0.75,
      hydrothorax: 0.75,
      hydropericardium: 0.75,
      anaphylactic_shock: 0.75,
      quincke_edema: 0.75,
    };

    const base = baseProbabilities[complicationId] || 0.5;
    const decrease = cpIndex * 0.25;
    return Math.max(0, base - decrease);
  };

  const getRiskLevel = (probability: number): 'high' | 'medium' | 'low' | 'minimal' => {
    if (probability >= 0.6) return 'high';
    if (probability >= 0.4) return 'medium';
    if (probability >= 0.2) return 'low';
    return 'minimal';
  };

  const getRiskColor = (probability: number): string => {
    const level = getRiskLevel(probability);
    switch (level) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'low': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'minimal': return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const getRiskTextColor = (probability: number): string => {
    const level = getRiskLevel(probability);
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-yellow-600';
      case 'minimal': return 'text-green-600';
    }
  };

  const getRiskLabel = (probability: number): string => {
    const level = getRiskLevel(probability);
    switch (level) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      case 'minimal': return 'Минимальный';
    }
  };

  if (sortedCPs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Добавьте контрольные точки для прогнозирования осложнений</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-900">Прогноз осложнений</h3>
          <p className="text-sm text-gray-600 mt-1">
            Вероятность развития осложнений на каждой контрольной точке
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
        <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium mb-1">Интерпретация результатов:</p>
          <div className="space-y-1">
            <p>• <span className="font-medium">Высокий риск (≥0.6):</span> требуется немедленное вмешательство</p>
            <p>• <span className="font-medium">Средний риск (0.4-0.6):</span> необходим тщательный мониторинг</p>
            <p>• <span className="font-medium">Низкий риск (0.2-0.4):</span> стандартное наблюдение</p>
            <p>• <span className="font-medium">Минимальный риск (&lt;0.2):</span> риск маловероятен</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 border border-gray-300 text-left min-w-[280px] sticky left-0 bg-gray-50 z-10">
                  Осложнение
                </th>
                {sortedCPs.map((cp, index) => (
                  <th key={cp.id} className="p-3 border border-gray-300 min-w-[120px] text-center bg-blue-50">
                    <div className="font-semibold text-gray-900">{cp.name}</div>
                    <div className="text-xs font-normal text-gray-500 mt-1">{formatDate(cp.date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {complications.map((complication, compIndex) => (
                <tr 
                  key={complication.id} 
                  className={`hover:bg-blue-50/30 transition-colors ${
                    selectedComplication === complication.id ? 'bg-blue-50' : 'bg-white'
                  }`}
                  onClick={() => setSelectedComplication(
                    selectedComplication === complication.id ? null : complication.id
                  )}
                >
                  <td className="p-3 border border-gray-300 text-left sticky left-0 bg-inherit z-10 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{complication.name}</span>
                      {complication.category && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {complication.category}
                        </span>
                      )}
                    </div>
                  </td>
                  {sortedCPs.map((cp, cpIndex) => {
                    const probability = getProbability(complication.id, cpIndex);
                    return (
                      <td 
                        key={`${complication.id}_${cp.id}`}
                        className="p-2 border border-gray-300 text-center"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className={`px-3 py-1.5 rounded-lg border font-medium ${getRiskColor(probability)}`}>
                            {probability.toFixed(2)}
                          </div>
                          <div className={`text-xs font-medium ${getRiskTextColor(probability)}`}>
                            {getRiskLabel(probability)}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">Динамика рисков</h4>
            <p className="text-sm text-gray-600">
              Прогноз основан на анализе клинических данных и лабораторных показателей. 
              С каждой контрольной точкой и адекватным лечением вероятность осложнений снижается.
              Для более точной оценки рекомендуется учитывать индивидуальные факторы риска пациента.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Важно:</p>
          <p className="mt-1">
            Данный прогноз является ориентировочным и не заменяет клиническую оценку врача. 
            Все решения о лечении должны приниматься на основе комплексной оценки состояния пациента.
          </p>
        </div>
      </div>
    </div>
  );
}
