import type { RankingEntry } from "./types";

export interface ApiRankingEntry {
  id: string;
  rank: number;
  nickname: string;
  totalPoints: string;
  country?: string;
}

export interface ApiRankingsResponse {
  rankings: ApiRankingEntry[];
  totalUsers: number;
}

export function normalizeRankingEntry(entry: ApiRankingEntry): RankingEntry {
  return {
    id: entry.id,
    nickname: entry.nickname,
    total_points: Number(entry.totalPoints),
    rank: entry.rank,
  };
}

export function normalizeRankingsResponse(
  response: ApiRankingsResponse | null | undefined
): { rankings: RankingEntry[]; totalUsers: number } {
  return {
    rankings: (response?.rankings ?? []).map(normalizeRankingEntry),
    totalUsers: response?.totalUsers ?? 0,
  };
}
