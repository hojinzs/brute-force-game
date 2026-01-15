"use client";

import { useEffect } from "react";
import { useBlock } from "@/entities/block";
import { useCountdown } from "@/shared/ui/CountdownTimer";
import { useGenerateBlock } from "./use-generate-block";

export function usePendingTimeout() {
  const { block } = useBlock();
  const generateBlock = useGenerateBlock();

  const solvedAt =
    block?.status === "pending" && block.solved_at
      ? block.solved_at
      : new Date().toISOString();

  const { timeLeft, progress } = useCountdown(solvedAt, 180);
  const isTimeout = timeLeft === 0;

  useEffect(() => {
    if (
      block?.status === "pending" &&
      block.solved_at &&
      !generateBlock.isPending
    ) {
      const solvedTime = new Date(block.solved_at).getTime();

      const checkTimeout = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - solvedTime) / 1000);

        if (elapsed >= 180 && block.status === "pending" && !generateBlock.isPending) {
          generateBlock.mutate({
            seedHint: "System Generated",
            previousBlockId: block.id,
          });
        }
      };

      const interval = setInterval(checkTimeout, 1000);
      checkTimeout();

      return () => clearInterval(interval);
    }
  }, [block?.id, block?.status, block?.solved_at, generateBlock]);

  return {
    timeLeft,
    progress,
    isTimeout,
    isGenerating: generateBlock.isPending,
  };
}
