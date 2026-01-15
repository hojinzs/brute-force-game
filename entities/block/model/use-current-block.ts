"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import { BLOCK_REFETCH_INTERVAL_MS } from "@/shared/config";
import type { Block, BlockWithNicknames } from "./types";

export function useCurrentBlock() {
  return useQuery({
    queryKey: ["currentBlock"],
    queryFn: async (): Promise<BlockWithNicknames | null> => {
      const { data, error } = await supabase
        .from("blocks_public")
        .select("*")
        .order("id", { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const block = data[0] as Block;

      let winner_nickname: string | undefined;
      if (block.winner_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", block.winner_id)
          .single();
        winner_nickname = profile?.nickname || "Anonymous";
      }

      let creator_nickname: string | undefined;
      if (block.created_by) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", block.created_by)
          .single();
        creator_nickname = profile?.nickname || "Anonymous";
      }

      return {
        ...block,
        winner_nickname,
        creator_nickname,
      };
    },
    refetchInterval: BLOCK_REFETCH_INTERVAL_MS,
  });
}
