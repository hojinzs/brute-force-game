import type { Block, BlockStatus, BlockWithNicknames } from '@/entities/block';
import type { CharsetType } from '@/shared/lib/charset';

export interface ApiBlock {
  id: number | string;
  status: string;
  seedHint: string | null;
  difficultyConfig: {
    length: number;
    charset: CharsetType[];
  };
  winnerId?: string | null;
  createdAt: string;
  solvedAt?: string | null;
  createdBy?: string | null;
  accumulatedPoints: number | string;
  solvedAttemptId?: string | null;
}

export interface ApiBlockWithNicknames extends ApiBlock {
  winnerNickname?: string;
  creatorNickname?: string;
}

export interface SSECurrentBlockEvent {
  id: string;
  status: string;
  seedHint: string;
  difficultyConfig: {
    length: number;
    charset: CharsetType[];
  };
  accumulatedPoints: string;
  attemptCount: number;
  createdAt: Date | string;
}

export function adaptBlockStatus(status: string): BlockStatus {
  switch (status) {
    case 'ACTIVE':
      return 'active';
    case 'WAITING_HINT':
      return 'pending';
    case 'WAITING_PASSWORD':
      return 'processing';
    case 'SOLVED':
      return 'solved';
    default:
      throw new Error(`Unknown block status: ${status}`);
  }
}

export function adaptBlock(apiBlock: ApiBlock): Block {
  const normalizedId = Number(apiBlock.id);
  const accumulatedPoints = Number(apiBlock.accumulatedPoints);

  return {
    id: Number.isFinite(normalizedId) ? normalizedId : 0,
    status: adaptBlockStatus(apiBlock.status),
    seed_hint: apiBlock.seedHint,
    difficulty_config: apiBlock.difficultyConfig,
    winner_id: apiBlock.winnerId ?? null,
    created_at: apiBlock.createdAt,
    solved_at: apiBlock.solvedAt ?? null,
    created_by: apiBlock.createdBy ?? null,
    accumulated_points: Number.isFinite(accumulatedPoints) ? accumulatedPoints : 0,
    solved_attempt_id: apiBlock.solvedAttemptId,
  };
}

export function adaptBlockWithNicknames(
  apiBlock: ApiBlockWithNicknames
): BlockWithNicknames {
  return {
    ...adaptBlock(apiBlock),
    winner_nickname: apiBlock.winnerNickname,
    creator_nickname: apiBlock.creatorNickname,
  };
}

export function adaptSSECurrentBlock(
  sseEvent: SSECurrentBlockEvent
): BlockWithNicknames {
  return {
    id: Number(sseEvent.id),
    status: adaptBlockStatus(sseEvent.status),
    seed_hint: sseEvent.seedHint || null,
    difficulty_config: sseEvent.difficultyConfig,
    winner_id: null,
    created_at: typeof sseEvent.createdAt === 'string' 
      ? sseEvent.createdAt 
      : sseEvent.createdAt.toISOString(),
    solved_at: null,
    created_by: null,
    accumulated_points: Number(sseEvent.accumulatedPoints),
    solved_attempt_id: null,
    winner_nickname: undefined,
    creator_nickname: undefined,
  };
}
