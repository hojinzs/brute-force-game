import type { Block, BlockStatus, BlockWithNicknames } from '@/entities/block';
import type { CharsetType } from '@/shared/lib/charset';

export interface ApiBlock {
  id: number;
  status: string;
  seedHint: string | null;
  difficultyConfig: {
    length: number;
    charset: CharsetType[];
  };
  winnerId: string | null;
  createdAt: string;
  solvedAt: string | null;
  createdBy: string | null;
  accumulatedPoints: number;
  solvedAttemptId?: string | null;
}

export interface ApiBlockWithNicknames extends ApiBlock {
  winnerNickname?: string;
  creatorNickname?: string;
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
  return {
    id: apiBlock.id,
    status: adaptBlockStatus(apiBlock.status),
    seed_hint: apiBlock.seedHint,
    difficulty_config: apiBlock.difficultyConfig,
    winner_id: apiBlock.winnerId,
    created_at: apiBlock.createdAt,
    solved_at: apiBlock.solvedAt,
    created_by: apiBlock.createdBy,
    accumulated_points: apiBlock.accumulatedPoints,
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
