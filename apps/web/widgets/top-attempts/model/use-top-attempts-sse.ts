"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/shared/api/api-client";
import { createSSEConnection } from "@/shared/api/sse-client";
import { adaptAttemptWithNickname, type ApiAttemptWithNickname } from "@/shared/api/adapters";
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
  const [topAttempts, setTopAttempts] = useState<AttemptWithNickname[]>([]);

  useEffect(() => {
    if (!blockId) {
      setTopAttempts([]);
      return;
    }

    let isActive = true;

    const fetchTopAttempts = async () => {
      try {
        const response = await apiClient.get<ApiAttemptWithNickname[]>(`/attempts/${blockId}/top`);
        
        if (!isActive || !response.data) return;

        const mappedAttempts = response.data.map(adaptAttemptWithNickname);
        setTopAttempts(mappedAttempts);
      } catch (error) {
        console.error('Failed to fetch top attempts:', error);
        setTopAttempts([]);
      }
    };

    fetchTopAttempts();

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
