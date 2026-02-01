"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSSEConnection } from "@/shared/api/sse-client";
import { useAttempts } from "@/entities/attempt";
import type { AttemptWithNickname } from "@/entities/attempt";

type TopAttemptsData = {
  blockId: string;
  attempts: {
    userId: string;
    nickname: string;
    inputValue: string;
    similarity: number;
    isFirstSubmission: boolean;
    createdAt: string;
  }[];
};

export function useTopAttemptsSse(blockId: number | undefined) {
  const queryClient = useQueryClient();
  const { attempts } = useAttempts(blockId);

  const topAttempts = [...attempts]
    .filter((a) => a.similarity > 0 && a.is_first_submission)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20);

  useEffect(() => {
    if (!blockId) return;

    let isActive = true;

    const connection = createSSEConnection('/api/sse/top-attempts', {
      eventHandlers: {
        'top-attempts': (data) => {
          if (!isActive) return;
          
          const payload = data as TopAttemptsData;
          if (payload.blockId !== blockId.toString()) return;

          void queryClient.invalidateQueries({ queryKey: ["attempts", blockId] });
        },
      },
    });

    return () => {
      isActive = false;
      connection.close();
    };
  }, [blockId, queryClient]);

  return { topAttempts };
}
