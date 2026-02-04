"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import type { RankingEntry } from "./types";
import type { ApiRankingsResponse } from "./normalize";
import { normalizeRankingsResponse } from "./normalize";

export function useRankingInfinite(limit: number = 100) {
  return useQuery({
    queryKey: ["rankings", limit],
    queryFn: async (): Promise<RankingEntry[]> => {
      const response = await apiClient.get<ApiRankingsResponse>('/game/rankings', {
        params: { limit },
      });

      return normalizeRankingsResponse(response.data).rankings;
    },
    staleTime: 10000,
  });
}
