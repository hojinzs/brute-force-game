'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: { id: string; email: string; nickname: string; role: string } | null;
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: { id: string; email: string; nickname: string; role: string }) => void;
  clearAuth: () => void;
  isMaster: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (tokens, user) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
      isMaster: () => get().user?.role === 'MASTER',
    }),
    { name: 'master-console-auth' },
  ),
);
