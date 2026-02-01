"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/shared/api/api-client";
import { createSSEConnection } from "@/shared/api/sse-client";
import { adaptAttemptWithNickname, type ApiAttemptWithNickname } from "@/shared/api/adapters";
import { ATTEMPTS_DISPLAY_LIMIT } from "@/shared/config";
import type { AttemptWithNickname } from "./types";

export function useAttempts(blockId: number | undefined) {
  const [attempts, setAttempts] = useState<AttemptWithNickname[]>([]);
  const [newAttemptId, setNewAttemptId] = useState<string | undefined>();

  useEffect(() => {
    if (!blockId) return;

    const fetchInitial = async () => {
      const response = await apiClient.get<ApiAttemptWithNickname[]>(`/attempts/${blockId}`, {
        params: { limit: ATTEMPTS_DISPLAY_LIMIT },
      });

      if (response.data) {
        setAttempts(response.data.map(adaptAttemptWithNickname));
      }
    };

    fetchInitial();

    const connection = createSSEConnection('/api/sse/feed', {
      eventHandlers: {
        'attempt': (data) => {
          const apiAttempt = data as ApiAttemptWithNickname;
          
          if (apiAttempt.blockId === blockId) {
            const attemptWithNickname = adaptAttemptWithNickname(apiAttempt);

            setAttempts((prev) =>
              [attemptWithNickname, ...prev.slice(0, ATTEMPTS_DISPLAY_LIMIT - 1)]
            );
            setNewAttemptId(attemptWithNickname.id);
            setTimeout(() => setNewAttemptId(undefined), 500);
          }
        },
      },
    });

    return () => {
      connection.close();
    };
  }, [blockId]);

  return { attempts, newAttemptId };
}
