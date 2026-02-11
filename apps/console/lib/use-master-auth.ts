'use client';

import { useAuthStore } from '@/lib/auth-store';

export function useMasterAuth() {
  const { _hasHydrated, accessToken, user } = useAuthStore();
  const isMaster = _hasHydrated && !!accessToken && !!user && user.role === 'MASTER';

  return {
    hasHydrated: _hasHydrated,
    isMaster,
    user,
  };
}
