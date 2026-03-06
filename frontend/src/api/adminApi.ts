import type { UserRole } from '../types';
import { HttpClient } from './httpClient';

export type AdminUser = {
  id: string;
  email: string;
  login: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export type NewUserCredentials = {
  email: string;
  login: string;
  password: string;
};

export type CreateAdminUserPayload = {
  full_name: string;
  email: string;
  role: UserRole;
  login?: string;
};

export type UpdateAdminUserPayload = {
  full_name?: string;
  email?: string;
  role?: UserRole;
};

export interface AdminApi {
  listUsers(): Promise<AdminUser[]>;
  createUser(payload: CreateAdminUserPayload): Promise<NewUserCredentials>;
  updateUser(userId: string, payload: UpdateAdminUserPayload): Promise<AdminUser>;
  deactivateUser(userId: string): Promise<void>;
  resetPassword(userId: string): Promise<NewUserCredentials>;
}

class HttpAdminApi implements AdminApi {
  constructor(private readonly http: HttpClient) {}

  async listUsers(): Promise<AdminUser[]> {
    const data = await this.http.get<{ users: AdminUser[] }>('/api/v1/users');
    return data.users;
  }

  async createUser(payload: CreateAdminUserPayload): Promise<NewUserCredentials> {
    const data = await this.http.post<{ credentials: NewUserCredentials }>('/api/v1/users', payload);
    return data.credentials;
  }

  updateUser(userId: string, payload: UpdateAdminUserPayload): Promise<AdminUser> {
    return this.http.patch<AdminUser>(`/api/v1/users/${userId}`, payload);
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.http.post<void>(`/api/v1/users/${userId}/deactivate`);
  }

  async resetPassword(userId: string): Promise<NewUserCredentials> {
    const data = await this.http.post<{ credentials: NewUserCredentials }>(`/api/v1/users/${userId}/reset-password`);
    return data.credentials;
  }
}

export const createAdminApi = (): AdminApi => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const http = new HttpClient({
    baseUrl,
    getAccessToken: () => sessionStorage.getItem('access_token'),
  });
  return new HttpAdminApi(http);
};

