import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Mail, Key, Shield, Copy, Check } from 'lucide-react';
import type { User, UserRole } from '../types';
import { createAdminApi, type NewUserCredentials } from '../api/adminApi';
import { ApiError } from '../api/httpClient';

const roleLabels: Record<UserRole, string> = {
  admin: 'Администратор системы',
  doctor: 'Лечащий врач',
  junior_researcher: 'Младший научный сотрудник',
  researcher: 'Научный сотрудник',
  senior_researcher: 'Старший научный сотрудник',
  lead_researcher: 'Ведущий научный сотрудник',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800 border-purple-300',
  doctor: 'bg-blue-100 text-blue-800 border-blue-300',
  junior_researcher: 'bg-green-100 text-green-800 border-green-300',
  researcher: 'bg-teal-100 text-teal-800 border-teal-300',
  senior_researcher: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  lead_researcher: 'bg-orange-100 text-orange-800 border-orange-300',
};

const adminApi = createAdminApi();

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [credentials, setCredentials] = useState<NewUserCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string } | null>(null);

  const extractErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) {
      const detail = (err.payload as { detail?: string } | undefined)?.detail;
      if (detail) return detail;
    }
    return fallback;
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await adminApi.listUsers();
      setUsers(items);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(extractErrorMessage(err, 'Не удалось загрузить список пользователей'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminApi.deactivateUser(userId);
      await loadUsers();
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deactivating user:', err);
      alert(extractErrorMessage(err, 'Не удалось деактивировать пользователя'));
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Сбросить пароль для ${userEmail}?`)) {
      return;
    }

    try {
      const creds = await adminApi.resetPassword(userId);
      setCredentials(creds);
    } catch (err) {
      console.error('Error resetting password:', err);
      alert(extractErrorMessage(err, 'Не удалось сбросить пароль'));
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-gray-900">
            <Shield className="w-8 h-8 text-purple-600" />
            Панель администратора
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Управление пользователями и правами доступа системы
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Добавить пользователя
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Всего пользователей</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{users.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Администраторов</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {users.filter(u => u.role === 'admin').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Врачей</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {users.filter(u => u.role === 'doctor').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Научных сотрудников</div>
          <div className="text-2xl font-bold text-teal-600 mt-1">
            {users.filter(u => u.role !== 'admin' && u.role !== 'doctor').length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p>Пользователи не найдены</p>
                    <p className="text-sm mt-1">Добавьте первого пользователя системы</p>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-medium">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResetPassword(user.id, user.email)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Сбросить пароль"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setUserToDelete({ id: user.id, name: user.full_name, email: user.email })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Деактивировать пользователя"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <AddUserModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(creds) => {
            setCredentials(creds);
            void loadUsers();
            setIsAddModalOpen(false);
          }}
        />
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Деактивировать пользователя?</h3>
                <p className="text-sm text-gray-600">Пользователь потеряет доступ к системе</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm font-medium text-gray-900 mb-1">{userToDelete.name}</div>
              <div className="text-sm text-gray-600">{userToDelete.email}</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Деактивировать
              </button>
            </div>
          </div>
        </div>
      )}

      {credentials && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Пользователь создан</h3>
                <p className="text-sm text-gray-600">Учетные данные для входа</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Email</div>
                    <div className="text-sm font-mono text-gray-900">{credentials.email}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.email, 'email')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Логин</div>
                    <div className="text-sm font-mono text-gray-900">{credentials.login}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.login, 'login')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                  >
                    {copiedField === 'login' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-yellow-700 mb-1 font-medium">Пароль (одноразово)</div>
                    <div className="text-sm font-mono text-gray-900">{credentials.password}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.password, 'password')}
                    className="p-2 hover:bg-yellow-100 rounded transition-colors"
                  >
                    {copiedField === 'password' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-yellow-700" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm text-blue-800">
              <Mail className="w-4 h-4 inline mr-2" />
              В продакшн-версии учетные данные будут отправлены на email автоматически
            </div>

            <button
              onClick={() => setCredentials(null)}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (credentials: NewUserCredentials) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('doctor');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim()) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      const credentials = await adminApi.createUser({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
      });
      onSuccess(credentials);
    } catch (err: any) {
      console.error('Error creating user:', err);
      if (err instanceof ApiError) {
        const detail = (err.payload as { detail?: string } | undefined)?.detail;
        setError(detail || 'Не удалось создать пользователя');
      } else {
        setError('Не удалось создать пользователя');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Добавить пользователя</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ФИО <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Иванов Иван Иванович"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="ivanov@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Роль <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="doctor">Лечащий врач</option>
              <option value="junior_researcher">Младший научный сотрудник</option>
              <option value="researcher">Научный сотрудник</option>
              <option value="senior_researcher">Старший научный сотрудник</option>
              <option value="lead_researcher">Ведущий научный сотрудник</option>
              <option value="admin">Администратор системы</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Создание...' : 'Создать пользователя'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
