import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/auth.service';

@Injectable()
export class MasterGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user || user.role !== 'MASTER') {
      throw new ForbiddenException('Master role required');
    }

    return true;
  }
}
