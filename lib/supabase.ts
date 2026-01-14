import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (typeof window !== "undefined") {
  const SUPABASE_URL_KEY = "brute-force-supabase-url";
  const storedUrl = localStorage.getItem(SUPABASE_URL_KEY);
  
  if (storedUrl && storedUrl !== supabaseUrl) {
    console.log("🔄 Supabase URL changed from", storedUrl, "to", supabaseUrl);
    console.log("🗑️  Clearing all local storage and session storage...");
    
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keysToDelete.push(key);
    }
    
    keysToDelete.forEach(key => {
      console.log("   Deleting:", key);
      localStorage.removeItem(key);
    });
    
    sessionStorage.clear();
    console.log("✅ Session cleared! Please refresh the page.");
  }
  
  localStorage.setItem(SUPABASE_URL_KEY, supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

import type { CharsetType } from "./charset";

export type DifficultyConfig = {
  length: number;
  charset: CharsetType[];
};

export type Block = {
  id: number;
  status: "active" | "pending" | "processing" | "solved";
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

