"use client";

import { useEffect } from "react";
import { createSSEConnection } from "@/shared/api/sse-client";
import { apiClient } from "@/shared/api/api-client";
import { adaptBlock, type ApiBlock } from "@/shared/api/adapters";
import type { Block } from "./types";

export function useBlockSubscription(onBlockChange: (block: Block) => void) {
  useEffect(() => {
    let isActive = true;

    const refreshCurrentBlock = async () => {
      const response = await apiClient.get<ApiBlock>("/blocks/current");

      if (!isActive || !response.data) return;

      const block = adaptBlock(response.data);
      onBlockChange(block);
    };

    const connection = createSSEConnection('/api/sse/blocks', {
      eventHandlers: {
        'block-status': () => {
          void refreshCurrentBlock();
        },
      },
    });

    return () => {
      isActive = false;
      connection.close();
    };
  }, [onBlockChange]);
}
