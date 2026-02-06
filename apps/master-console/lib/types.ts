export interface User {
  id: string;
  email: string | null;
  nickname: string;
  role: 'USER' | 'MASTER';
  isAnonymous: boolean;
  cpCount: number;
  totalPoints: number;
  country: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetail extends User {
  attemptCount: number;
  wonBlockCount: number;
  activeSessions: number;
  recentAttempts7d: number;
  successfulAttempts: number;
  successRate: string;
}

export interface UserStats {
  totalUsers: number;
  totalAnonymous: number;
  totalRegistered: number;
  totalMasters: number;
  activeUsersLast24h: number;
  newUsersToday: number;
}

export interface Block {
  id: number;
  status: 'WAITING_HINT' | 'WAITING_PASSWORD' | 'ACTIVE' | 'SOLVED';
  seedHint: string | null;
  difficultyConfig: { length: number; charset: string[] };
  answerPlaintext: string | null;
  accumulatedPoints: number;
  winnerId: string | null;
  winner: { id: string; nickname: string } | null;
  blockMasterId: string | null;
  blockMaster: { id: string; nickname: string } | null;
  waitingStartedAt: string | null;
  passwordRetryCount: number;
  previousBlockId: number | null;
  createdAt: string;
  solvedAt: string | null;
  attemptCount: number;
}

export interface BlockDetail extends Block {
  answerHash: string | null;
  solvedAttemptId: string | null;
}

export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
}

export interface BlocksResponse extends PaginatedResponse<Block> {
  blocks: Block[];
}

export interface UsersResponse extends PaginatedResponse<User> {
  users: User[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
