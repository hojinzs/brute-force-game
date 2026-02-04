"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import type { UserRank } from "./types";

interface ApiUserRankResponse {
  rank: number;
  nickname: string;
  totalPoints: string;
  above: Array<{
    rank: number;
    nickname: string;
    totalPoints: string;
  }>;
  below: Array<{
    rank: number;
    nickname: string;
    totalPoints: string;
  }>;
}

export function useMyRank(userId: string | undefined) {
  return useQuery({
    queryKey: ["myRank", userId],
    queryFn: async (): Promise<UserRank | null> => {
      if (!userId) return null;

      const response = await apiClient.get<ApiUserRankResponse>('/game/my-rank');
      
      // Transform from API format (camelCase) to frontend format (snake_case)
      return {
        userId,
        nickname: response.data.nickname,
        total_points: Number(response.data.totalPoints),
        rank: response.data.rank,
      };
    },
    enabled: !!userId,
    staleTime: 10000,
  });
}
