import { adaptBlockStatus } from "@/shared/api/adapters";
import type { BlockHistoryEntry } from "./history-types";

export type ApiBlockHistoryWinner = {
  id: string;
  nickname: string;
  isAnonymous?: boolean;
};

export type ApiBlockHistoryEntry = {
  id: number;
  status: string;
  seedHint: string | null;
  difficultyConfig?: unknown;
  accumulatedPoints: number;
  winner: ApiBlockHistoryWinner | null;
  createdAt?: string;
  solvedAt: string | null;
  attemptCount: number;
  uniqueParticipants?: number;
  solvedAnswer?: string | null;
};

export function normalizeBlockHistoryEntry(
  entry: ApiBlockHistoryEntry
): BlockHistoryEntry {
  const solvedAt = entry.solvedAt;
  const createdAt = entry.createdAt ?? solvedAt;
  const status = adaptBlockStatus(entry.status);

  return {
    block_id: entry.id,
    status,
    seed_hint: entry.seedHint,
    created_at: createdAt ?? new Date(0).toISOString(),
    solved_at: solvedAt,
    winner_id: entry.winner?.id ?? null,
    accumulated_points: entry.accumulatedPoints,
    solved_attempt_id: null,
    winner_nickname: entry.winner?.nickname ?? null,
    solved_answer: status === "solved" ? entry.solvedAnswer ?? null : null,
    total_attempts: entry.attemptCount,
    unique_participants: entry.uniqueParticipants ?? 0,
  };
}

export function normalizeBlockHistoryResponse(
  entries: ApiBlockHistoryEntry[] | null | undefined
): BlockHistoryEntry[] {
  return (entries ?? []).map(normalizeBlockHistoryEntry);
}
