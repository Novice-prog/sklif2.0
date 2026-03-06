import { History, FileSpreadsheet, Plus, Edit, Trash2, User, Clock } from 'lucide-react';
import type { LabResultChangeLog, LabIndicator, LabGroup } from '../../types';

type LabResultsChangeHistoryProps = {
  labResultChangeLogs: LabResultChangeLog[];
  labIndicators: LabIndicator[];
  labGroups: LabGroup[];
};

export function LabResultsChangeHistory({
  labResultChangeLogs,
  labIndicators,
  labGroups,
}: LabResultsChangeHistoryProps) {
  // Сортируем по дате (новые сверху)
  const sortedLogs = [...labResultChangeLogs].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  // Получаем иконку и цвет для типа изменения
  const getChangeTypeInfo = (changeType: LabResultChangeLog['change_type']) => {
    switch (changeType) {
      case 'import':
        return {
          icon: FileSpreadsheet,
          label: 'Импорт из Excel',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'manual_add':
        return {
          icon: Plus,
          label: 'Ручное добавление',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'manual_edit':
        return {
          icon: Edit,
          label: 'Редактирование',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
        };
      case 'manual_delete':
        return {
          icon: Trash2,
          label: 'Удаление',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
    }
  };

  // Получаем название роли на русском
  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Администратор',
      doctor: 'Лечащий врач',
      junior_researcher: 'Младший научный сотрудник',
      researcher: 'Научный сотрудник',
      senior_researcher: 'Старший научный сотрудник',
      lead_researcher: 'Ведущий научный сотрудник',
    };
    return roleNames[role] || role;
  };

  // Форматирование даты и времени
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatted = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { date: dateFormatted, time: timeFormatted };
  };

  // Получить названия показателей по их ID
  const getIndicatorNames = (indicatorIds?: string[]) => {
    if (!indicatorIds || indicatorIds.length === 0) return null;
    return indicatorIds
      .map(id => labIndicators.find(ind => ind.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  if (sortedLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">История изменений пуста</p>
        <p className="text-sm text-gray-400 mt-1">
          Все изменения лабораторных данных будут отображаться здесь
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <History className="w-5 h-5 text-gray-600" />
        <h4 className="text-gray-900">История изменений</h4>
        <span className="text-sm text-gray-500">
          ({sortedLogs.length} {sortedLogs.length === 1 ? 'запись' : 'записей'})
        </span>
      </div>

      <div className="space-y-3">
        {sortedLogs.map((log) => {
          const typeInfo = getChangeTypeInfo(log.change_type);
          const Icon = typeInfo.icon;
          const { date, time } = formatDateTime(log.changed_at);
          const indicatorNames = getIndicatorNames(log.indicator_ids);

          return (
            <div
              key={log.id}
              className={`border rounded-lg p-4 ${typeInfo.borderColor} ${typeInfo.bgColor}`}
            >
              <div className="flex items-start gap-3">
                {/* Иконка типа изменения */}
                <div className={`p-2 rounded-lg ${typeInfo.bgColor} ${typeInfo.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Информация об изменении */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h5 className={`font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </h5>
                      {log.affected_count !== undefined && (
                        <p className="text-sm text-gray-600 mt-0.5">
                          Изменено записей: <span className="font-semibold">{log.affected_count}</span>
                        </p>
                      )}
                    </div>
                    
                    {/* Дата и время */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                      <Clock className="w-4 h-4" />
                      <div className="text-right">
                        <div>{date}</div>
                        <div className="text-xs">{time}</div>
                      </div>
                    </div>
                  </div>

                  {/* Детали изменения */}
                  {log.details && (
                    <p className="text-sm text-gray-700 mb-2 bg-white/50 px-3 py-2 rounded border border-gray-200">
                      {log.details}
                    </p>
                  )}

                  {/* Затронутые показатели */}
                  {indicatorNames && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Показатели:</span> {indicatorNames}
                    </div>
                  )}

                  {/* Информация о пользователе */}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">
                      {log.changed_by_user_name}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">
                      {getRoleName(log.changed_by_user_role)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Легенда */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Типы изменений:</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {(['import', 'manual_add', 'manual_edit', 'manual_delete'] as const).map((type) => {
            const info = getChangeTypeInfo(type);
            const Icon = info.icon;
            return (
              <div key={type} className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${info.bgColor}`}>
                  <Icon className={`w-3.5 h-3.5 ${info.color}`} />
                </div>
                <span className="text-gray-600">{info.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}