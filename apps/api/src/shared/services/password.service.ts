import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DifficultyConfig, CharsetType } from '../utils/types';

@Injectable()
export class PasswordService {
  constructor(private readonly configService: ConfigService) {}

  generatePassword(difficulty: DifficultyConfig): string {
    const charset = this.buildCharset(difficulty.charset);
    let password = '';

    for (let i = 0; i < difficulty.length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  generateHint(difficulty: DifficultyConfig): string {
    const charsetNames = {
      lowercase: '소문자',
      uppercase: '대문자',
      alphanumeric: '숫자',
      symbols: '기호',
    };

    const charsetDescription = difficulty.charset
      .map(char => charsetNames[char])
      .join(', ');

    return `${difficulty.length}자리 (${charsetDescription})`;
  }

  async hashPassword(password: string): Promise<string> {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private buildCharset(charset: CharsetType[]): string {
    const charsets = {
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      alphanumeric: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    };

    return charset
      .map(char => charsets[char])
      .join('');
  }

  generateNextDifficulty(previousDifficulty?: DifficultyConfig): DifficultyConfig {
    if (!previousDifficulty) {
      return {
        length: 4,
        charset: ['lowercase'],
      };
    }

    const maxLength = 12;
    const allCharsets: CharsetType[] = ['lowercase', 'uppercase', 'alphanumeric', 'symbols'];

    let newLength = previousDifficulty.length;
    let newCharset = [...previousDifficulty.charset];

    // Increase length every 2 blocks
    if (Math.random() < 0.5 && newLength < maxLength) {
      newLength = Math.min(newLength + 1, maxLength);
    }

    // Add new charset type
    if (Math.random() < 0.3 && newCharset.length < allCharsets.length) {
      const availableCharsets = allCharsets.filter(char => !newCharset.includes(char));
      if (availableCharsets.length > 0) {
        const randomCharset = availableCharsets[Math.floor(Math.random() * availableCharsets.length)];
        newCharset.push(randomCharset);
      }
    }

    return {
      length: newLength,
      charset: newCharset,
    };
  }
}