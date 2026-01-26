"use client";

import { useGameStore } from "@/shared/store";

export function useBlock() {
  const block = useGameStore((s) => s.block);
  const isLoading = useGameStore((s) => s.isLoading);

  return { block, isLoading };
}
