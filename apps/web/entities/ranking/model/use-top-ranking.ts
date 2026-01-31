"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import type { RankingEntry } from "./types";

const RANKING_REFETCH_INTERVAL = 30000;

export function useTopRanking(limit: number = 50) {
  return useQuery({
    queryKey: ["topRanking", limit],
    queryFn: async (): Promise<RankingEntry[]> => {
      const response = await apiClient.get<RankingEntry[]>('/game/rankings', {
        params: { limit },
      });

      return response.data || [];
    },
    refetchInterval: RANKING_REFETCH_INTERVAL,
    staleTime: 10000,
  });
}
