# 계정 시스템

## 개요

Brute Force AI는 게임 참여를 위해 회원가입이 필요합니다. 이 문서는 계정 시스템 구조, 회원가입 흐름, 관련 정책을 설명합니다.

## 회원가입 흐름

### 필수 입력 항목

| 필드 | 타입 | 설명 |
|------|------|------|
| `email` | string | 사용자 이메일 |
| `password` | string | 최소 6자 |
| `nickname` | string | 표시 이름 (2~20자, 고유) |
| `country` | string | ISO-3166 alpha-2 코드 (예: `KR`, `US`, `JP`) |
| `emailConsent` | boolean | 이메일 수신 동의 여부 |

### 데이터 저장 구조

```
Supabase Auth (raw_user_meta_data)     →     profiles 테이블 (trigger)
├── nickname                            │     ├── id (auth.users 기준)
├── country                             │     ├── nickname
└── email_consent                       │     ├── country
                                        │     ├── email_consent
                                        │     ├── email_consent_at
                                        │     ├── cp_count (기본값: 50)
                                        │     └── total_points (기본값: 0)
```

`handle_new_user()` 트리거가 회원가입 시 profiles 레코드를 자동 생성합니다.

### 회원가입 후 리디렉션

- 기본값: `/` (메인 게임 화면)
- 커스텀: `signUpWithEmail()` 호출 시 `redirectTo` 파라미터 전달
- 흐름: 이메일 인증 링크 클릭 → `/auth/callback?next={redirectTo}` → 해당 경로로 이동

## 이메일 인증

### 현재 정책

- 이메일 인증은 **필수 아님**
- 인증되지 않은 사용자도 게임 참여 가능
- 이메일 인증 알림을 표시하지 않음

### 향후 정책

- 이메일 알림(게임 진행, 다음 블럭, 유사도 갱신)은 인증된 이메일만 발송
- 보상 지급 시 인증된 이메일 필수
- 해당 기능 활성화 시 인증 안내 노출 예정

## 국가 정보

### 형식

ISO-3166 alpha-2 코드 사용:
- `KR` - 대한민국
- `US` - 미국
- `JP` - 일본
- `CN` - 중국
- 기타 국가 코드

### 활용

- 국가별 랭킹 집계
- 지역 리더보드
- 통계 및 분석

## 이메일 수신 동의

### 필드

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `email_consent` | boolean | 이메일 수신 동의 여부 |
| `email_consent_at` | timestamptz | 동의 시점 (미동의 시 NULL) |

### 동의 범위

- 게임 진행 알림 (블럭 해결, 유사도 갱신)
- 프로모션 안내
- 보상 관련 공지

## API 레퍼런스

### `signUpWithEmail(params: SignUpParams)`

```typescript
type SignUpParams = {
  email: string;
  password: string;
  nickname: string;
  country: string;        // ISO-3166 alpha-2
  emailConsent: boolean;
  redirectTo?: string;    // 기본값: "/"
};

const { signUpWithEmail } = useAuth();
await signUpWithEmail({
  email: "user@example.com",
  password: "password123",
  nickname: "Player1",
  country: "KR",
  emailConsent: true,
  redirectTo: "/",
});
```

### `useRequireAuth()`

인증 상태 체크용 헬퍼 훅:

```typescript
const { isAuthenticated, isLoading, requiresSignup } = useRequireAuth();

if (requiresSignup) {
  // 가입/로그인 유도 화면 표시
}
```

## 데이터베이스 스키마

### profiles 테이블

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nickname text NOT NULL UNIQUE,
  cp_count int NOT NULL DEFAULT 50,
  last_cp_refill_at timestamptz NOT NULL DEFAULT now(),
  total_points bigint NOT NULL DEFAULT 0,
  country text,
  email_consent boolean NOT NULL DEFAULT false,
  email_consent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 인덱스

- `profiles_country_idx` - 국가별 랭킹 쿼리
- `profiles_total_points_idx` - 전체 랭킹 쿼리
