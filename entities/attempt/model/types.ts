export type Attempt = {
  id: string;
  block_id: number;
  user_id: string;
  input_value: string;
  similarity: number;
  created_at: string;
};

export type AttemptWithNickname = Attempt & {
  nickname: string;
};
