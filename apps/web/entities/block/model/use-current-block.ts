"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { adaptBlockWithNicknames, type ApiBlockWithNicknames } from "@/shared/api/adapters";
import { createSSEConnection } from "@/shared/api/sse-client";
import { BLOCK_REFETCH_INTERVAL_MS } from "@/shared/config";
import type { Block, BlockWithNicknames } from "./types";

export function useCurrentBlock(initialData?: Block) {
  const queryClient = useQueryClient();

  const query = useQuery({
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
    refetchInterval: BLOCK_REFETCH_INTERVAL_MS, // Fallback polling
  });

  // SSE subscription for real-time updates
  useEffect(() => {
    let isActive = true;

    const connection = createSSEConnection('/api/sse/current-block', {
      eventHandlers: {
        'current-block': () => {
          if (!isActive) return;
          // Invalidate query to trigger refetch
          void queryClient.invalidateQueries({ queryKey: ["currentBlock"] });
        },
      },
    });

    return () => {
      isActive = false;
      connection.close();
    };
  }, [queryClient]);

  return query;
}
