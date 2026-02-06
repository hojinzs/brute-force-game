## Context

Brute Force AI는 글로벌 유저가 AI 생성 패스워드를 크래킹하는 소셜 해킹 시뮬레이션 게임이다. 현재 게임 운영 중 블록이 `WAITING_HINT` 또는 `WAITING_PASSWORD` 상태에서 진행되지 않거나, AI 생성 힌트에 문제가 있을 때 관리자 개입이 불가능하다.

**현재 아키텍처:**
- Backend: NestJS + Prisma + PostgreSQL
- Frontend: Next.js 16 (App Router) + TanStack Query + Zustand
- Auth: JWT (access + refresh token), JwtAuthGuard
- Real-time: SSE (Server-Sent Events) via ConnectionManagerService

**현재 JwtPayload:**
```typescript
interface JwtPayload {
  sub: string;
  email: string;
  nickname: string;
  isAnonymous: boolean;
  // role 필드 없음
}
```

**현재 User 모델 (Prisma):**
```prisma
model User {
  id, email, nickname, passwordHash, isAnonymous, cpCount, ...
  // role 필드 없음
}
```

## Goals / Non-Goals

**Goals:**
- MASTER role 기반 권한 시스템 구축
- 블록 상태 모니터링 및 강제 개입 기능
- 유저 목록 조회 및 role 관리 기능
- 관리자 전용 웹 콘솔 UI

**Non-Goals:**
- 시즌 관리 기능 (향후 별도 change로 구현)
- 다중 role 계층 (ADMIN, MODERATOR 등) - 현재는 USER/MASTER 2단계만
- 감사 로그 UI (로깅은 구현하되 UI는 향후)
- 관리자 초대/가입 플로우 (DB에서 직접 role 변경)

## Decisions

### 1. Role 저장 방식: Prisma Enum

**선택:** Prisma schema에 `UserRole` enum 정의

```prisma
enum UserRole {
  USER
  MASTER
}

model User {
  ...
  role UserRole @default(USER)
}
```

**대안 검토:**
- String 필드: 타입 안정성 부족, 오타 가능성
- 별도 roles 테이블 (N:M): 단순 2-role 시스템에 과도한 복잡성

**근거:** Enum은 DB 레벨 제약 + TypeScript 타입 안정성 제공. 향후 role 추가 시 migration으로 확장 가능.

### 2. Role Guard 구현: Decorator + Guard 조합

**선택:** `@MasterOnly()` decorator + `MasterGuard` CanActivate guard

```typescript
// decorators/master-only.decorator.ts
export const MASTER_ONLY_KEY = 'masterOnly';
export const MasterOnly = () => SetMetadata(MASTER_ONLY_KEY, true);

// guards/master.guard.ts
@Injectable()
export class MasterGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // JwtAuthGuard가 먼저 설정
    if (user?.role !== 'MASTER') {
      throw new ForbiddenException('Master role required');
    }
    return true;
  }
}
```

**사용 패턴:**
```typescript
@Auth()           // 먼저 인증 확인
@MasterOnly()     // 그 다음 role 확인
@Get('admin/blocks')
```

**대안 검토:**
- 단일 `@Auth('MASTER')` decorator: 기존 `@Auth()` 패턴과 불일치
- Middleware 기반: route 레벨 제어 어려움

**근거:** 기존 `@Auth()` decorator와 조합 가능, 명시적이고 테스트 용이.

### 3. Admin API 구조: 별도 Controller

**선택:** `/api/admin/*` prefix로 별도 AdminBlocksController, AdminUsersController 생성

```
apps/api/src/
├── admin/
│   ├── admin.module.ts
│   ├── blocks/
│   │   ├── admin-blocks.controller.ts
│   │   └── admin-blocks.service.ts
│   └── users/
│       ├── admin-users.controller.ts
│       └── admin-users.service.ts
```

**대안 검토:**
- 기존 controller에 admin endpoint 추가: 관심사 혼재, 파일 비대화
- GraphQL: 기존 REST 패턴과 불일치

**근거:** 관심사 분리, 모든 admin endpoint에 일괄 guard 적용 용이, 향후 확장성.

### 4. JWT Payload에 Role 추가

**선택:** `JwtPayload` interface에 `role` 필드 추가

```typescript
export interface JwtPayload {
  sub: string;
  email: string;
  nickname: string;
  isAnonymous: boolean;
  role: 'USER' | 'MASTER';  // 추가
}
```

**대안 검토:**
- 매 요청마다 DB 조회: 성능 저하, 불필요한 쿼리
- 별도 role claim 토큰: 토큰 관리 복잡성 증가

**근거:** JWT에 role 포함 시 DB 조회 없이 guard에서 즉시 검증 가능. Role 변경 시 재로그인 필요하지만, MASTER 승격은 드문 이벤트.

