"use client";

import { useEffect, useRef } from "react";
import { useBlock } from "@/entities/block";
import { useCountdown } from "@/shared/ui/CountdownTimer";
import { useGenerateBlock } from "./use-generate-block";

const PENDING_TIMEOUT_SECONDS = 180;

export function usePendingTimeout() {
  const { block } = useBlock();
  const generateBlock = useGenerateBlock();
  const hasTriggeredRef = useRef(false);

  const isPendingWithSolvedAt = block?.status === "pending" && !!block.solved_at;
  const solvedAt = isPendingWithSolvedAt ? block.solved_at : null;

  const { timeLeft, progress } = useCountdown(
    solvedAt ?? new Date().toISOString(),
    PENDING_TIMEOUT_SECONDS
  );

  const isTimeout = isPendingWithSolvedAt && timeLeft === 0;

  useEffect(() => {
    hasTriggeredRef.current = false;
  }, [block?.id]);

  useEffect(() => {
    if (!isPendingWithSolvedAt || !solvedAt || hasTriggeredRef.current) {
      return;
    }

    const solvedTime = new Date(solvedAt).getTime();

    const checkTimeout = () => {
      if (hasTriggeredRef.current || generateBlock.isPending) {
        return;
      }

      const now = Date.now();
      const elapsed = Math.floor((now - solvedTime) / 1000);

      if (elapsed >= PENDING_TIMEOUT_SECONDS) {
        hasTriggeredRef.current = true;
        generateBlock.mutate({
          seedHint: "System Generated",
          previousBlockId: block.id,
        });
      }
    };

    const interval = setInterval(checkTimeout, 1000);

    return () => clearInterval(interval);
  }, [block?.id, isPendingWithSolvedAt, solvedAt, generateBlock]);

  return {
    timeLeft: isPendingWithSolvedAt ? timeLeft : PENDING_TIMEOUT_SECONDS,
    progress: isPendingWithSolvedAt ? progress : 100,
    isTimeout,
    isGenerating: generateBlock.isPending,
  };
}
