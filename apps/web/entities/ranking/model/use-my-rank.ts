"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import type { UserRank } from "./types";

export function useMyRank(userId: string | undefined) {
  return useQuery({
    queryKey: ["myRank", userId],
    queryFn: async (): Promise<UserRank | null> => {
      if (!userId) return null;

      const response = await apiClient.get<UserRank>('/game/my-rank');
      return response.data;
    },
    enabled: !!userId,
    staleTime: 10000,
  });
}
