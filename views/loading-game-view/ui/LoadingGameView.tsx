"use client";

import { LoadingSpinner } from "@/shared/ui";

export function LoadingGameView() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-12 flex flex-col items-center justify-center min-w-[300px] shadow-xl">
        <LoadingSpinner message="Initializing..." />
      </div>
    </div>
  );
}
