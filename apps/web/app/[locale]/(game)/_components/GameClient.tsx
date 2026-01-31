"use client";

import { useCallback, useEffect } from "react";
import { useCurrentBlock, useBlockSubscription, type Block } from "@/entities/block";
import { useAuth, AuthGuard } from "@/features/auth";
import { usePendingTimeout } from "@/features/generate-block";
import { useVictory } from "@/shared/context";
import { useGameStore } from "@/shared/store";
import { apiClient } from "@/shared/api/api-client";
import {
  LoadingGameView,
  WinnerBlockView,
  ProcessingBlockView,
  MainGameView,
} from "@/views";

type GameClientProps = {
  initialBlock: Block;
};

function GameContent({ initialBlock }: GameClientProps) {
  const { user } = useAuth();
  const {
    data: currentBlock,
    isLoading: blockLoading,
    refetch: refetchBlock,
  } = useCurrentBlock(initialBlock);
  const { show: showVictory, hide: hideVictory } = useVictory();
  const { isTimeout, isGenerating } = usePendingTimeout();

  const setBlock = useGameStore((s) => s.setBlock);
  const setLoading = useGameStore((s) => s.setLoading);

  useEffect(() => {
    setBlock(currentBlock ?? null);
    setLoading(blockLoading);
  }, [currentBlock, blockLoading, setBlock, setLoading]);

  useBlockSubscription(
    useCallback(
      async (block) => {
        if (block.status === "pending" && block.winner_id) {
          const response = await apiClient.get('/users/profile');
          const profile = response.data;

          showVictory({
            blockId: block.id,
            winnerNickname: profile?.nickname || "Anonymous",
          });

          setTimeout(() => {
            hideVictory();
            refetchBlock();
          }, 5000);
        } else if (block.status === "active") {
          hideVictory();
          refetchBlock();
        }
      },
      [refetchBlock, showVictory, hideVictory]
    )
  );

  if (blockLoading) {
    return <LoadingGameView />;
  }

  if (!currentBlock) {
    return <LoadingGameView />;
  }

  if (currentBlock.status === "processing") {
    return <ProcessingBlockView />;
  }

  const isPending = currentBlock.status === "pending";
  const isWinner = isPending && user?.id === currentBlock.winner_id;
  const showWinnerOverlay = isWinner && !isTimeout && !isGenerating;

  return (
    <>
      {showWinnerOverlay && <WinnerBlockView />}
      <MainGameView />
    </>
  );
}

export function GameClient({ initialBlock }: GameClientProps) {
  return (
    <AuthGuard>
      <GameContent initialBlock={initialBlock} />
    </AuthGuard>
  );
}
