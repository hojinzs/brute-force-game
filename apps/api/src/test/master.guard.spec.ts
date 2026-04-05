import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MasterGuard } from '../auth/master.guard';
import { MASTER_ONLY_KEY } from '../decorators/master-only.decorator';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MasterGuard', () => {
  let guard: MasterGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new MasterGuard(reflector);
  });

  function createMockContext(user: any, masterOnly: boolean): ExecutionContext {
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(masterOnly);
    return context;
  }

  it('should allow MASTER user on @MasterOnly() endpoint', () => {
    const context = createMockContext({ sub: '1', role: 'MASTER' }, true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny USER on @MasterOnly() endpoint', () => {
    const context = createMockContext({ sub: '1', role: 'USER' }, true);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny unauthenticated user on @MasterOnly() endpoint', () => {
    const context = createMockContext(undefined, true);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow any user on non-@MasterOnly() endpoint', () => {
    const context = createMockContext({ sub: '1', role: 'USER' }, false);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow request without user on non-@MasterOnly() endpoint', () => {
    const context = createMockContext(undefined, false);
    expect(guard.canActivate(context)).toBe(true);
  });
});
