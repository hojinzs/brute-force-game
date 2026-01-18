# Dev Container Setup

이 프로젝트는 Dev Container를 사용하여 일관된 개발 환경을 제공합니다.

## 포함된 도구

- **Node.js 20**: Next.js 앱 실행
- **pnpm**: 패키지 관리자
- **Bun**: 고성능 JavaScript 런타임
- **Deno**: 보안 중심 JavaScript/TypeScript 런타임
- **Supabase CLI**: 로컬 Supabase 개발 환경
- **Docker-in-Docker**: 컨테이너 내에서 Docker 실행 지원
- **OpenCode**: SST의 OpenCode 편집기 (자동 설치)

## 시작하기

### VS Code / Cursor

1. [Dev Containers 확장](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) 설치
2. 프로젝트 열기
3. 명령 팔레트 (Cmd/Ctrl+Shift+P) → "Dev Containers: Reopen in Container"
4. 컨테이너가 빌드되고 시작될 때까지 대기

### OpenCode

OpenCode는 devcontainer feature를 통해 자동으로 설치됩니다. 인증이 필요한 경우, 호스트의 `~/.local/share/opencode/auth.json`이 자동으로 컨테이너에 마운트됩니다.

## Supabase 로컬 개발

```bash
# Supabase 서비스 시작
supabase start

# Supabase Studio 열기 (http://localhost:54323)
# API: http://localhost:54321
# DB: postgresql://postgres:postgres@localhost:54322/postgres
```

## 개발 서버 실행

```bash
# 의존성 설치 (자동으로 실행됨)
pnpm install

# 개발 서버 시작
pnpm dev
```

## 포트

- **3000**: Next.js 앱
- **54321**: Supabase API
- **54322**: Supabase DB (PostgreSQL)
- **54323**: Supabase Studio
- **54324**: Supabase Inbucket (이메일 테스트)

## 문제 해결

### Supabase 시작 실패

```bash
# Docker 데몬 확인
docker ps

# Supabase 재시작
supabase stop
supabase start
```

### 권한 문제

컨테이너는 `node` 사용자로 실행됩니다. 권한 문제가 발생하면:

```bash
sudo chown -R node:node /workspace
```

## 참고사항

- 컨테이너는 `network_mode: host`를 사용하여 Supabase와의 원활한 통신을 보장합니다
- Docker-in-Docker가 활성화되어 있어 Supabase의 Docker 기반 서비스를 실행할 수 있습니다
- 모든 도구는 `node` 사용자의 PATH에 포함되어 있습니다
