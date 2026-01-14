import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import type { CharsetType } from "./charset";

export type DifficultyConfig = {
  length: number;
  charset: CharsetType[];
};

export type Block = {
  id: number;
  status: "active" | "pending" | "completed";
  seed_hint: string | null;
  difficulty_config: DifficultyConfig;
  winner_id: string | null;
  created_at: string;
  solved_at: string | null;
};

export type Attempt = {
  id: string;
  block_id: number;
  user_id: string;
  input_value: string;
  similarity: number;
  created_at: string;
};

export type AttemptWithNickname = {
  id: string;
  block_id: number;
  user_id: string;
  input_value: string;
  similarity: number;
  created_at: string;
  nickname: string;
};

export type Profile = {
  id: string;
  nickname: string;
  cp_count: number;
  last_cp_refill_at: string;
  created_at?: string;
  updated_at?: string;
};

