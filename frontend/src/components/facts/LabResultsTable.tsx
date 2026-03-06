import { useState, useRef } from 'react';
import { Check, X, ChevronDown, ChevronRight, Trash2, Upload, Lock, FileUp } from 'lucide-react';
import type { LabResult, LabIndicator, LabGroup, ControlPoint, UserRole } from '../../types';
import * as XLSX from 'xlsx';

type LabResultsTableProps = {
  controlPoints: ControlPoint[];
  labResults: LabResult[];
  labGroups: LabGroup[];
  labIndicators: LabIndicator[];
  onAdd: (labResult: Omit<LabResult, 'id' | 'created_at'>) => void;
  onUpdate?: (id: string, labResult: Partial<LabResult>) => void;
  onDelete?: (id: string) => void;
  onOpenImport?: () => void;
  caseNumber?: string;
  diseaseName?: string;
  patientGender?: 'male' | 'female';
  userRole?: UserRole;
};

export function LabResultsTable({
  controlPoints,
  labResults,
  labGroups,
  labIndicators,
  onAdd,
  onUpdate,
  onDelete,
  onOpenImport,
  caseNumber = '',
  diseaseName = '',
  patientGender = 'male',
  userRole = 'doctor',
}: LabResultsTableProps) {
  const [editingCell, setEditingCell] = useState<{ cpId: string; indicatorId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ resultId: string; indicatorName: string; cpName: string } | null>(null);

  // Проверка прав доступа - только администратор может редактировать
  const canEdit = userRole === 'admin';

  // Сортируем КТ по дате
  const sortedCPs = [...controlPoints].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Группируем индикаторы по группам
  const groupedIndicators = labGroups
    .sort((a, b) => a.order_index - b.order_index)
    .map(group => {
      const indicators = labIndicators
        .filter(i => i.group_id === group.id)
        .sort((a, b) => a.order_index - b.order_index);
      
      // Проверяем, есть ли хотя бы одно значение в любом из индикаторов этой группы
      const hasData = indicators.some(indicator => 
        labResults.some(result => result.indicator_id === indicator.id)
      );
      
      return {
        group,
        indicators,
        hasData,
      };
    })
    .filter(g => g.indicators.length > 0);

  // Автоматически сворачиваем группы без данных при первом рендере
  const [initialized, setInitialized] = useState(false);
  if (!initialized && groupedIndicators.length > 0) {
    const groupsToCollapse = new Set<string>();
    groupedIndicators.forEach(({ group, hasData }) => {
      if (!hasData) {
        groupsToCollapse.add(group.id);
      }
    });
    if (groupsToCollapse.size > 0) {
      setCollapsedGroups(groupsToCollapse);
    }
    setInitialized(true);
  }

  // Получить результат для конкретной КТ и показателя
  const getResult = (cpId: string, indicatorId: string) => {
    return labResults.find(r => r.control_point_id === cpId && r.indicator_id === indicatorId);
  };

  // Начать редактирование
  const startEdit = (cpId: string, indicatorId: string) => {
    // Блокируем редактирование для не-админов
    if (!canEdit) return;
    
    const result = getResult(cpId, indicatorId);
    setEditingCell({ cpId, indicatorId });
    setEditValue(result?.value_numeric?.toString() || result?.value_text || '');
  };

  // Сохранить значение
  const saveValue = (cpId: string, indicatorId: string) => {
    if (!editValue.trim()) {
      setEditingCell(null);
      return;
    }

    const existingResult = getResult(cpId, indicatorId);
    const indicator = labIndicators.find(i => i.id === indicatorId);

    if (existingResult && onUpdate) {
      // Обновляем существующий
      const numValue = parseFloat(editValue.replace(',', '.'));
      onUpdate(existingResult.id, {
        value_numeric: !isNaN(numValue) && indicator?.data_type === 'numeric' ? numValue : undefined,
        value_text: isNaN(numValue) || indicator?.data_type !== 'numeric' ? editValue : undefined,
      });
    } else {
      // Создаем новый
      const numValue = parseFloat(editValue.replace(',', '.'));
      onAdd({
        control_point_id: cpId,
        indicator_id: indicatorId,
        value_numeric: !isNaN(numValue) && indicator?.data_type === 'numeric' ? numValue : undefined,
        value_text: isNaN(numValue) || indicator?.data_type !== 'numeric' ? editValue : undefined,
      });
    }

    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getRefRange = (indicator: LabIndicator) => {
    if (patientGender === 'male' && indicator.reference_range_male) {
      return indicator.reference_range_male;
    }
    if (patientGender === 'female' && indicator.reference_range_female) {
      return indicator.reference_range_female;
    }
    return indicator.reference_range;
  };

  const getValueStatus = (result: LabResult, indicator: LabIndicator): 'normal' | 'above' | 'below' => {
    const range = getRefRange(indicator);
    if (!result.value_numeric || !range || indicator.data_type !== 'numeric') {
      return 'normal';
    }
    
    // Пытаемся распарсить диапазон вида "min - max"
    const rangeMatch = range.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      
      if (result.value_numeric > max) return 'above';
      if (result.value_numeric < min) return 'below';
    }
    return 'normal';
  };

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const isGroupCollapsed = (groupId: string) => collapsedGroups.has(groupId);

  // Импорт из Excel (сохраняем старую логику импорта, где строки - это КТ)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const arrayBuffer = evt.target?.result;
      if (!arrayBuffer) return;
      
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (data.length < 2) return; // Нет данных

      const headers = data[0];
      const colMap = new Map<number, string>(); // colIndex -> indicatorId

      // Создаем карту ожидаемых заголовков
      const indicatorHeaderMap = new Map<string, string>(); // DisplayName -> IndicatorId
      labGroups.forEach(group => {
        labIndicators.filter(i => i.group_id === group.id).forEach(indicator => {
          const header = `${group.name} - ${indicator.name}${indicator.unit ? ` (${indicator.unit})` : ''}`;
          indicatorHeaderMap.set(header, indicator.id);
        });
      });

      // Сопоставляем столбцы
      headers.forEach((h, idx) => {
        if (typeof h === 'string' && indicatorHeaderMap.has(h)) {
          colMap.set(idx, indicatorHeaderMap.get(h)!);
        }
      });

      // Обрабатываем строки (КТ)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const cpNameCell = row[0];
        if (typeof cpNameCell !== 'string') continue;

        const cp = controlPoints.find(c => cpNameCell.includes(c.name));
        if (!cp) continue;

        // Обрабатываем столбцы
        colMap.forEach((indicatorId, colIdx) => {
          const cellValue = row[colIdx];
          if (cellValue === undefined || cellValue === null || cellValue === '') return;

          const indicator = labIndicators.find(ind => ind.id === indicatorId);
          if (!indicator) return;

          let numValue: number | undefined = undefined;
          let textValue: string | undefined = undefined;

          if (indicator.data_type === 'numeric') {
             const valStr = String(cellValue).replace(',', '.');
             const parsed = parseFloat(valStr);
             if (!isNaN(parsed)) {
               numValue = parsed;
             } else {
               textValue = String(cellValue);
             }
          } else {
            textValue = String(cellValue);
          }

          const existingResult = getResult(cp.id, indicatorId);
          
          if (existingResult) {
             if (onUpdate) {
               onUpdate(existingResult.id, {
                 value_numeric: numValue,
                 value_text: textValue
               });
             }
          } else {
             onAdd({
               control_point_id: cp.id,
               indicator_id: indicatorId,
               value_numeric: numValue,
               value_text: textValue
             });
          }
        });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-900">Лабораторные показатели</h3>
          <p className="text-sm text-gray-600 mt-1">
            Показатели сгруппированы по системам. Кликните на группу для скрытия/отображения.
            {!canEdit && <span className="block text-amber-600 mt-1">⚠️ Редактирование доступно только администраторам</span>}
          </p>
        </div>
        {onOpenImport && (
          <button
            onClick={onOpenImport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileUp className="w-5 h-5" />
            Импортировать из Excel
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-700 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-3 border border-gray-300 text-left min-w-[250px] sticky left-0 bg-gray-50 z-30">
                  Показатель
                </th>
                <th className="p-3 border border-gray-300 text-center w-[80px] sticky top-0 z-20 bg-gray-50">
                  Ед.
                </th>
                <th className="p-3 border border-gray-300 text-center w-[120px] sticky top-0 z-20 bg-gray-50">
                  Норма
                </th>
                {sortedCPs.map(cp => (
                  <th key={cp.id} className="p-3 border border-gray-300 min-w-[140px] text-center sticky top-0 z-20 bg-blue-50">
                    <div className="font-semibold text-gray-900">{cp.name}</div>
                    <div className="text-xs font-normal text-gray-500 mt-1">{formatDate(cp.date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedIndicators.flatMap(({ group, indicators }) => {
                const isCollapsed = isGroupCollapsed(group.id);
                const rows = [];
                
                // Заголовок группы
                rows.push(
                  <tr 
                    key={`group_${group.id}`}
                    className="bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <td 
                      colSpan={3 + sortedCPs.length} 
                      className="p-2 border border-gray-300 text-left sticky left-0 z-10 bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        <span className="font-bold text-gray-800">{group.name}</span>
                        {group.locus && (
                          <span className="text-xs text-gray-500 font-normal">
                            ({group.locus}{group.biomaterial ? ` / ${group.biomaterial}` : ''})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                
                // Строки показателей (если не свернуто)
                if (!isCollapsed) {
                  indicators.forEach(indicator => {
                    rows.push(
                      <tr key={indicator.id} className="hover:bg-blue-50/30 transition-colors bg-white">
                        <td className="p-2 border border-gray-300 text-left sticky left-0 bg-inherit z-10">
                          <span className="text-gray-900">{indicator.name}</span>
                        </td>
                        <td className="p-2 border border-gray-300 text-center text-gray-500 text-xs">
                          {indicator.unit || '—'}
                        </td>
                        <td className="p-2 border border-gray-300 text-center text-gray-500 text-xs whitespace-pre-wrap">
                          {getRefRange(indicator) || '—'}
                        </td>
                        {sortedCPs.map(cp => {
                          const result = getResult(cp.id, indicator.id);
                          const isEditing = editingCell?.cpId === cp.id && editingCell?.indicatorId === indicator.id;
                          const valueStatus = result ? getValueStatus(result, indicator) : 'normal';

                          return (
                            <td 
                              key={`${cp.id}_${indicator.id}`} 
                              className="p-0 border border-gray-300 text-center relative group/cell h-[40px]"
                            >
                              {isEditing ? (
                                <div className="absolute inset-0 z-20 flex flex-col bg-white shadow-lg border-2 border-blue-500 rounded p-1 min-w-[120px] -ml-[1px] -mt-[1px]">
                                  {indicator.data_type === 'select' && indicator.options ? (
                                    <select
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={() => saveValue(cp.id, indicator.id)}
                                      autoFocus
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none mb-1"
                                    >
                                      <option value="">-</option>
                                      {indicator.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (indicator.data_type === 'numeric') {
                                          if (value === '' || /^-?\d*[.,]?\d*$/.test(value)) {
                                            setEditValue(value.replace('.', ',')); // Отображаем с запятой
                                          }
                                        } else {
                                          setEditValue(value);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveValue(cp.id, indicator.id);
                                        if (e.key === 'Escape') cancelEdit();
                                      }}
                                      autoFocus
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none mb-1"
                                    />
                                  )}
                                  <div className="flex gap-1 justify-end">
                                    <button onClick={() => saveValue(cp.id, indicator.id)} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button onClick={cancelEdit} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className={`w-full h-full flex items-center justify-center ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                  onClick={() => canEdit && startEdit(cp.id, indicator.id)}
                                  title={!canEdit ? 'Редактирование доступно только администраторам' : ''}
                                >
                                  {result ? (
                                    <span className={`
                                      font-medium
                                      ${valueStatus === 'above' ? 'text-red-600' : ''}
                                      ${valueStatus === 'below' ? 'text-blue-600' : ''}
                                      ${valueStatus === 'normal' ? 'text-gray-900' : ''}
                                    `}>
                                      {result.value_numeric !== undefined ? result.value_numeric : result.value_text}
                                    </span>
                                  ) : (
                                    <>
                                      {canEdit ? (
                                        <span className="opacity-0 group-hover/cell:opacity-100 text-gray-300 text-lg select-none">+</span>
                                      ) : (
                                        <Lock className="w-3 h-3 text-gray-300 opacity-0 group-hover/cell:opacity-50" />
                                      )}
                                    </>
                                  )}
                                  
                                  {result && onDelete && canEdit && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm({ resultId: result.id, indicatorName: indicator.name, cpName: cp.name });
                                      }}
                                      className="absolute top-1 right-1 p-1 opacity-0 group-hover/cell:opacity-100 transition-opacity bg-white/80 hover:bg-red-50 rounded text-red-500"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
                }
                
                return rows;
              })}
            </tbody>
          </table>
          
          {sortedCPs.length === 0 && (
            <div className="p-8 text-center text-gray-500 bg-gray-50 border-t border-gray-200">
              <p>Нет контрольных точек для отображения столбцов</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
        <div className="mt-0.5">ℹ️</div>
        <div>
          <p>Контрольные точки отображаются в столбцах сверху, показатели — в строках слева.</p>
          <p>Значения выше нормы выделены красным, ниже нормы — синим.</p>
          {!canEdit && (
            <p className="mt-2 text-amber-700 font-medium">
              🔒 Редактирование лабораторных показателей доступно только администраторам системы.
            </p>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить значение?</h3>
            <p className="text-gray-600 mb-6">
              Вы действительно хотите удалить значение показателя <strong>{deleteConfirm.indicatorName}</strong> для <strong>{deleteConfirm.cpName}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (onDelete) onDelete(deleteConfirm.resultId);
                  setDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}