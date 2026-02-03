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

    let isActive = true;

    const fetchAttempts = async (highlightLatest: boolean) => {
      const response = await apiClient.get<ApiAttemptWithNickname[]>(`/attempts/${blockId}`, {
        params: { limit: ATTEMPTS_DISPLAY_LIMIT },
      });

      if (!isActive || !response.data) return;

      const mappedAttempts = response.data.map(adaptAttemptWithNickname);
      setAttempts(mappedAttempts);

      if (highlightLatest && mappedAttempts.length > 0) {
        const latestId = mappedAttempts[0].id;
        setNewAttemptId(latestId);
        setTimeout(() => setNewAttemptId(undefined), 500);
      }
    };

    const getEventBlockId = (payload: unknown): number | null => {
      if (typeof payload !== "object" || payload === null) return null;
      const record = payload as Record<string, unknown>;
      const blockIdValue = record.blockId;

      if (typeof blockIdValue === "number") {
        return Number.isFinite(blockIdValue) ? blockIdValue : null;
      }

      if (typeof blockIdValue === "string") {
        const parsed = Number(blockIdValue);
        return Number.isFinite(parsed) ? parsed : null;
      }

      return null;
    };

    fetchAttempts(false);

    const connection = createSSEConnection('/api/sse/feed', {
      eventHandlers: {
        'attempt': (data) => {
          const eventBlockId = getEventBlockId(data);
          if (eventBlockId === blockId) {
            void fetchAttempts(true);
          }
        },
      },
    });

    return () => {
      isActive = false;
      connection.close();
    };
  }, [blockId]);

  return { attempts, newAttemptId };
}
