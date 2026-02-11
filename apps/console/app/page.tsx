'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMasterAuth } from '@/lib/use-master-auth';

export default function Home() {
  const router = useRouter();
  const { hasHydrated, isMaster } = useMasterAuth();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isMaster) {
      router.replace('/login');
    } else {
      router.replace('/dashboard');
    }
  }, [hasHydrated, isMaster, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted font-mono">Loading...</div>
    </div>
  );
}
