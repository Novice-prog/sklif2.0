import { useState } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Info, FileJson } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import type { MedicalCase, Disease, ControlPoint, LabResult, DiagnosisRecord } from '../types';

interface ExportImportViewProps {
  medicalCases: MedicalCase[];
  diseases: Disease[];
  controlPoints: ControlPoint[];
  labResults: LabResult[];
  diagnosisRecords: DiagnosisRecord[];
  onImport: (data: {
    medicalCases?: MedicalCase[];
    diseases?: Disease[];
    controlPoints?: ControlPoint[];
    labResults?: LabResult[];
    diagnosisRecords?: DiagnosisRecord[];
  }) => void;
}

export function ExportImportView({
  medicalCases,
  diseases,
  controlPoints,
  labResults,
  diagnosisRecords,
  onImport
}: ExportImportViewProps) {
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  // Экспорт в CSV
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const value = row[h] ?? '';
        // Экранируем запятые и кавычки
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // Экспорт всех данных в JSON
  const handleExportJSON = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {
          medicalCases,
          diseases,
          controlPoints,
          labResults,
          diagnosisRecords
        }
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sklifosovsky_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      setImportStatus({
        type: 'success',
        message: 'Данные успешно экспортированы в JSON файл'
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Ошибка при экспорте: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      });
    }
  };

  // Экспорт в CSV (несколько файлов)
  const handleExportCSV = () => {
    try {
      const dateStr = new Date().toISOString().split('T')[0];

      // 1. Истории болезни
      exportToCSV(
        medicalCases.map(mc => ({
          'ID': mc.id,
          'Номер истории': mc.case_number,
          'Код пациента': mc.patient_code,
          'Дата поступления': mc.admission_date,
          'Дата выписки': mc.discharge_date || '',
          'Статус': mc.status,
          'Примечания': mc.notes || '',
          'Дата создания': mc.created_at
        })),
        `medical_cases_${dateStr}.csv`,
        ['ID', 'Номер истории', 'Код пациента', 'Дата поступления', 'Дата выписки', 'Статус', 'Примечания', 'Дата создания']
      );

      // 2. Диагнозы
      setTimeout(() => {
        exportToCSV(
          diseases.map(d => ({
            'ID': d.id,
            'ID истории': d.medical_case_id,
            'Диагноз': d.disease_name,
            'Код МКБ-10': d.diagnosis_code || '',
            'Дата диагноза': d.diagnosis_date,
            'Примечания': d.notes || '',
            'Дата создания': d.created_at
          })),
          `diseases_${dateStr}.csv`,
          ['ID', 'ID истории', 'Диагноз', 'Код МКБ-10', 'Дата диагноза', 'Примечания', 'Дата создания']
        );
      }, 100);

      // 3. Контрольные точки
      setTimeout(() => {
        exportToCSV(
          controlPoints.map(cp => ({
            'ID': cp.id,
            'ID диагноза': cp.disease_id,
            'Название': cp.name,
            'Дата': cp.date,
            'Примечания': cp.notes || '',
            'Дата создания': cp.created_at
          })),
          `control_points_${dateStr}.csv`,
          ['ID', 'ID диагноза', 'Название', 'Дата', 'Примечания', 'Дата создания']
        );
      }, 200);

      // 4. Лабораторные результаты
      setTimeout(() => {
        exportToCSV(
          labResults.map(lr => ({
            'ID': lr.id,
            'ID контрольной точки': lr.control_point_id,
            'ID показателя': lr.indicator_id,
            'Числовое значение': lr.value_numeric ?? '',
            'Текстовое значение': lr.value_text || '',
            'Примечание': lr.note || '',
            'Дата создания': lr.created_at
          })),
          `lab_results_${dateStr}.csv`,
          ['ID', 'ID контрольной точки', 'ID показателя', 'Числовое значение', 'Текстовое значение', 'Примечание', 'Дата создания']
        );
      }, 300);

      // 5. Диагностические записи
      setTimeout(() => {
        exportToCSV(
          diagnosisRecords.map(dr => ({
            'ID': dr.id,
            'ID контрольной точки': dr.control_point_id,
            'Тип диагноза': dr.diagnosis_type,
            'Диагноз': dr.diagnosis,
            'Лечение': dr.treatment || '',
            'Тяжесть': dr.severity || '',
            'Динамика': dr.dynamics || '',
            'Примечания': dr.notes || '',
            'Дата создания': dr.created_at
          })),
          `diagnosis_records_${dateStr}.csv`,
          ['ID', 'ID контрольной точки', 'Тип диагноза', 'Диагноз', 'Лечение', 'Тяжесть', 'Динамика', 'Примечания', 'Дата создания']
        );
      }, 400);

      setImportStatus({
        type: 'success',
        message: 'Данные успешно экспортированы в 5 CSV файлов'
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Ошибка при экспорте: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      });
    }
  };

  // Экспорт сводной таблицы
  const handleExportAnalysis = () => {
    try {
      const analysisData: any[] = [];

      medicalCases.forEach(mc => {
        const caseDiseases = diseases.filter(d => d.medical_case_id === mc.id);
        
        caseDiseases.forEach(disease => {
          const diseaseCPs = controlPoints.filter(cp => cp.disease_id === disease.id);
          
          diseaseCPs.forEach(cp => {
            const cpLabResults = labResults.filter(lr => lr.control_point_id === cp.id);
            const cpDiagRecords = diagnosisRecords.filter(dr => dr.control_point_id === cp.id);
            
            const primaryDiag = cpDiagRecords.find(dr => dr.diagnosis_type === 'primary');
            
            analysisData.push({
              'Номер истории': mc.case_number,
              'Код пациента': mc.patient_code,
              'Дата поступления': mc.admission_date,
              'Диагноз': disease.disease_name,
              'Код МКБ-10': disease.diagnosis_code || '',
              'Контрольная точка': cp.name,
              'Дата КТ': cp.date,
              'Количество анализов': cpLabResults.length,
              'Основной диагноз': primaryDiag?.diagnosis || '',
              'Лечение': primaryDiag?.treatment || '',
              'Тяжесть': primaryDiag?.severity || ''
            });
          });
        });
      });

      exportToCSV(
        analysisData,
        `analysis_summary_${new Date().toISOString().split('T')[0]}.csv`,
        ['Номер истории', 'Код пациента', 'Дата поступления', 'Диагноз', 'Код МКБ-10', 'Контрольная точка', 'Дата КТ', 'Количество анализов', 'Основной диагноз', 'Лечение', 'Тяжесть']
      );

      setImportStatus({
        type: 'success',
        message: 'Сводная таблица успешно экспортирована в CSV'
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Ошибка при экспорте: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      });
    }
  };

  // Импорт данных из JSON
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Проверяем структуру данных
        if (!importedData.data) {
          throw new Error('Неверный формат файла');
        }

        onImport(importedData.data);

        const types = Object.keys(importedData.data).filter(key => importedData.data[key]?.length > 0);
        setImportStatus({
          type: 'success',
          message: `Данные успешно импортированы! Загружено ${types.length} типов данных из файла ${file.name}`
        });
      } catch (error) {
        setImportStatus({
          type: 'error',
          message: `Ошибка при импорте: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
        });
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-2">Импорт и экспорт данных</h2>
        <p className="text-sm text-gray-600">
          Загрузка и выгрузка клинических данных для обмена с другими системами
        </p>
      </div>

      {importStatus.type && (
        <Alert variant={importStatus.type === 'error' ? 'destructive' : 'default'}>
          {importStatus.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
          {importStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {importStatus.type === 'info' && <Info className="h-4 w-4" />}
          <AlertDescription>{importStatus.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Экспорт данных */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Экспорт данных
            </CardTitle>
            <CardDescription>
              Выгрузка данных из системы в формат CSV или JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button 
                onClick={handleExportJSON}
                className="w-full"
                variant="outline"
              >
                <FileJson className="w-4 h-4 mr-2" />
                Экспортировать в JSON
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Выгружает все данные в один JSON файл со всеми связями
              </p>
            </div>

            <div>
              <Button 
                onClick={handleExportCSV}
                className="w-full"
                variant="outline"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Экспортировать в CSV
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Выгружает данные в 5 отдельных CSV файлов (для Excel)
              </p>
            </div>

            <div>
              <Button 
                onClick={handleExportAnalysis}
                className="w-full"
                variant="outline"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Экспортировать сводную таблицу
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Создает сводную таблицу CSV для статистического анализа
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-600">
                <strong>Текущие данные:</strong>
              </p>
              <ul className="text-xs text-gray-600 mt-2 space-y-1">
                <li>• Историй болезни: {medicalCases.length}</li>
                <li>• Диагнозов: {diseases.length}</li>
                <li>• Контрольных точек: {controlPoints.length}</li>
                <li>• Лабораторных результатов: {labResults.length}</li>
                <li>• Диагностических записей: {diagnosisRecords.length}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Импорт данных */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Импорт данных
            </CardTitle>
            <CardDescription>
              Загрузка данных из JSON файла в систему
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="file-upload">
                <Button 
                  className="w-full"
                  variant="outline"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Выбрать JSON файл для импорта
                  </span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                Поддерживаемые форматы: .json
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Формат файла:</strong> JSON файл должен содержать данные, экспортированные из этой системы.
                Используйте функцию "Экспортировать в JSON" для создания совместимого файла.
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Внимание:</strong> При импорте существующие записи с совпадающими ID будут заменены. 
                Рекомендуется предварительно создать резервную копию данных.
              </AlertDescription>
            </Alert>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-600">
                <strong>Рекомендации:</strong>
              </p>
              <ul className="text-xs text-gray-600 mt-2 space-y-1">
                <li>• Используйте JSON для точного переноса данных</li>
                <li>• CSV файлы можно открыть в Excel</li>
                <li>• Проверяйте корректность данных перед импортом</li>
                <li>• Создавайте резервные копии регулярно</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Дополнительная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Работа с CSV файлами в Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Открытие CSV в Excel:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Откройте Excel</li>
              <li>Перейдите в Файл → Открыть</li>
              <li>Выберите CSV файл</li>
              <li>При необходимости настройте кодировку (UTF-8)</li>
              <li>Сохраните как .xlsx для сохранения форматирования</li>
            </ol>
            <p className="mt-3">
              <strong>Структура данных:</strong> История болезни → Диагноз → Контрольная точка → Лабораторные данные / Диагностические записи
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