### 5. Frontend Admin 라우트 구조

**선택:** `app/[locale]/admin/` route group

```
apps/web/app/[locale]/admin/
├── layout.tsx          # Admin-specific layout (guard, styling)
├── page.tsx            # Dashboard
├── blocks/
│   └── page.tsx        # Block management
└── users/
    └── page.tsx        # User management
```

**대안 검토:**
- 별도 admin 앱: 배포/유지보수 복잡성 증가
- Modal 기반 admin: UX 제한, 복잡한 작업에 부적합

**근거:** 기존 locale 라우팅 패턴 준수, layout에서 role 검증 일원화.

### 6. Frontend Role 검증: Layout + Middleware

**선택:** Admin layout에서 client-side role 검증 + 필요시 middleware 추가

```typescript
// app/[locale]/admin/layout.tsx
export default function AdminLayout({ children }) {
  const { user } = useAuth();
  
  if (!user) redirect('/auth/login');
  if (user.role !== 'MASTER') redirect('/');
  
  return <AdminShell>{children}</AdminShell>;
}
```

**대안 검토:**
- Server component에서만 검증: SSE/실시간 기능과 충돌
- API route마다 검증: 중복 코드

**근거:** Layout에서 일원화된 검증, client-side로 빠른 리다이렉트.

### 7. 감사 로그: Application-level Logging

**선택:** Winston/Pino logger로 구조화된 로그 출력, 별도 테이블 없음 (v1)

```typescript
this.logger.log({
  type: 'ADMIN_ACTION',
  action: 'FORCE_BLOCK_TRANSITION',
  actorId: masterId,
  targetBlockId: blockId,
  previousStatus,
  newStatus,
  reason,
  timestamp: new Date().toISOString(),
});
```

**대안 검토:**
- AdminAuditLog 테이블: 추가 복잡성, v1에는 과도함
- 외부 감사 서비스: 인프라 의존성 증가

**근거:** MVP 단계에서는 로그 파일로 충분. 향후 필요시 테이블로 확장.

### 8. Real-time Updates: 기존 SSE 활용

**선택:** 기존 ConnectionManagerService + SSE 채널에 admin 전용 이벤트 추가

```typescript
// Admin dashboard용 SSE endpoint
@Get('admin/events')
@MasterOnly()
@Sse()
adminEvents() {
  return this.sseService.getAdminStream();
}
```

**대안 검토:**
- WebSocket: 기존 SSE 인프라와 불일치
- Polling: 실시간성 저하

**근거:** 기존 SSE 인프라 재사용, admin-specific 이벤트만 추가.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| JWT에 role 포함 → role 변경 시 기존 토큰 유효 | Role 변경 API에서 해당 유저의 모든 세션 invalidate (sessions 테이블 삭제) |
| Admin API 권한 우회 | Integration test로 모든 admin endpoint에 guard 적용 확인 |
| MASTER 계정 탈취 시 전체 시스템 위험 | MASTER는 DB 직접 부여만 가능, 향후 2FA 고려 |
| 실수로 자신의 role 변경 → lockout | Self-role-change 금지 (spec에 명시됨) |
| 블록 강제 개입으로 게임 무결성 손상 | 모든 개입 action 로깅, 이유 필수 입력 |

## Migration Plan

**Phase 1: Database**
1. Prisma schema에 `UserRole` enum 및 `role` 필드 추가
2. Migration 생성 및 적용 (기존 유저는 `USER` default)
3. 특정 유저를 MASTER로 승격 (DB 직접 또는 seed)

**Phase 2: Backend**
1. `JwtPayload`에 `role` 필드 추가
2. `AuthService.generateTokens()`에서 role 포함
3. `MasterGuard` 및 `@MasterOnly()` decorator 구현
4. AdminModule (AdminBlocksController, AdminUsersController) 구현
5. 기존 유저 로그인 시 role이 JWT에 포함되도록 확인

**Phase 3: Frontend**
1. `/admin` route group 및 layout 생성
2. Dashboard, Blocks, Users 페이지 구현
3. Admin API client (TanStack Query hooks) 구현
4. Role 검증 로직 통합

**Rollback:**
- DB: role 컬럼 삭제 migration
- Backend: AdminModule 제거, JwtPayload에서 role 제거
- Frontend: /admin route 삭제

## Open Questions

1. **MASTER 초기 생성 방법**: Seed script vs CLI command vs 수동 SQL?
   - 제안: CLI command (`pnpm --filter api cli promote-master --email admin@example.com`)

2. **감사 로그 보존 기간**: 로그 파일 rotation 정책?
   - 제안: 30일 보존, 이후 아카이브

3. **Admin SSE 연결 제한**: MASTER당 최대 연결 수?
   - 제안: 3개 (다중 탭/기기 허용)
