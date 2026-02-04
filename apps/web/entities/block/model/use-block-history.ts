import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";

import type { BlockHistoryEntry } from "./history-types";
import type { ApiBlockHistoryEntry } from "./normalize-history";
import { normalizeBlockHistoryResponse } from "./normalize-history";

export type { BlockHistoryEntry } from "./history-types";

export type BlockHistoryPage = {
  page: number;
  limit: number;
  total: number;
  blocks: BlockHistoryEntry[];
};

const HISTORY_STALE_TIME_MS = 10000;
const DEFAULT_LIMIT = 100;

type ApiBlockHistoryPageResponse = {
  page: number;
  limit: number;
  total: number;
  blocks: ApiBlockHistoryEntry[];
};

export function useBlockHistoryPage(page: number, limit: number = DEFAULT_LIMIT) {
  return useQuery({
    queryKey: ["blockHistory", page, limit],
    queryFn: async (): Promise<BlockHistoryPage> => {
      const response = await apiClient.get<ApiBlockHistoryPageResponse>("/blocks", {
        params: { page, limit },
      });

      return {
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        blocks: normalizeBlockHistoryResponse(response.data.blocks),
      };
    },
    staleTime: HISTORY_STALE_TIME_MS,
  });
}

export function useRecentBlockHistory(limit: number = 20) {
  return useQuery({
    queryKey: ["blockHistory", "recent", limit],
    queryFn: async (): Promise<BlockHistoryEntry[]> => {
      const response = await apiClient.get<ApiBlockHistoryPageResponse>("/blocks", {
        params: { page: 1, limit },
      });

      return normalizeBlockHistoryResponse(response.data.blocks);
    },
    staleTime: HISTORY_STALE_TIME_MS,
  });
}
