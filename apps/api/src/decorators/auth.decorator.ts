import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MasterGuard } from '../auth/master.guard';
import { MasterOnly } from './master-only.decorator';

/**
 * Auth decorator for protected endpoints
 * Combines @UseGuards(JwtAuthGuard) and @ApiBearerAuth for Swagger
 */
export function Auth() {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
  );
}

/**
 * MasterAuth decorator for MASTER-only endpoints
 * Combines Auth + MasterOnly + MasterGuard
 */
export function MasterAuth() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, MasterGuard),
    MasterOnly(),
    ApiBearerAuth('JWT-auth'),
  );
}
