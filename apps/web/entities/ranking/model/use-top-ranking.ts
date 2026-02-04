"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import type { RankingEntry } from "./types";
import type { ApiRankingsResponse } from "./normalize";
import { normalizeRankingsResponse } from "./normalize";

const RANKING_REFETCH_INTERVAL = 30000;

export interface TopRankingResponse {
  rankings: RankingEntry[];
  totalUsers: number
}

export function useTopRanking(limit: number = 50) {
  return useQuery({
    queryKey: ["topRanking", limit],
    queryFn: async (): Promise<TopRankingResponse> => {
      const response = await apiClient.get<ApiRankingsResponse>('/game/rankings', {
        params: { limit },
      });

      return normalizeRankingsResponse(response.data);
    },
    refetchInterval: RANKING_REFETCH_INTERVAL,
    staleTime: 10000,
  });
}
