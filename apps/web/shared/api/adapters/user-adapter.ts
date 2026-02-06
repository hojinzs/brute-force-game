import type { Profile } from '@/entities/profile';
import type { User, UserRole } from '@/shared/store/auth-store';

export interface ApiUser {
  id: string;
  email?: string;
  nickname: string;
  isAnonymous: boolean;
  role?: UserRole;
  cpCount?: number;
  totalPoints?: number;
  country?: string;
}

export interface ApiProfile {
  id: string;
  nickname: string;
  cpCount: number;
  lastCpRefillAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export function adaptUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    nickname: apiUser.nickname,
    isAnonymous: apiUser.isAnonymous,
    role: apiUser.role || 'USER',
  };
}

export function adaptProfile(apiProfile: ApiProfile): Profile {
  return {
    id: apiProfile.id,
    nickname: apiProfile.nickname,
    cp_count: apiProfile.cpCount,
    last_cp_refill_at: apiProfile.lastCpRefillAt,
    created_at: apiProfile.createdAt,
    updated_at: apiProfile.updatedAt,
  };
}
