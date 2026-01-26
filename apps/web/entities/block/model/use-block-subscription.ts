"use client";

import { useEffect } from "react";
import { supabase } from "@/shared/api";
import type { Block } from "./types";

export function useBlockSubscription(onBlockChange: (block: Block) => void) {
  useEffect(() => {
    const channel = supabase
      .channel("blocks:status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "blocks",
        },
        (payload) => {
          onBlockChange(payload.new as Block);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onBlockChange]);
}
