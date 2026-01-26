"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import type { RankingEntry } from "./types";

const RANKING_REFETCH_INTERVAL = 30000; // 30 seconds

export function useTopRanking(limit: number = 50) {
  return useQuery({
    queryKey: ["topRanking", limit],
    queryFn: async (): Promise<RankingEntry[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nickname, total_points")
        .order("total_points", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []).map((entry, index) => ({
        id: entry.id,
        nickname: entry.nickname,
        total_points: entry.total_points,
        rank: index + 1,
      }));
    },
    refetchInterval: RANKING_REFETCH_INTERVAL,
    staleTime: 10000, // 10 seconds
  });
}
