"use client";

import { useCallback } from "react";
import { useBlock } from "@/entities/block";
import { useAuth } from "@/features/auth";
import { useCPGauge } from "@/features/cp-gauge";
import { useVictory } from "@/shared/context";
import { supabase } from "@/shared/api";
import { useCheckAnswer } from "./use-check-answer";

type SubmitAnswerResult = {
  similarity: number;
  isCorrect: boolean;
};

export function useSubmitAnswer() {
  const { block } = useBlock();
  const { user } = useAuth();
  const { current: currentCP } = useCPGauge(user?.id);
  const checkAnswer = useCheckAnswer();
  const { show: showVictory } = useVictory();

  const submit = useCallback(
    async (value: string): Promise<SubmitAnswerResult | null> => {
      if (!block || block.status !== "active" || currentCP <= 0) return null;

      try {
        const result = await checkAnswer.mutateAsync({
          inputValue: value,
          blockId: block.id,
        });

        if (result.correct && user?.id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", user.id)
            .single();

          showVictory({
            blockId: block.id,
            winnerNickname: profile?.nickname || "You",
          });
        }

        return {
          similarity: result.similarity,
          isCorrect: result.correct,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("RATE_LIMITED")) {
          throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
        } else if (errorMessage.includes("NO_CP")) {
          throw new Error("Insufficient Computing Power. Please wait for CP to refill.");
        } else {
          throw new Error("Failed to submit answer. Please try again.");
        }
      }
    },
    [block, currentCP, checkAnswer, user, showVictory]
  );

  const canSubmit = !!user && currentCP > 0 && block?.status === "active" && !checkAnswer.isPending;

  return {
    submit,
    canSubmit,
    isPending: checkAnswer.isPending,
    error: checkAnswer.error,
  };
}
