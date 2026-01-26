"use client";

import { useCallback } from "react";
import { useBlock } from "@/entities/block";
import { useGenerateBlock } from "./use-generate-block";

export function useHintSubmit() {
  const { block } = useBlock();
  const generateBlock = useGenerateBlock();

  const submit = useCallback(
    async (hint: string) => {
      if (!block) return;

      await generateBlock.mutateAsync({
        seedHint: hint,
        previousBlockId: block.id,
      });
    },
    [block, generateBlock]
  );

  return {
    submit,
    isPending: generateBlock.isPending,
    error: generateBlock.error,
  };
}
