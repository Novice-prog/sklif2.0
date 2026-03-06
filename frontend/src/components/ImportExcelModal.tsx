import { useState, useRef } from 'react';
import { FileUp, X, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { ControlPoint, LabIndicator } from '../types';

type ImportExcelModalProps = {
  controlPoints: ControlPoint[];
  labIndicators: LabIndicator[];
  onClose: () => void;
  onImport?: (controlPointId: string, data: Array<{ indicatorId: string; value: number }>) => void;
};

type ParsedResult = {
  indicatorId: string;
  indicatorName: string;
  value: number;
  status: 'success' | 'warning' | 'error';
  message?: string;
};

export function ImportExcelModal({
  controlPoints,
  labIndicators,
  onClose,
  onImport,
}: ImportExcelModalProps) {
  const [selectedControlPoint, setSelectedControlPoint] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'preview'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Сортируем контрольные точки по дате
  const sortedControlPoints = [...controlPoints].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    try {
      const data = await readExcelFile(selectedFile);
      setParsedData(data);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Не удалось прочитать файл');
      setParsedData([]);
    }
  };

  const readExcelFile = async (file: File): Promise<ParsedResult[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Берем первый лист
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Конвертируем в JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length < 2) {
            reject(new Error('Файл не содержит данных'));
            return;
          }

          const results: ParsedResult[] = [];
          
          // Предполагаем, что первая строка - заголовки
          // Структура: [Показатель, Значение] или [Код, Показатель, Значение]
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 2) continue;

            let indicatorName: string;
            let value: number;

            // Пытаемся определить формат
            if (row.length >= 3 && typeof row[0] === 'string') {
              // Формат: [Код, Показатель, Значение]
              indicatorName = String(row[1] || '').trim();
              value = parseFloat(String(row[2] || '').replace(',', '.'));
            } else {
              // Формат: [Показатель, Значение]
              indicatorName = String(row[0] || '').trim();
              value = parseFloat(String(row[1] || '').replace(',', '.'));
            }

            if (!indicatorName) continue;

            // Ищем показатель по названию
            const indicator = labIndicators.find(ind => 
              ind.name.toLowerCase().includes(indicatorName.toLowerCase()) ||
              indicatorName.toLowerCase().includes(ind.name.toLowerCase())
            );

            if (indicator) {
              if (isNaN(value)) {
                results.push({
                  indicatorId: indicator.id,
                  indicatorName: indicator.name,
                  value: 0,
                  status: 'error',
                  message: 'Некорректное значение',
                });
              } else {
                results.push({
                  indicatorId: indicator.id,
                  indicatorName: indicator.name,
                  value,
                  status: 'success',
                });
              }
            } else {
              results.push({
                indicatorId: '',
                indicatorName,
                value: isNaN(value) ? 0 : value,
                status: 'warning',
                message: 'Показатель не найден в системе',
              });
            }
          }

          if (results.length === 0) {
            reject(new Error('Не удалось распознать данные в файле'));
            return;
          }

          resolve(results);
        } catch (err: any) {
          reject(new Error('Ошибка при чтении файла: ' + err.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Не удалось прочитать файл'));
      };

      reader.readAsBinaryString(file);
    });
  };

  const handleImport = () => {
    if (!selectedControlPoint || !onImport) return;

    const dataToImport = parsedData
      .filter(item => item.status === 'success' && item.indicatorId)
      .map(item => ({
        indicatorId: item.indicatorId,
        value: item.value,
      }));

    if (dataToImport.length === 0) {
      setError('Нет данных для импорта');
      return;
    }

    onImport(selectedControlPoint, dataToImport);
    onClose();
  };

  const successCount = parsedData.filter(item => item.status === 'success').length;
  const warningCount = parsedData.filter(item => item.status === 'warning').length;
  const errorCount = parsedData.filter(item => item.status === 'error').length;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <FileUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Импорт из Excel</h3>
              <p className="text-sm text-gray-600">
                {step === 'select' ? 'Выберите контрольную точку и файл' : 'Предварительный просмотр данных'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select' && (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Контрольная точка <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedControlPoint}
                  onChange={(e) => setSelectedControlPoint(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Выберите контрольную точку</option>
                  {sortedControlPoints.map(cp => (
                    <option key={cp.id} value={cp.id}>
                      {cp.name} - {new Date(cp.date).toLocaleDateString('ru-RU')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Файл Excel <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedControlPoint}
                  className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">
                    {file ? file.name : 'Нажмите для выбора файла'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Форматы: .xlsx, .xls
                  </div>
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Формат файла:</h4>
                <div className="text-xs text-blue-800 space-y-1">
                  <p>• Первая строка - заголовки (будет пропущена)</p>
                  <p>• Формат 1: [Показатель, Значение]</p>
                  <p>• Формат 2: [Код, Показатель, Значение]</p>
                  <p>• Десятичный разделитель: точка или запятая</p>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Статистика */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-xs text-green-700 mb-1">Успешно</div>
                  <div className="text-2xl font-bold text-green-900">{successCount}</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-xs text-yellow-700 mb-1">Предупреждения</div>
                  <div className="text-2xl font-bold text-yellow-900">{warningCount}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-xs text-red-700 mb-1">Ошибки</div>
                  <div className="text-2xl font-bold text-red-900">{errorCount}</div>
                </div>
              </div>

              {/* Таблица данных */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Статус
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Показатель
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Значение
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Сообщение
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {item.status === 'success' && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            {item.status === 'warning' && (
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            )}
                            {item.status === 'error' && (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.indicatorName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                            {item.value}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {item.message || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {warningCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Показатели с предупреждениями не будут импортированы
                </div>
              )}
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              if (step === 'preview') {
                setStep('select');
                setParsedData([]);
                setFile(null);
                setError(null);
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {step === 'preview' ? 'Назад' : 'Отмена'}
          </button>
          
          {step === 'preview' && (
            <button
              onClick={handleImport}
              disabled={successCount === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Импортировать ({successCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
