export type RankingEntry = {
  id: string;
  nickname: string;
  total_points: number;
  rank?: number;
};

export type UserRank = {
  userId: string;
  nickname: string;
  totalPoints: number;
  rank: number;
};
