"use client";

import { useEffect, useState } from "react";
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
  const { attempts } = useAttempts(blockId);
  const [topAttempts, setTopAttempts] = useState<AttemptWithNickname[]>([]);

  useEffect(() => {
    const sorted = [...attempts]
      .filter((a) => a.similarity > 0 && a.is_first_submission)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20);
    setTopAttempts(sorted);
  }, [attempts]);

  useEffect(() => {
    if (!blockId) return;

    let isActive = true;

    const connection = createSSEConnection('/api/sse/top-attempts', {
      eventHandlers: {
        'top-attempts': (data) => {
          if (!isActive) return;
          
          const payload = data as TopAttemptsData;
          if (payload.blockId !== blockId.toString()) return;

          const mapped: AttemptWithNickname[] = payload.attempts.map((a) => ({
            id: `${a.userId}-${a.createdAt}`,
            block_id: blockId,
            user_id: a.userId,
            nickname: a.nickname,
            input_value: a.inputValue,
            similarity: a.similarity,
            is_first_submission: a.isFirstSubmission,
            created_at: a.createdAt,
          }));

          setTopAttempts(mapped);
        },
      },
    });

    return () => {
      isActive = false;
      connection.close();
    };
  }, [blockId]);

  return { topAttempts };
}
