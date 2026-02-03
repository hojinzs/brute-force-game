"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import type { RankingEntry } from "./types";

export function useRankingInfinite(limit: number = 100) {
  return useQuery({
    queryKey: ["rankingInfinite", limit],
    queryFn: async (): Promise<RankingEntry[]> => {
      const response = await apiClient.get<{ rankings: RankingEntry[] }>('/game/rankings', {
        params: { limit },
      });

      return response.data.rankings || [];
    },
    staleTime: 10000,
  });
}
