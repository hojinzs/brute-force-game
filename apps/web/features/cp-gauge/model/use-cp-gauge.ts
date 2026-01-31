"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { CP_REFETCH_INTERVAL_MS, CP_MAX } from "@/shared/config";

interface CPResponse {
  current: number;
  max: number;
}

export function useCPGauge(userId: string | undefined, isAnonymous: boolean = false) {
  const query = useQuery({
    queryKey: ["currentCP", userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;

      const response = await apiClient.get<CPResponse>('/users/cp');
      return response.data.current ?? 0;
    },
    enabled: !!userId,
    refetchInterval: isAnonymous ? false : CP_REFETCH_INTERVAL_MS,
  });

  return {
    current: query.data ?? 0,
    max: CP_MAX,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
