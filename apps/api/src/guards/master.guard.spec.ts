import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MasterGuard } from './master.guard';

describe('MasterGuard', () => {
  let guard: MasterGuard;

  beforeEach(() => {
    guard = new MasterGuard();
  });

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access for MASTER role', () => {
    const context = createMockExecutionContext({ role: 'MASTER', id: 'user-1' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access for USER role', () => {
    const context = createMockExecutionContext({ role: 'USER', id: 'user-2' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access when user is not present', () => {
    const context = createMockExecutionContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access when role is undefined', () => {
    const context = createMockExecutionContext({ id: 'user-3' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
