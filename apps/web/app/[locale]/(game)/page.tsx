"use client";

import { useCurrentBlock } from "@/entities/block";
import { WaitingGenesisView } from "@/views";
import { GameClient } from "./_components/GameClient";

export default function GamePage() {
  const { data: currentBlock, isLoading } = useCurrentBlock();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentBlock) {
    return <WaitingGenesisView />;
  }

  return <GameClient initialBlock={currentBlock} />;
}
