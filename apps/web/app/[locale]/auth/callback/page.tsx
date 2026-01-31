"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">Redirecting...</p>
      </div>
    </div>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next");
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    router.push(safeNext);
  }, [router, searchParams]);

  return <LoadingState />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
