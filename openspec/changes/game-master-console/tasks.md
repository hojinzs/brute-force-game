## 1. Database Schema

- [ ] 1.1 Prisma schema에 `UserRole` enum 추가 (`USER`, `MASTER`)
- [ ] 1.2 User 모델에 `role` 필드 추가 (`role UserRole @default(USER)`)
- [ ] 1.3 Migration 생성 (`prisma migrate dev --name add_user_role`)
- [ ] 1.4 Migration 적용 및 기존 유저 default role 확인
- [ ] 1.5 Prisma client 재생성 (`prisma generate`)

## 2. Backend Auth - Role System

- [ ] 2.1 `JwtPayload` interface에 `role` 필드 추가 (`auth.service.ts`)
- [ ] 2.2 `AuthService.generateTokens()`에서 role 포함하도록 수정
- [ ] 2.3 `@MasterOnly()` decorator 생성 (`decorators/master-only.decorator.ts`)
- [ ] 2.4 `MasterGuard` CanActivate guard 구현 (`guards/master.guard.ts`)
- [ ] 2.5 `MasterGuard`를 AuthModule에 등록 및 export
- [ ] 2.6 Role 변경 시 기존 세션 무효화 로직 추가 (`sessions` 삭제)

## 3. Backend Admin Module Setup

- [ ] 3.1 `apps/api/src/admin/` 디렉토리 구조 생성
- [ ] 3.2 `AdminModule` 생성 및 `AppModule`에 등록
- [ ] 3.3 Admin 전용 logger 설정 (감사 로그용)

## 4. Backend Admin Blocks API

- [ ] 4.1 `AdminBlocksController` 생성 (`/api/admin/blocks`)
- [ ] 4.2 `AdminBlocksService` 생성
- [ ] 4.3 `GET /api/admin/blocks` - 전체 블록 목록 (pagination, answerPlaintext 포함)
- [ ] 4.4 `GET /api/admin/blocks/:id` - 블록 상세 (모든 필드)
- [ ] 4.5 `POST /api/admin/blocks/:id/force-transition` - 상태 강제 전환
- [ ] 4.6 Force transition DTO 및 validation (targetStatus, hint/password, reason)
- [ ] 4.7 WAITING_HINT → ACTIVE 전환 로직 (hint 설정)
- [ ] 4.8 WAITING_PASSWORD → ACTIVE 전환 로직 (password 설정, hash 생성)
- [ ] 4.9 강제 SOLVED 처리 로직 (winner 없이 종료, 다음 블록 생성)
- [ ] 4.10 `POST /api/admin/blocks/:id/regenerate-password` - 패스워드 재생성 트리거
- [ ] 4.11 모든 admin block action에 감사 로그 추가

## 5. Backend Admin Users API

- [ ] 5.1 `AdminUsersController` 생성 (`/api/admin/users`)
- [ ] 5.2 `AdminUsersService` 생성
- [ ] 5.3 `GET /api/admin/users` - 유저 목록 (pagination, filtering, search)
- [ ] 5.4 `GET /api/admin/users/stats` - 유저 통계 (total, anonymous, masters, active24h)
- [ ] 5.5 `GET /api/admin/users/:id` - 유저 상세 (attempt 통계 포함)
- [ ] 5.6 `PUT /api/admin/users/:id/role` - role 변경 (self-change 금지)
- [ ] 5.7 Role 변경 시 대상 유저 세션 invalidate
- [ ] 5.8 `POST /api/admin/users/:id/reset-cp` - CP 리셋
- [ ] 5.9 모든 admin user action에 감사 로그 추가

## 6. Backend Admin SSE

- [ ] 6.1 Admin SSE stream 엔드포인트 생성 (`GET /api/admin/events`)
- [ ] 6.2 블록 상태 변경 이벤트 emit
- [ ] 6.3 신규 유저 등록 이벤트 emit

## 7. Backend CLI Command

- [ ] 7.1 `promote-master` CLI command 추가 (`--email` 또는 `--userId`)
- [ ] 7.2 CLI command 문서화 (README 업데이트)

## 8. Frontend Auth Integration

- [ ] 8.1 User type/interface에 `role` 필드 추가
- [ ] 8.2 Auth store/context에서 role 관리
- [ ] 8.3 `useAuth()` hook에서 role 반환

## 9. Frontend Admin Layout

- [ ] 9.1 `app/[locale]/admin/` route group 생성
- [ ] 9.2 `admin/layout.tsx` - MASTER role 검증 및 리다이렉트
- [ ] 9.3 AdminShell 컴포넌트 (header, sidebar, MASTER badge)
- [ ] 9.4 Admin 전용 스타일링 (dark theme 유지, 구분되는 accent color)

## 10. Frontend Admin Dashboard

- [ ] 10.1 `admin/page.tsx` - 대시보드 페이지 생성
- [ ] 10.2 현재 블록 상태 카드 (status, ID, 경과 시간)
- [ ] 10.3 유저 통계 카드 (total, active, online)
- [ ] 10.4 Stuck 블록 경고 알림 (5분 이상 WAITING 상태)
- [ ] 10.5 SSE 연결 및 실시간 업데이트

## 11. Frontend Block Management

- [ ] 11.1 `admin/blocks/page.tsx` - 블록 관리 페이지 생성
- [ ] 11.2 블록 테이블 (status, ID, winner, timestamps)
- [ ] 11.3 블록 상세 패널 (클릭 시 표시, answerPlaintext 포함)
- [ ] 11.4 Force transition UI (WAITING 상태 블록용)
- [ ] 11.5 Skip block 버튼 및 확인 dialog
- [ ] 11.6 Regenerate password 버튼 (WAITING_PASSWORD용)
- [ ] 11.7 TanStack Query hooks for admin blocks API

## 12. Frontend User Management

- [ ] 12.1 `admin/users/page.tsx` - 유저 관리 페이지 생성
- [ ] 12.2 유저 테이블 (nickname, email, role, points, createdAt)
- [ ] 12.3 검색 및 필터 UI (nickname 검색, role 필터)
- [ ] 12.4 유저 상세 패널 (클릭 시 표시, activity 포함)
- [ ] 12.5 Role 변경 dropdown 및 확인 dialog
- [ ] 12.6 CP 리셋 버튼
- [ ] 12.7 TanStack Query hooks for admin users API

## 13. Frontend Mobile Responsiveness

- [ ] 13.1 Admin layout 반응형 적용 (sidebar collapse)
- [ ] 13.2 Dashboard 모바일 뷰
- [ ] 13.3 Block/User 테이블 모바일 뷰 (카드 형태)
- [ ] 13.4 Critical action 2-tap 접근성 확인

## 14. Testing

- [ ] 14.1 MasterGuard unit test
- [ ] 14.2 AdminBlocksController integration test (guard 적용 확인)
- [ ] 14.3 AdminUsersController integration test (self-role-change 금지 확인)
- [ ] 14.4 Force transition 시나리오 테스트
- [ ] 14.5 Frontend admin layout role 검증 테스트

## 15. Documentation & Deployment

- [ ] 15.1 README에 admin CLI 명령어 추가
- [ ] 15.2 첫 MASTER 유저 생성 방법 문서화
- [ ] 15.3 Migration 순서 확인 (DB → Backend → Frontend)
