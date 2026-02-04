import type { BlockStatus } from "./types";

export type BlockHistoryEntry = {
  block_id: number;
  status: BlockStatus;
  seed_hint: string | null;
  created_at: string;
  solved_at: string | null;
  winner_id: string | null;
  accumulated_points: number;
  solved_attempt_id: string | null;
  winner_nickname: string | null;
  solved_answer: string | null;
  total_attempts: number;
  unique_participants: number;
};

