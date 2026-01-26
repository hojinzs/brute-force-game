"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import type { RankingEntry } from "./types";

const PAGE_SIZE = 50;

export function useRankingInfinite() {
  return useInfiniteQuery({
    queryKey: ["rankingInfinite"],
    queryFn: async ({ pageParam = 0 }): Promise<RankingEntry[]> => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, nickname, total_points")
        .order("total_points", { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return (data || []).map((entry, index) => ({
        id: entry.id,
        nickname: entry.nickname,
        total_points: entry.total_points,
        rank: from + index + 1,
      }));
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If we got less than PAGE_SIZE, we've reached the end
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      return allPages.length;
    },
    staleTime: 10000,
  });
}
