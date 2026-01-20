"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/shared/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (data.session) {
          const next = searchParams.get("next") || "/";
          router.push(next);
        } else {
          setError("No session found. Please try again.");
        }
      } catch (err: unknown) {
        console.error("Auth callback error:", err);
        const message = err instanceof Error ? err.message : "Authentication failed";
        setError(message);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-[#1e293b] border border-red-500/20 rounded-xl p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-400 mb-4">Authentication Error</h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">Verifying your email...</p>
      </div>
    </div>
  );
}
