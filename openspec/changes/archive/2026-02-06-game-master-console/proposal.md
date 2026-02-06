## Why

게임 운영 중 블록이 `WAITING_HINT` 또는 `WAITING_PASSWORD` 상태에서 진행되지 않거나, AI 생성 힌트에 문제가 있을 때 관리자 개입이 불가능함. 현재 블록 상태 확인, 유저 관리, 시즌 운영을 위한 어드민 도구가 없어 운영 리스크가 존재함.

## What Changes

- **User Role 시스템 추가**: User 모델에 `role` 필드 추가 (`USER`, `MASTER`)
- **Role 기반 인증 Guard**: MASTER 권한 검증을 위한 NestJS Guard 구현
- **Admin API 엔드포인트**: 블록 조회/개입, 유저 목록 조회 API
- **Game Master Console UI**: 관리자 전용 웹 페이지 (블록 정보, 유저 목록, 개입 기능)
- **블록 개입 기능**: Stuck 상태 블록 강제 진행/리셋 기능

## Capabilities

### New Capabilities

- `admin-auth`: MASTER role 기반 인증 및 권한 검증 시스템. User role enum 추가, role guard, role 기반 API 보호.
- `admin-console`: Game Master 전용 웹 콘솔 UI. 블록 현황 대시보드, 유저 목록, 블록 개입 인터페이스.
- `block-admin-api`: 관리자용 블록 관리 API. 전체 블록 조회, 블록 상세 정보 (answer_plaintext 포함), 블록 상태 강제 변경.
- `user-admin-api`: 관리자용 유저 관리 API. 유저 목록 조회, 유저 상세 정보, 유저 role 변경.

### Modified Capabilities

(없음 - 기존 OpenSpec spec 파일 없음)

## Impact

**Database Schema**:
- `users` 테이블에 `role` 컬럼 추가 (enum: USER, MASTER, default: USER)
- Migration 필요

**Backend (apps/api)**:
- User entity/DTO에 role 필드 추가
- RoleGuard decorator 구현
- Admin 전용 controller/service 추가
- 기존 auth 모듈에 role 검증 로직 통합

**Frontend (apps/web)**:
- `/admin` 또는 `/master` 경로에 Game Master Console 페이지
- MASTER role 확인 후 접근 허용 (미인증/USER는 리다이렉트)
- 블록 상태 실시간 모니터링 UI
- 유저 목록 테이블 UI

**Security**:
- MASTER 권한은 DB에서 직접 부여 (회원가입 시 기본 USER)
- answer_plaintext는 MASTER만 조회 가능
- Admin API는 모두 RoleGuard로 보호
