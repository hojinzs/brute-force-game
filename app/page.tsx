"use client";

import { useCallback, useState, useEffect } from "react";
import { useCurrentBlock, useBlockSubscription } from "@/entities/block";
import { useAttempts } from "@/entities/attempt";
import { useAuth, AuthGuard } from "@/features/auth";
import { useCheckAnswer } from "@/features/check-answer";
import { useGenerateBlock } from "@/features/generate-block";
import { useOnlineUsers } from "@/features/online-presence";
import { useCPGauge } from "@/features/cp-gauge";
import { useCountdown } from "@/shared/ui/CountdownTimer";
import { supabase } from "@/shared/api";
import {
  LoadingGameView,
  GenesisBlockView,
  PendingBlockView,
  WinnerBlockView,
  ProcessingBlockView,
  MainGameView,
} from "@/views";

function GameContent() {
  const { user } = useAuth();
  const {
    data: currentBlock,
    isLoading: blockLoading,
    refetch: refetchBlock,
  } = useCurrentBlock();
  const { current: currentCP } = useCPGauge(user?.id);
  const { attempts, newAttemptId } = useAttempts(currentBlock?.id);
  const onlineCount = useOnlineUsers(currentBlock?.id);
  const checkAnswer = useCheckAnswer();
  const generateBlock = useGenerateBlock();
  const [showVictory, setShowVictory] = useState(false);
  const [victoryInfo, setVictoryInfo] = useState<{
    blockId: number;
    winnerNickname: string;
  } | null>(null);

  const pendingSolvedAt = currentBlock?.status === "pending" && currentBlock.solved_at
    ? currentBlock.solved_at
    : new Date().toISOString();
  const { timeLeft: pendingTimeLeft } = useCountdown(pendingSolvedAt, 180);
  const isTimeout = pendingTimeLeft === 0;

  useBlockSubscription(
    useCallback(
      async (block) => {
        if (block.status === "pending" && block.winner_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", block.winner_id)
            .single();

          setVictoryInfo({
            blockId: block.id,
            winnerNickname: profile?.nickname || "Anonymous",
          });
          setShowVictory(true);

          setTimeout(() => {
            setShowVictory(false);
            refetchBlock();
          }, 5000);
        } else if (block.status === "active") {
          setShowVictory(false);
          refetchBlock();
        }
      },
      [refetchBlock]
    )
  );

  useEffect(() => {
    if (
      currentBlock?.status === "pending" &&
      currentBlock.solved_at &&
      !generateBlock.isPending
    ) {
      const solvedTime = new Date(currentBlock.solved_at).getTime();
      const checkTimeout = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - solvedTime) / 1000);

        if (
          elapsed >= 180 &&
          currentBlock.status === "pending" &&
          !generateBlock.isPending
        ) {
          generateBlock.mutate({
            seedHint: "System Generated",
            previousBlockId: currentBlock.id,
          });
        }
      };

      const interval = setInterval(checkTimeout, 1000);
      checkTimeout();

      return () => clearInterval(interval);
    }
  }, [
    currentBlock?.id,
    currentBlock?.status,
    currentBlock?.solved_at,
    generateBlock,
  ]);

  const handleSubmit = useCallback(
    async (value: string) => {
      if (!currentBlock || currentBlock.status !== "active" || currentCP <= 0)
        return;

      try {
        const result = await checkAnswer.mutateAsync({
          inputValue: value,
          blockId: currentBlock.id,
        });

        if (result.correct && user?.id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", user.id)
            .single();

          setVictoryInfo({
            blockId: currentBlock.id,
            winnerNickname: profile?.nickname || "You",
          });
          setShowVictory(true);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("RATE_LIMITED")) {
          alert(
            "Rate limit exceeded. Please wait a moment before trying again."
          );
        } else if (errorMessage.includes("NO_CP")) {
          alert("Insufficient Computing Power. Please wait for CP to refill.");
        } else {
          console.error("Failed to submit answer:", error);
          alert("Failed to submit answer. Please try again.");
        }
      }
    },
    [currentBlock, currentCP, checkAnswer, user]
  );

  const handleHintSubmit = useCallback(
    async (hint: string) => {
      if (!currentBlock) return;

      await generateBlock.mutateAsync({
        seedHint: hint,
        previousBlockId: currentBlock.id,
      });
    },
    [currentBlock, generateBlock]
  );

  if (blockLoading) {
    return <LoadingGameView />;
  }

  if (!currentBlock) {
    return <GenesisBlockView onSuccess={() => refetchBlock()} />;
  }

  if (currentBlock.status === "pending") {
    const isWinner = user?.id === currentBlock.winner_id;

    if (isWinner && !isTimeout && !generateBlock.isPending) {
      return (
        <WinnerBlockView
          solvedAt={currentBlock.solved_at || new Date().toISOString()}
          onSubmit={handleHintSubmit}
          isSubmitting={generateBlock.isPending}
        />
      );
    } else {
      return (
        <PendingBlockView
          blockId={currentBlock.id}
          winnerNickname={currentBlock.winner_nickname || "Anonymous"}
          solvedAt={currentBlock.solved_at || new Date().toISOString()}
        />
      );
    }
  }

  if (currentBlock.status === "processing") {
    return <ProcessingBlockView />;
  }

  return (
    <MainGameView
      user={user}
      block={currentBlock}
      currentCP={currentCP}
      attempts={attempts}
      newAttemptId={newAttemptId}
      onlineCount={onlineCount}
      isCheckingAnswer={checkAnswer.isPending}
      checkAnswerError={checkAnswer.error}
      showVictory={showVictory}
      victoryInfo={victoryInfo}
      onSubmit={handleSubmit}
    />
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <GameContent />
    </AuthGuard>
  );
}
