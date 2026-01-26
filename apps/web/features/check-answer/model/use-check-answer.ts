"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

type CheckAnswerParams = {
  inputValue: string;
  blockId: number;
};

type CheckAnswerResult = {
  correct: boolean;
  similarity: number;
};

export function useCheckAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inputValue, blockId }: CheckAnswerParams): Promise<CheckAnswerResult> => {
      const { data, error } = await supabase.functions.invoke("check-answer", {
        body: {
          inputValue,
          blockId,
        },
      });

      if (error) {
        console.error("Edge Function error:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentCP"] });

      if (data.correct) {
        queryClient.invalidateQueries({ queryKey: ["currentBlock"] });
      }
    },
  });
}
