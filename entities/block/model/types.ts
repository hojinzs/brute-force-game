import type { CharsetType } from "@/shared/lib/charset";

export type DifficultyConfig = {
  length: number;
  charset: CharsetType[];
};

export type BlockStatus = "active" | "pending" | "processing" | "solved";

export type Block = {
  id: number;
  status: BlockStatus;
  seed_hint: string | null;
  difficulty_config: DifficultyConfig;
  winner_id: string | null;
  created_at: string;
  solved_at: string | null;
  created_by: string | null;
};

export type BlockWithNicknames = Block & {
  winner_nickname?: string;
  creator_nickname?: string;
};
