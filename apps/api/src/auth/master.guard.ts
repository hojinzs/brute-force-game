import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MASTER_ONLY_KEY } from '../decorators/master-only.decorator';

@Injectable()
export class MasterGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isMasterOnly = this.reflector.getAllAndOverride<boolean>(MASTER_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isMasterOnly) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== 'MASTER') {
      throw new ForbiddenException('Master role required');
    }

    return true;
  }
}
