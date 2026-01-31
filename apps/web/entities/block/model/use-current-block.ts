"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { adaptBlockWithNicknames, type ApiBlockWithNicknames } from "@/shared/api/adapters";
import { BLOCK_REFETCH_INTERVAL_MS } from "@/shared/config";
import type { Block, BlockWithNicknames } from "./types";

export function useCurrentBlock(initialData?: Block) {
  return useQuery({
    queryKey: ["currentBlock"],
    initialData: initialData
      ? { ...initialData, winner_nickname: undefined, creator_nickname: undefined }
      : undefined,
    queryFn: async (): Promise<BlockWithNicknames | null> => {
      const response = await apiClient.get<ApiBlockWithNicknames>('/game/current');
      
      if (!response.data) {
        return null;
      }

      return adaptBlockWithNicknames(response.data);
    },
    refetchInterval: BLOCK_REFETCH_INTERVAL_MS,
  });
}
