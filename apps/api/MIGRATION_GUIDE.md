# Brute Force API - Migration & Setup Guide

## 개요

Supabase에서 자체 호스팅 NestJS 백엔드로의 전체 마이그레이션이 완료되었습니다. 이 문서는 설치, 실행, 데이터 마이그레이션 방법을 안내합니다.

## 🚀 빠른 시작

### 1. 인프라 시작
```bash
# 프로젝트 루트에서 인프라 시작
docker-compose -f docker-compose.infra.yaml up -d

# PostgreSQL, Redis, PgAdmin 시작 확인
docker ps
```

### 2. API 서버 시작
```bash
# API 디렉토리로 이동
cd apps/api

# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 DATABASE_URL 등 설정

# Prisma 클라이언트 생성
pnpm prisma:generate

# 데이터베이스 마이그레이션
pnpm prisma:migrate

# 시드 데이터 실행
pnpm prisma:seed

# 개발 서버 시작
pnpm start:dev
```

### 3. 상태 확인
```bash
# API 서버 상태 확인
curl http://localhost:3001

# 헬스 체크
curl http://localhost:3001/health
```

## 📊 데이터 마이그레이션

### 데모 데이터 마이그레이션
```bash
# 샘플 데이터 생성
pnpm migrate:demo
```

### Supabase 데이터 마이그레이션
```bash
# 환경변수 설정
export SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-supabase-anon-key"
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brute_force"

# 마이그레이션 실행
pnpm migrate:supabase
```

## 🏗️ 아키텍처

### API 엔드포인트 구조
```
http://localhost:3001
├── /                          # 기본 엔드포인트
├── /health                     # 헬스 체크
├── /users                     # 사용자 관리
│   ├── POST /register          # 회원가입
│   ├── POST /login             # 로그인
│   ├── POST /anonymous         # 익명 사용자
│   ├── GET /profile           # 프로필 조회
│   ├── PUT /profile           # 프로필 수정
│   ├── POST /logout            # 로그아웃
│   └── POST /refresh           # 토큰 갱신
├── /blocks                    # 블록 관리
│   ├── GET /current           # 현재 블록
│   ├── GET /:id               # 블록 상세
│   ├── GET /                  # 블록 기록
│   ├── POST /                 # 블록 생성
│   ├── PUT /:id               # 블록 수정
│   └── POST /:id/process      # 블록 처리
├── /attempts                  # 시도 관리
│   ├── POST /:blockId          # 시도 제출
│   ├── GET /:blockId           # 블록 시도 목록
│   ├── GET /:blockId/stats      # 블록 통계
│   └── GET /user/my-attempts   # 내 시도 기록
└── /game                      # 게임 로직 (Supabase Edge Functions 대체)
    ├── POST /generate-block     # 블록 생성
    ├── POST /check-answer       # 정답 확인
    ├── GET /current            # 현재 블록
    ├── GET /rankings           # 랭킹
    └── GET /my-rank           # 내 랭킹
```

### 데이터베이스 스키마
```sql
users:         # 사용자 정보
sessions:      # 세션 관리
blocks:        # 게임 블록
attempts:      # 시도 기록
```

## 🧪 테스트

### 단위 테스트 실행
```bash
# 비즈니스 로직 테스트
pnpm test:unit

# 커버리지 확인
pnpm test:unit --coverage
```

### E2E 테스트
```bash
# 통합 테스트
pnpm test:e2e
```

## 🔧 개발 도구

### Prisma Studio
```bash
# 데이터베이스 시각화
pnpm prisma:studio
# http://localhost:5555 접속
```

### PgAdmin
```bash
# 웹 UI: http://localhost:5050
# 이메일: admin@brute-force.dev
# 비밀번호: admin
```

## 📝 API 사용 예제

### 사용자 등록
```bash
curl -X POST http://localhost:3001/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "nickname": "testuser",
    "password": "password123",
    "country": "KR"
  }'
```

### 익명 사용자 생성
```bash
curl -X POST http://localhost:3001/users/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "anonymous123"
  }'
```

### 블록 생성 (Supabase Edge Functions 대체)
```bash
curl -X POST http://localhost:3001/game/generate-block \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "length": "4",
    "charset": ["lowercase"]
  }'
```

### 정답 확인 (Supabase Edge Functions 대체)
```bash
curl -X POST http://localhost:3001/game/check-answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "blockId": "1",
    "answer": "test"
  }'
```

## ⚠️ 중요注意事项

### 보안
- JWT 시크릿 키는 프로덕션에서 반드시 변경하세요
- 데이터베이스 비밀번호를 안전하게 관리하세요
- HTTPS를 사용하여 API를 배포하세요

### 성능
- Redis는 세션 관리와 캐싱에 사용됩니다
- Rate limiting으로 API 보호
- 데이터베이스 인덱스 최적화됨

### 데이터 마이그레이션
- Supabase 마이그레이션 시 비밀번호는 이전되지 않습니다
- 마이그레이션 후 사용자들은 비밀번호 재설정 필요
- 세션 데이터는 마이그레이션되지 않음 (재로그인 필요)

## 🚀 배포

### 환경 변수
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
REDIS_URL="redis://:password@host:6379"
OPENAI_API_KEY="your-openai-api-key"
```

### Docker 빌드
```bash
# API 이미지 빌드
docker build -t brute-force-api apps/api/

# 컨테이너 실행
docker run -p 3001:3001 --env-file .env brute-force-api
```

## 🐛 트러블슈팅

### 공통 문제
1. **데이터베이스 연결 실패**: DATABASE_URL 확인
2. **Prisma 오류**: `pnpm prisma:generate` 실행
3. **인증 실패**: JWT 토큰 만료 확인
4. **Port 충돌**: 다른 포트 사용 확인

### 로그 확인
```bash
# API 로그
pnpm start:dev

# Docker 로그
docker-compose -f docker-compose.infra.yaml logs -f
```

## 📚 추가 문서

- [Prisma 문서](https://www.prisma.io/docs/)
- [NestJS 문서](https://docs.nestjs.com/)
- [JWT 인증 가이드](https://jwt.io/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## 🎉 마이그레이션 완료

축하합니다! Supabase에서 자체 호스팅 NestJS 백엔드로의 전체 마이그레이션이 완료되었습니다.

### 다음 단계
1. 프론트엔드 API 연결 수정
2. 프로덕션 환경 설정
3. 모니터링 및 로깅 설정
4. CI/CD 파이프라인 구축

문제가 있을 경우 이슈를 생성하거나 개발팀에 연락하세요.