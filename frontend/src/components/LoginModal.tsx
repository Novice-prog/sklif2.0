import { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { UserRole } from '../types';

type LoginModalProps = {
  onLogin: (username: string, role: UserRole, userId: string, email: string) => void;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    login: string;
    full_name: string;
    role: UserRole;
  };
};

export function LoginModal({ onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isProduction = (import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE ?? 'development').toLowerCase() === 'production';
  const allowDemoLogin = !isProduction && (import.meta.env.VITE_ENABLE_DEMO_LOGIN ?? 'false').toLowerCase() === 'true';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: email.toLowerCase().trim(),
          password,
        }),
      });

      if (!response.ok) {
        if (allowDemoLogin) {
          const demoUser = await handleDemoLogin(email, password);
          if (demoUser) {
            sessionStorage.setItem('access_token', 'demo-token');
            onLogin(demoUser.name, demoUser.role, 'demo-' + email, `${email}@demo.local`);
            return;
          }
        }
        throw new Error('Неверный email или пароль');
      }

      const data = (await response.json()) as LoginResponse;
      sessionStorage.setItem('access_token', data.access_token);
      onLogin(data.user.full_name, data.user.role, data.user.id, data.user.email);
    } catch (err: any) {
      setError(err.message || 'Ошибка входа. Проверьте учетные данные.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (username: string, pass: string) => {
    const demoAccounts = [
      { username: 'врач1', email: 'врач1', password: 'demo123', name: 'Врач 1', role: 'doctor' as UserRole },
      { username: 'врач2', email: 'врач2', password: 'demo123', name: 'Врач 2', role: 'doctor' as UserRole },
      { username: 'demo1', email: 'demo1', password: 'demo123', name: 'Демо врач', role: 'doctor' as UserRole },
      { username: 'admin', email: 'admin', password: 'admin123', name: 'Администратор', role: 'admin' as UserRole },
      { username: 'researcher', email: 'researcher', password: 'demo123', name: 'Исследователь', role: 'researcher' as UserRole },
    ];

    return demoAccounts.find(
      acc => (acc.username === username || acc.email === username) && acc.password === pass
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
          <div className="flex items-center justify-center mb-2">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-center">Smart Токсикология</h2>
          <p className="text-center text-blue-100 text-sm mt-1">
            НИИ скорой помощи им. Н.В. Склифосовского
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Email или логин
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите email или логин"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите пароль"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти в систему'}
            </button>
          </div>

          {allowDemoLogin && (
            <div className="mt-5 pt-5 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Демо учетные данные:</p>
              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex justify-between bg-gray-50 px-3 py-2 rounded">
                  <span>demo1 / demo123</span>
                  <span className="text-blue-600">Врач</span>
                </div>
                <div className="flex justify-between bg-gray-50 px-3 py-2 rounded">
                  <span>admin / admin123</span>
                  <span className="text-purple-600">Администратор</span>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="bg-gray-50 px-6 py-3 text-center">
          <p className="text-xs text-gray-500">
            © 2024 НИИ скорой помощи им. Н.В. Склифосовского
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Локальный веб-сервис для клинического анализа
          </p>
        </div>
      </div>
    </div>
  );
}


