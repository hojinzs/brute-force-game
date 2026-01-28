import { createServerSupabaseClient } from "@/shared/api/supabase-server";
import { GenesisBlockView } from "@/views";
import { GameClient } from "./_components/GameClient";
import type { Block } from "@/entities/block";

export const dynamic = "force-dynamic";

export default async function GamePage() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("blocks_public")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Failed to fetch current block:", error);
  }

  const currentBlock = (data?.[0] as Block) ?? null;

  if (!currentBlock) {
    return <GenesisBlockView />;
  }

  return <GameClient initialBlock={currentBlock} />;
}
