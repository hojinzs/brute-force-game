"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/shared/api";

export function useOnlineUsers(blockId: number | undefined) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!blockId) return;

    const channel = supabase.channel(`presence:block:${blockId}`, {
      config: {
        presence: {
          key: `user_${Math.random().toString(36).substring(7)}`,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setOnlineCount(count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [blockId]);

  return onlineCount;
}
