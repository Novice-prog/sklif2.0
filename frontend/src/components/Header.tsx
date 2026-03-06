import { Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900">
              Система учета клинических исследований
            </h1>
            <p className="text-sm text-gray-600">
              НИИ скорой помощи им. Н.В. Склифосовского, отделение токсикологии
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
