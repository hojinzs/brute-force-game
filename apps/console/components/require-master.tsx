'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useMasterAuth } from '@/lib/use-master-auth';

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted font-mono">Loading...</div>
    </div>
  );
}

export function RequireMaster({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { clearAuth, accessToken, user } = useAuthStore();
  const { hasHydrated, isMaster } = useMasterAuth();

  useEffect(() => {
    if (!hasHydrated || isMaster) return;
    if (accessToken || user) {
      clearAuth();
    }
    router.replace('/login');
  }, [hasHydrated, isMaster, accessToken, user, clearAuth, router]);

  if (!hasHydrated || !isMaster) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}
