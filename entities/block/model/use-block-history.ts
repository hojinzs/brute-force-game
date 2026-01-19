import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

export type BlockHistoryEntry = {
  block_id: number;
  status: string;
  seed_hint: string | null;
  created_at: string;
  solved_at: string | null;
  winner_id: string | null;
  accumulated_points: number;
  solved_attempt_id: string | null;
  winner_nickname: string | null;
  total_attempts: number;
  unique_participants: number;
};

const PAGE_SIZE = 50;
const HISTORY_STALE_TIME_MS = 10000;
const RECENT_HISTORY_LIMIT = 20;

export function useBlockHistory() {
  return useInfiniteQuery({
    queryKey: ["blockHistory"],
    queryFn: async ({ pageParam = 0 }): Promise<BlockHistoryEntry[]> => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("block_history_view")
        .select("*")
        .order("block_id", { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return (data || []) as BlockHistoryEntry[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      return allPages.length;
    },
    staleTime: HISTORY_STALE_TIME_MS,
  });
}

export function useRecentBlockHistory(limit: number = RECENT_HISTORY_LIMIT) {
  return useQuery({
    queryKey: ["blockHistory", "recent", limit],
    queryFn: async (): Promise<BlockHistoryEntry[]> => {
      const { data, error } = await supabase
        .from("block_history_view")
        .select("*")
        .order("block_id", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []) as BlockHistoryEntry[];
    },
    staleTime: HISTORY_STALE_TIME_MS,
  });
}
