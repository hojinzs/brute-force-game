import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Brute Force API - NestJS Backend is running!';
  }

  getHealth(): { status: string; version: string } {
    return {
      status: 'OK',
      version: '1.0.0',
    };
  }
}
