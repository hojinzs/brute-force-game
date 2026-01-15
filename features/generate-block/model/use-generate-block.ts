"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

type GenerateBlockParams = {
  seedHint: string;
  previousBlockId: number;
};

export function useGenerateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ seedHint, previousBlockId }: GenerateBlockParams) => {
      const { data, error } = await supabase.functions.invoke("generate-block", {
        body: {
          seedHint,
          previousBlockId,
        },
      });

      if (error) {
        console.error("Edge Function error:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentBlock"] });
    },
  });
}
