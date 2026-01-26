"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/shared/api";
import { ATTEMPTS_DISPLAY_LIMIT } from "@/shared/config";
import type { Attempt, AttemptWithNickname } from "./types";

export function useAttempts(blockId: number | undefined) {
  const [attempts, setAttempts] = useState<AttemptWithNickname[]>([]);
  const [newAttemptId, setNewAttemptId] = useState<string | undefined>();

  useEffect(() => {
    if (!blockId) return;

    const fetchInitial = async () => {
      const { data } = await supabase
        .from("attempts_with_nickname")
        .select("*")
        .eq("block_id", blockId)
        .order("created_at", { ascending: false })
        .limit(ATTEMPTS_DISPLAY_LIMIT);

      if (data) setAttempts(data);
    };

    fetchInitial();

    const channel = supabase
      .channel(`attempts:${blockId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attempts",
          filter: `block_id=eq.${blockId}`,
        },
        async (payload) => {
          const newAttempt = payload.new as Attempt;

          const { data: profile } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", newAttempt.user_id)
            .single();

          const attemptWithNickname: AttemptWithNickname = {
            ...newAttempt,
            nickname: profile?.nickname || "Anonymous",
          };

          setAttempts((prev) =>
            [attemptWithNickname, ...prev.slice(0, ATTEMPTS_DISPLAY_LIMIT - 1)]
          );
          setNewAttemptId(newAttempt.id);
          setTimeout(() => setNewAttemptId(undefined), 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [blockId]);

  return { attempts, newAttemptId };
}
