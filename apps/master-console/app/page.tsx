'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function Home() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace('/login');
    } else if (user.role !== 'MASTER') {
      router.replace('/login');
    } else {
      router.replace('/dashboard');
    }
  }, [accessToken, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted font-mono">Loading...</div>
    </div>
  );
}
