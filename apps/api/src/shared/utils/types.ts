export type CharsetType = 'lowercase' | 'uppercase' | 'alphanumeric' | 'symbols';

export interface DifficultyConfig {
  length: number;
  charset: CharsetType[];
}

export interface DifficultyConfigJson {
  length: number;
  charset: CharsetType[];
}

export interface PasswordGenerationRequest {
  previousBlockId?: bigint;
  difficulty?: DifficultyConfig;
}

export interface PasswordGenerationResponse {
  password: string;
  hash: string;
  hint: string;
  difficulty: DifficultyConfig;
}