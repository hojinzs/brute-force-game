# [기술 요구사항 명세서] Brute Force AI

## 1.시스템 아키텍처 개요
본 프로젝트의 MVP단계는 Serverless 아키텍처를 지향하며, 프론트엔드 호스팅은 Vercel, 백엔드 및 인프라는 Supabase를 활용합니다.

- Frontend: Next.js (App Router)
- Backend (BaaS): Supabase (Edge Functions, Realtime, Auth, Database)
- AI: ChatGPT 4.1 mini (암호 및 힌트 생성)
- Communication: Supabase Realtime (PostgreSQL CDC 기반)

## 2. 프론트엔드 기술 요구사항 (Frontend)

### 2.1 UI/UX 프레임워크
- Next.js 16+: App Router를 사용하여 서버 사이드 렌더링(SSR)과 클라이언트 사이드 렌더링(CSR)을 최적으로 분리.
- Tailwind CSS: 디자인 가이드에 정의된 세련된 다크 모드 및 카드 UI 구현.
- Motion (Framer Motion): 실시간 로그 업데이트 애니메이션 및 해킹 성공 시의 글리치(Glitch) 효과 구현.

### 2.2 상태 관리 및 데이터 페칭
- Supabase Client SDK: 실시간 DB 구독 및 인증 상태 관리.
- TanStack Query (React Query): 서버 데이터 캐싱 및 CP(자원) 상태의 빈번한 업데이트 동기화.

### 2.3 인증 요구사항
- 이메일 기반 회원가입/로그인 필수 (게스트 로그인 미지원).
- Supabase Auth를 통한 이메일 인증 절차 진행.
- 회원가입 시 닉네임 필수 입력 (2~20자).

## 3. 백엔드 및 데이터베이스 요구사항 (Supabase)

### 3.1 Database 스키마 (PostgreSQL)
- `profiles` 테이블: 유저 메타데이터 및 자원 관리. 
  - `id` (UUID, FK to Auth.users), `nickname`, `cp_count` (int), `last_cp_refill_at` (timestamptz).
- `blocks` 테이블: 해킹 대상 정보.
  - `id` (BigInt, PK), `status` (Enum: 'active', 'pending'), `seed_hint` (text), `difficulty_config` (jsonb), `answer_hash` (text), `winner_id` (UUID, nullable), `created_at`, `solved_at`.
- `attempts` 테이블: 전 세계 오답 로그.
  - `id` (UUID), `block_id` (FK), `user_id` (FK), `input_value` (text), `similarity` (float), `created_at`.

### 3.2 보안 정책 (Row Level Security - RLS)
- `blocks.answer_hash`는 오직 `service_role`(Edge Functions)만 읽을 수 있도록 설정하여 클라이언트 유출 원천 차단.
- `attempts` 테이블은 모든 유저에게 SELECT 권한을 부여하여 실시간 피드 공유 가능케 함.

### 3.3 컴퓨팅 파워(CP) 엔진 (Postgres Function)
- 서버 부하 감소를 위해 `get_current_cp`(user_id) 스토어드 프로시저 구현.
- 로직: `MIN(50, cp_count + FLOOR(EXTRACT(EPOCH FROM (NOW() - last_cp_refill_at)) / 60))`

## 4. Edge Functions (서버리스 로직)

### 4.1 check-answer 함수

- 입력: `user_id`, `input_value`, `block_id`
- 로직:
  1. 유저의 현재 CP 잔액 확인 및 1 차감.
  2. blocks 테이블에서 해당 블록의 answer_hash와 대조.
  3. 정답일 경우: 블록 상태를 pending으로 변경하고 승리자 ID 기록.
  4. 오답일 경우: 유사도(Levenshtein Distance) 계산 후 attempts 테이블에 Insert.
- 반환: 성공 여부 및 유사도 점수.

### 4.2 generate-block 함수 (Gemini API 연동)
- 트리거: 승자의 힌트 입력 또는 180초 타임아웃 발생 시 호출.
- 로직:
  1. API에 시드 힌트와 난이도 파라미터 전달.
  2. JSON 응답(password, difficulty_desc) 수신.
  3. password를 해싱하여 새로운 blocks 레코드 생성.
  4. 새로운 블록 정보를 브로드캐스트하여 게임 재개.

## 5. 실시간 통신 및 동기화 (Realtime)

### 5.1 Realtime 구독 전략

- 클라이언트는 attempts 테이블의 INSERT 이벤트를 구독하여 전 세계 오답 피드를 즉시 수신.
- 블록 상태(blocks.status)가 pending으로 변경되는 이벤트를 감지하여 승리 알림 오버레이 및 입력창 잠금 처리.

## 6. 보안 및 성능 요구사항
- API Rate Limiting: 동일 유저의 `check-answer` 호출을 초당 2회로 제한 (Edge Function 미들웨어 레벨).
- 정답 무결성: 정답 평문은 메모리상에서만 존재하며 DB에는 오직 Salted Hash 형태로만 저장.
- 성능 목표:
  - 오답 제출 후 유사도 결과 반환까지 500ms 이내 (Network Latency 제외). 
  - 실시간 피드 전송 지연 1초 이내.

## 7. 인프라 및 배포 로드맵

1. 개발 환경: Supabase CLI를 이용한 로컬 개발 및 마이그레이션 관리.
2. 배포:
  - Frontend: Vercel (GitHub 연동 자동 배포).
  - Backend: Supabase Production 프로젝트 배포.
3. 환경 변수 관리: SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY 등을 Supabase Vault 및 Vercel Secrets에 안전하게 저장.