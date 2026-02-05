# Brute Force AI

Global multiplayer password-cracking game where all users compete to crack the same AI-generated password.

## Getting Started

### Option 1: Dev Container (권장)

Dev Container를 사용하면 모든 도구가 사전 설치된 일관된 개발 환경을 제공합니다.

**요구사항:**
- Docker Desktop
- VS Code / Cursor with Dev Containers extension

**시작하기:**
1. VS Code/Cursor에서 프로젝트 열기
2. "Dev Containers: Reopen in Container" 실행
3. 컨테이너 빌드 완료 후 자동으로 `pnpm install` 실행됨
4. 인프라 시작: `docker-compose -f docker-compose.infra.yaml up -d`
5. API 서버 시작: `pnpm --filter api start:dev`
6. Web 서버 시작: `pnpm --filter web dev`

자세한 내용은 [.devcontainer/README.md](.devcontainer/README.md)를 참고하세요.

### Option 2: 로컬 설치

**Prerequisites:**
- Node.js 20+ & pnpm
- Docker Desktop

### 1. Start Local Infrastructure

```bash
docker-compose -f docker-compose.infra.yaml up -d
```

This will start PostgreSQL, Redis, and PgAdmin in Docker.

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Servers

```bash
pnpm --filter api start:dev
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development Workflow

### Database Management

```bash
pnpm --filter api prisma:migrate      # Apply migrations
pnpm --filter api prisma:generate     # Re-generate Prisma client
pnpm --filter api prisma:seed         # Seed local data
```

### Testing

```bash
pnpm test                  # Run all tests
pnpm test:watch            # Watch mode
pnpm test:coverage         # Coverage report
```

### Admin CLI

The API includes administrative CLI commands for game management.

#### Create Genesis Block

Creates the first block to start the game. Can only be run once when no blocks exist.

```bash
# From project root
pnpm --filter api cli create-genesis --password "your-secret-password" --hint "A hint for players"


pnpm --filter ./apps/api cli create-genesis --password "123456" --hint "this is the begin"

# Options:
#   --password <string>  Required. The password to crack.
#   --hint <string>      Required. A hint for players.
#   --length <number>    Optional. Override password length in difficulty config.
#   --charset <string>   Optional. Override charset (e.g., "lowercase,alphanumeric").
#                        If not specified, auto-detected from password.

# Example with explicit difficulty:
pnpm --filter api cli create-genesis \
  --password "Secret123!" \
  --hint "A mixed case secret" \
  --length 10 \
  --charset "lowercase,uppercase,alphanumeric,symbols"
```

## Project Structure

```
brute-force/
├── apps/
│   ├── api/               # NestJS backend
│   └── web/               # Next.js frontend
├── docs/                  # Product specs, design guide
└── public/                # Static assets
```

## Tech Stack

- **Frontend**: Next.js 16, Tailwind CSS v4, Motion (Framer Motion)
- **Backend**: NestJS, Prisma, PostgreSQL, Redis
- **State**: TanStack Query, Zustand
- **Testing**: Jest, Vitest
- **AI**: ChatGPT 4.1 mini

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm test             # Run tests

docker-compose -f docker-compose.infra.yaml up -d  # Start infra
```

## Deployment

### Migration Order (Critical)

When deploying changes that involve both database schema and application code:

1. **Apply migrations first**: Run `pnpm --filter api prisma:migrate` to ensure schema changes are applied
2. **Deploy code changes**: Deploy backend and frontend after migrations complete

**Why this matters**: Deploying code that references new database columns before migrations are applied will cause runtime errors.

**Example workflow**:
```bash
# 1. Ensure database is up to date
pnpm --filter api prisma:migrate

# 2. Deploy backend
pnpm --filter api build

# 3. Deploy application code
pnpm --filter web build
```

### Production Deployment Checklist

- [ ] All database migrations applied (`pnpm --filter api prisma:migrate`)
- [ ] Backend deployed with correct environment variables
- [ ] Application build passes (`pnpm build`)
- [ ] Smoke tests pass on production environment

## Documentation

See `docs/` for detailed specifications:
- `PRODUCT_REQUIREMENTS_DOCUMENT.md` - Full PRD (Korean)
- `TECHNICAL_REQUIREMENTS_DOCUMENTS.md` - Architecture, data model
- `DESIGN_CONCEPTS.md` - Design tokens, colors, typography
- `SYSTEM_POLICIES.md` - Race conditions, abuse prevention
- `AGENT_GUIDELINES.md` - Quick reference for development

## License

MIT
