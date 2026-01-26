"use client";

import { LoadingSpinner } from "@/shared/ui";

export function ProcessingBlockView() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <LoadingSpinner message="Generating new block..." />
    </div>
  );
}
