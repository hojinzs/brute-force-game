"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type GenerateBlockParams = {
  seedHint: string;
  previousBlockId: number;
};

export function useGenerateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ seedHint, previousBlockId }: GenerateBlockParams) => {
      throw new Error("generate-block feature is disabled: backend API not implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentBlock"] });
    },
  });
}
