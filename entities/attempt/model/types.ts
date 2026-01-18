export type Attempt = {
  id: string;
  block_id: number;
  user_id: string;
  input_value: string;
  similarity: number;
  created_at: string;
  is_first_submission: boolean;
};

export type AttemptWithNickname = Attempt & {
  nickname: string;
};
