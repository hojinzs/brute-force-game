'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: { id: string; email: string; nickname: string; role: string } | null;
  _hasHydrated: boolean;
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: { id: string; email: string; nickname: string; role: string }) => void;
  clearAuth: () => void;
  isMaster: () => boolean;
  _setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      setAuth: (tokens, user) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
      isMaster: () => get().user?.role === 'MASTER',
      _setHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'master-console-auth',
      onRehydrateStorage: () => (state) => {
        state?._setHydrated(true);
      },
    },
  ),
);
