import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";

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
  solved_answer: string | null;
  total_attempts: number;
  unique_participants: number;
};

const HISTORY_STALE_TIME_MS = 10000;
const DEFAULT_LIMIT = 50;

export function useBlockHistory(limit: number = DEFAULT_LIMIT) {
  return useQuery({
    queryKey: ["blockHistory", limit],
    queryFn: async (): Promise<BlockHistoryEntry[]> => {
      const response = await apiClient.get<BlockHistoryEntry[]>('/blocks', {
        params: { limit },
      });

      return response.data || [];
    },
    staleTime: HISTORY_STALE_TIME_MS,
  });
}

export function useRecentBlockHistory(limit: number = 20) {
  return useQuery({
    queryKey: ["blockHistory", "recent", limit],
    queryFn: async (): Promise<BlockHistoryEntry[]> => {
      const response = await apiClient.get<BlockHistoryEntry[]>('/blocks', {
        params: { limit },
      });

      return response.data || [];
    },
    staleTime: HISTORY_STALE_TIME_MS,
  });
}
