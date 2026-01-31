import type { Attempt, AttemptWithNickname } from '@/entities/attempt';

export interface ApiAttempt {
  id: string;
  blockId: number;
  userId: string;
  inputValue: string;
  similarity: number;
  createdAt: string;
  isFirstSubmission: boolean;
}

export interface ApiAttemptWithNickname extends ApiAttempt {
  nickname: string;
}

export interface ApiCheckAnswerResponse {
  isCorrect: boolean;
  similarity: number;
  remainingCP: number;
  blockStatus: string;
  attempt?: ApiAttempt;
}

export interface CheckAnswerResult {
  correct: boolean;
  similarity: number;
  remainingCP: number;
  blockStatus: string;
  attempt?: Attempt;
}

export function adaptAttempt(apiAttempt: ApiAttempt): Attempt {
  return {
    id: apiAttempt.id,
    block_id: apiAttempt.blockId,
    user_id: apiAttempt.userId,
    input_value: apiAttempt.inputValue,
    similarity: apiAttempt.similarity,
    created_at: apiAttempt.createdAt,
    is_first_submission: apiAttempt.isFirstSubmission,
  };
}

export function adaptAttemptWithNickname(
  apiAttempt: ApiAttemptWithNickname
): AttemptWithNickname {
  return {
    ...adaptAttempt(apiAttempt),
    nickname: apiAttempt.nickname,
  };
}

export function adaptCheckAnswerResponse(
  apiResponse: ApiCheckAnswerResponse
): CheckAnswerResult {
  return {
    correct: apiResponse.isCorrect,
    similarity: apiResponse.similarity,
    remainingCP: apiResponse.remainingCP,
    blockStatus: apiResponse.blockStatus,
    attempt: apiResponse.attempt ? adaptAttempt(apiResponse.attempt) : undefined,
  };
}
