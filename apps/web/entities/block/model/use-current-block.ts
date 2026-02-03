"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { adaptBlockWithNicknames, adaptSSECurrentBlock, type ApiBlockWithNicknames, type SSECurrentBlockEvent } from "@/shared/api/adapters";
import { createSSEConnection } from "@/shared/api/sse-client";
import { BLOCK_REFETCH_INTERVAL_MS } from "@/shared/config";
import type { Block, BlockWithNicknames } from "./types";

export function useCurrentBlock(initialData?: Block) {
  const queryClient = useQueryClient();
  const [sseConnected, setSseConnected] = useState(false);

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
    refetchInterval: sseConnected ? false : BLOCK_REFETCH_INTERVAL_MS,
  });

  useEffect(() => {
    let isActive = true;

    const connection = createSSEConnection('/api/sse/current-block', {
      onConnectionChange: (connected) => {
        if (!isActive) return;
        setSseConnected(connected);
      },
      eventHandlers: {
        'current-block': (data: unknown) => {
          if (!isActive) return;
          
          const blockData = adaptSSECurrentBlock(data as SSECurrentBlockEvent);
          queryClient.setQueryData(["currentBlock"], blockData);
        },
      },
    });

    return () => {
      isActive = false;
      setSseConnected(false);
      connection.close();
    };
  }, [queryClient]);

  return query;
}
