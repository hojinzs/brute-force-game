"use client";

import { useEffect, useState } from "react";
import { createSSEConnection } from "@/shared/api/sse-client";
import { useAuthStore } from "@/shared/store/auth-store";

export function useOnlineUsers(blockId: number | undefined) {
  const [onlineCount, setOnlineCount] = useState(0);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!blockId) return;

    // Build endpoint with user info as query params
    const params = new URLSearchParams();
    if (user?.id) {
      params.append('userId', user.id);
      params.append('nickname', user.nickname);
    }
    const endpoint = `/api/sse/presence${params.toString() ? `?${params.toString()}` : ''}`;

    const connection = createSSEConnection(endpoint, {
      eventHandlers: {
        'presence': (data) => {
          const presenceData = data as { onlineCount?: number };
          setOnlineCount(presenceData.onlineCount ?? 0);
        },
      },
    });

    return () => {
      connection.close();
    };
  }, [blockId, user?.id, user?.nickname]);

  return onlineCount;
}
