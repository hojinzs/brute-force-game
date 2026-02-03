"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import type { RankingEntry } from "./types";

interface ApiRankingEntry {
  id: string;
  rank: number;
  nickname: string;
  totalPoints: string;
  country?: string;
}

interface ApiRankingsResponse {
  rankings: ApiRankingEntry[];
  totalUsers: number;
}

export function useRankingInfinite(limit: number = 100) {
  return useQuery({
    queryKey: ["rankings", limit],
    queryFn: async (): Promise<RankingEntry[]> => {
      const response = await apiClient.get<ApiRankingsResponse>('/game/rankings', {
        params: { limit },
      });

      // Transform from API format (camelCase) to frontend format (snake_case)
      return (response.data.rankings || []).map((ranking) => ({
        id: ranking.id,
        nickname: ranking.nickname,
        total_points: Number(ranking.totalPoints),
        rank: ranking.rank,
      }));
    },
    staleTime: 10000,
  });
}
