"use client";

import { useEffect, useState } from "react";
import { createSSEConnection } from "@/shared/api/sse-client";

export function useOnlineUsers(blockId: number | undefined) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!blockId) return;

    const connection = createSSEConnection('/api/sse/presence', {
      eventHandlers: {
        'presence': (data) => {
          const presenceData = data as { count: number };
          setOnlineCount(presenceData.count || 0);
        },
      },
    });

    return () => {
      connection.close();
    };
  }, [blockId]);

  return onlineCount;
}
