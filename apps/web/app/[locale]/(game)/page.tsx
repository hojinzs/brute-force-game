"use client";

import { useCurrentBlock } from "@/entities/block";
import { GenesisBlockView } from "@/views";
import { GameClient } from "./_components/GameClient";

export default function GamePage() {
  const { data: currentBlock, isLoading } = useCurrentBlock();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentBlock) {
    return <GenesisBlockView />;
  }

  return <GameClient initialBlock={currentBlock} />;
}
