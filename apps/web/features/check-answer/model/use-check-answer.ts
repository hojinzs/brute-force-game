"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { adaptCheckAnswerResponse, type ApiCheckAnswerResponse } from "@/shared/api/adapters";

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
      const response = await apiClient.post<ApiCheckAnswerResponse>('/game/check-answer', {
        blockId: blockId.toString(),
        answer: inputValue,
      });

      const adapted = adaptCheckAnswerResponse(response.data);
      
      return {
        correct: adapted.correct,
        similarity: adapted.similarity,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentCP"] });

      if (data.correct) {
        queryClient.invalidateQueries({ queryKey: ["currentBlock"] });
      }
    },
  });
}
