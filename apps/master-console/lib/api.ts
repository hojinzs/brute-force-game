import axios from 'axios';
import { useAuthStore } from './auth-store';
import type { BlocksResponse, BlockDetail, UsersResponse, UserDetail, UserStats } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post(`${API_BASE}/users/refresh`, { refreshToken });
          useAuthStore.getState().setAuth(
            { accessToken: data.tokens.accessToken, refreshToken: data.tokens.refreshToken },
            useAuthStore.getState().user!,
          );
          error.config.headers.Authorization = `Bearer ${data.tokens.accessToken}`;
          return api(error.config);
        } catch {
          useAuthStore.getState().clearAuth();
        }
      } else {
        useAuthStore.getState().clearAuth();
      }
    }
    return Promise.reject(error);
  },
);

// Auth
export async function login(email: string, password: string) {
  const { data } = await api.post('/users/login', { email, password });
  return data;
}

// Admin Blocks
export async function getAdminBlocks(page = 1, limit = 20): Promise<BlocksResponse> {
  const { data } = await api.get('/admin/blocks', { params: { page, limit } });
  return data;
}

export async function getAdminBlock(id: number): Promise<BlockDetail> {
  const { data } = await api.get(`/admin/blocks/${id}`);
  return data;
}

export async function forceTransition(
  id: number,
  body: { targetStatus: string; hint?: string; password?: string; reason?: string },
) {
  const { data } = await api.post(`/admin/blocks/${id}/force-transition`, body);
  return data;
}

export async function regeneratePassword(id: number) {
  const { data } = await api.post(`/admin/blocks/${id}/regenerate-password`);
  return data;
}

// Admin Users
export async function getAdminUsers(page = 1, limit = 20, search?: string, role?: string): Promise<UsersResponse> {
  const { data } = await api.get('/admin/users', { params: { page, limit, search, role } });
  return data;
}

export async function getAdminUserStats(): Promise<UserStats> {
  const { data } = await api.get('/admin/users/stats');
  return data;
}

export async function getAdminUser(id: string): Promise<UserDetail> {
  const { data } = await api.get(`/admin/users/${id}`);
  return data;
}

export async function updateUserRole(id: string, role: string) {
  const { data } = await api.put(`/admin/users/${id}/role`, { role });
  return data;
}

export async function resetUserCp(id: string) {
  const { data } = await api.post(`/admin/users/${id}/reset-cp`);
  return data;
}

export { api, API_BASE };
