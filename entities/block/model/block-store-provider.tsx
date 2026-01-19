"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentBlock } from "./use-current-block";
import { useBlockSubscription } from "./use-block-subscription";
import { useGameStore } from "@/shared/store";
import { useVictory } from "@/shared/context";
import { supabase } from "@/shared/api";
import type { Block } from "./types";

type BlockStoreProviderProps = {
  initialBlock: Block | null;
  children: React.ReactNode;
};

export function BlockStoreProvider({ initialBlock, children }: BlockStoreProviderProps) {
  const queryClient = useQueryClient();
  const { data: block, isLoading, refetch } = useCurrentBlock(initialBlock ?? undefined);
  const setBlock = useGameStore((s) => s.setBlock);
  const setLoading = useGameStore((s) => s.setLoading);
  const { show: showVictory, hide: hideVictory } = useVictory();

  const refreshLedger = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["blockHistory"] });
  }, [queryClient]);

  useEffect(() => {
    setBlock(block ?? null);
    setLoading(isLoading);
  }, [block, isLoading, setBlock, setLoading]);

  useBlockSubscription(
    useCallback(
      async (updatedBlock) => {
        refreshLedger();

        if (updatedBlock.status === "pending" && updatedBlock.winner_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", updatedBlock.winner_id)
            .single();

          showVictory({
            blockId: updatedBlock.id,
            winnerNickname: profile?.nickname || "Anonymous",
          });

          setTimeout(() => {
            hideVictory();
            refetch();
          }, 5000);
        } else if (updatedBlock.status === "active") {
          hideVictory();
          refetch();
        }
      },
      [refreshLedger, refetch, showVictory, hideVictory]
    )
  );

  return <>{children}</>;
}
