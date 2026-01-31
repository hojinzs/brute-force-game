"use client";

import { useEffect } from "react";
import { createSSEConnection } from "@/shared/api/sse-client";
import { adaptBlock, type ApiBlock } from "@/shared/api/adapters";
import type { Block } from "./types";

export function useBlockSubscription(onBlockChange: (block: Block) => void) {
  useEffect(() => {
    const connection = createSSEConnection('/api/sse/blocks', {
      eventHandlers: {
        'block-status': (data) => {
          const apiBlock = data as ApiBlock;
          const block = adaptBlock(apiBlock);
          onBlockChange(block);
        },
      },
    });

    return () => {
      connection.close();
    };
  }, [onBlockChange]);
}
