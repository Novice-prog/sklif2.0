import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, Settings, Mail } from 'lucide-react';
import type { UserRole } from '../types';
import { UserSettingsModal } from './UserSettingsModal';

type UserProfileProps = {
  userName: string;
  userRole: UserRole;
  userEmail: string;
  onLogout: () => void;
  onUpdateSettings?: (settings: any) => void;
};

const roleNames: Record<UserRole, string> = {
  admin: 'Администратор системы',
  doctor: 'Лечащий врач',
  junior_researcher: 'Младший научный сотрудник',
  researcher: 'Научный сотрудник',
  senior_researcher: 'Старший научный сотрудник',
  lead_researcher: 'Ведущий научный сотрудник',
};

export function UserProfile({ userName, userRole, userEmail, onLogout, onUpdateSettings }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Кнопка профиля */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-center">
          <span className="leading-none">{userName.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">{userName}</span>
          <span className="text-xs text-gray-500">{roleNames[userRole]}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Информация о пользователе */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-lg">
                <span className="leading-none">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{roleNames[userRole]}</p>
              </div>
            </div>
          </div>

          {/* Пункты меню */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowSettings(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Настройки</span>
            </button>
          </div>

          {/* Разделитель */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* Выход */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Выход</span>
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно настроек */}
      {showSettings && (
        <UserSettingsModal
          userName={userName}
          userRole={userRole}
          userEmail={userEmail}
          onClose={() => setShowSettings(false)}
          onSave={(settings) => {
            if (onUpdateSettings) {
              onUpdateSettings(settings);
            }
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}