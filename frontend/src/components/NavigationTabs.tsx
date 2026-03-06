import { FileText, TrendingUp, Database } from 'lucide-react';

type Tab = 'cases' | 'analysis' | 'data-exchange';

interface NavigationTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
  const tabs = [
    {
      id: 'cases' as Tab,
      label: 'Истории болезни',
      icon: FileText,
      description: 'Управление пациентами и данными'
    },
    {
      id: 'analysis' as Tab,
      label: 'Анализ данных',
      icon: TrendingUp,
      description: 'Индивидуальный и групповой анализ'
    },
    {
      id: 'data-exchange' as Tab,
      label: 'Импорт/Экспорт',
      icon: Database,
      description: 'Загрузка и выгрузка данных'
    }
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex gap-2" aria-label="Основная навигация">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 transition-colors
                  ${isActive 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm">{tab.label}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
