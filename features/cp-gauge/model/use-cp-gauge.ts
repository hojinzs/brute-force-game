"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import { CP_REFETCH_INTERVAL_MS, CP_MAX } from "@/shared/config";

export function useCPGauge(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["currentCP", userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;

      const { data, error } = await supabase.rpc("get_current_cp", {
        p_user_id: userId,
      });

      if (error) throw error;
      return data ?? 0;
    },
    enabled: !!userId,
    refetchInterval: CP_REFETCH_INTERVAL_MS,
  });

  return {
    current: query.data ?? 0,
    max: CP_MAX,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
