# Dev Container 테스트 가이드

이 문서는 dev container 설정이 올바르게 작동하는지 확인하는 방법을 안내합니다.

## 사전 요구사항

- Docker Desktop 실행 중
- VS Code 또는 Cursor 설치
- Dev Containers 확장 설치

## 테스트 단계

### 1. Dev Container 빌드 및 시작

```bash
# VS Code/Cursor 명령 팔레트에서:
Dev Containers: Reopen in Container
```

**예상 결과:**
- 컨테이너가 빌드됨
- `post-create.sh` 스크립트가 자동 실행됨
- `pnpm install`이 자동으로 완료됨

### 2. 도구 설치 확인

컨테이너 터미널에서:

```bash
# Node.js 확인
node --version
# 예상: v20.x.x

# pnpm 확인
pnpm --version
# 예상: 최신 버전

# Bun 확인
bun --version
# 예상: 1.x.x

# Deno 확인
deno --version
# 예상: deno 1.x.x

# Supabase CLI 확인
supabase --version
# 예상: 1.x.x
```

**예상 결과:** 모든 도구가 설치되어 있고 버전이 출력됨

### 3. Supabase 로컬 시작

```bash
supabase start
```

**예상 결과:**
- Docker 컨테이너들이 시작됨 (PostgreSQL, Studio, etc.)
- API keys와 서비스 URLs가 출력됨
- 다음 URL들이 접근 가능:
  - Studio: http://localhost:54323
  - API: http://localhost:54321
  - DB: postgresql://postgres:postgres@localhost:54322/postgres

### 4. Supabase 서비스 확인

```bash
supabase status
```

**예상 결과:** 모든 Supabase 서비스가 "running" 상태

### 5. 개발 서버 시작

```bash
pnpm dev
```

**예상 결과:**
- Next.js 개발 서버가 http://localhost:3000 에서 시작됨
- 포트가 자동으로 포워딩됨
- 브라우저에서 앱 접근 가능

### 6. 환경 변수 확인

```bash
cat .env.local
```

**예상 결과:** `.env.local` 파일이 생성되어 있음 (템플릿)

### 7. Docker-in-Docker 확인

```bash
docker ps
```

**예상 결과:** Supabase 컨테이너들이 표시됨

### 8. OpenCode 설정 (선택사항)

호스트에 `~/.config/opencode`가 있는 경우:

```bash
# 컨테이너 내부에서
ls -la ~/.config/opencode
```

**예상 결과:** 
- override 파일 사용 시: OpenCode 설정이 마운트됨
- override 파일 미사용 시: 디렉토리는 존재하지만 비어있음

## 문제 해결

### Docker 데몬 연결 실패

```bash
# 호스트에서 Docker Desktop이 실행 중인지 확인
docker ps

# 컨테이너 재시작
Dev Containers: Rebuild Container
```

### Supabase 시작 실패

```bash
# 기존 Supabase 정리
supabase stop
docker system prune -f

# 다시 시작
supabase start
```

### 권한 문제

```bash
# 파일 소유권 확인
ls -la /workspace

# 필요시 소유권 변경 (컨테이너 내부)
sudo chown -R node:node /workspace
```

### 포트 충돌

```bash
# 호스트에서 포트 사용 확인
lsof -i :3000
lsof -i :54321

# 사용 중인 프로세스 종료 후 재시도
```

## 성공 기준

- ✅ 모든 도구 (node, pnpm, bun, deno, supabase) 설치 확인
- ✅ `supabase start` 성공적으로 실행
- ✅ Supabase Studio (http://localhost:54323) 접근 가능
- ✅ `pnpm dev` 성공적으로 실행
- ✅ Next.js 앱 (http://localhost:3000) 접근 가능
- ✅ Docker-in-Docker 작동 (`docker ps` 실행 가능)
- ✅ OpenCode 설정 마운트 (선택사항)

## 참고

테스트 중 문제가 발생하면:
1. `.devcontainer/README.md` 확인
2. 컨테이너 로그 확인 (VS Code 출력 패널)
3. Docker Desktop 로그 확인
