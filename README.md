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
4. `supabase start` 로 로컬 Supabase 시작
5. `pnpm dev` 로 개발 서버 시작

자세한 내용은 [.devcontainer/README.md](.devcontainer/README.md)를 참고하세요.

### Option 2: 로컬 설치

**Prerequisites:**
- Node.js 20+ & pnpm
- Docker Desktop
- Supabase CLI (`brew install supabase/tap/supabase`)

### 1. Start Local Supabase

```bash
supabase start
```

This will start all Supabase services in Docker:
- **Studio**: http://127.0.0.1:54323
- **API**: http://127.0.0.1:54321
- **Database**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Credentials will be displayed after startup. Copy the keys to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable_key_from_supabase_start>
SUPABASE_SECRET_KEY=<secret_key_from_supabase_start>
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development Workflow

### Database Management

```bash
supabase db reset          # Reset database (deletes all data)
supabase db push           # Apply migrations
supabase migration new     # Create new migration
```

### Edge Functions

```bash
supabase functions serve check-answer    # Test function locally
```

Test with curl:
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/check-answer' \
  --header 'Authorization: Bearer <your_jwt_token>' \
  --header 'Content-Type: application/json' \
  --data '{"inputValue":"123456","blockId":1}'
```

### Testing

```bash
pnpm test                  # Run all tests
pnpm test:watch            # Watch mode
pnpm test:coverage         # Coverage report
```

### CLI Tools

Test similarity algorithm:
```bash
npx tsx supabase/functions/_shared/cli/test-similarity.ts "input" "answer"
```

## Project Structure

```
brute-force/
├── app/                   # Next.js App Router
├── docs/                  # Product specs, design guide
├── supabase/
│   ├── functions/         # Edge Functions
│   │   ├── check-answer/  # Password verification
│   │   └── _shared/       # Shared utilities & tests
│   └── migrations/        # Database migrations
└── public/                # Static assets
```

## Tech Stack

- **Frontend**: Next.js 16, Tailwind CSS v4, Motion (Framer Motion)
- **Backend**: Supabase (Edge Functions, Realtime, Auth, PostgreSQL)
- **State**: TanStack Query, Supabase Client SDK
- **Testing**: Jest, ts-jest
- **AI**: ChatGPT 4.1 mini

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm test             # Run tests

supabase start        # Start Supabase stack
supabase stop         # Stop Supabase stack
supabase status       # Show service status
```

## Deployment

### Migration Order (Critical)

When deploying changes that involve both database schema and application code:

1. **Apply migrations first**: Run `supabase db push` to ensure schema changes are applied
2. **Deploy code changes**: Deploy Edge Functions and application code after migrations complete

**Why this matters**: Deploying code that references new database columns before migrations are applied will cause runtime errors. For example, the `check-answer` Edge Function references `solved_attempt_id` column which requires the `20260119000001_add_solved_attempt_id_fk.sql` migration to run first.

**Example workflow**:
```bash
# 1. Ensure database is up to date
supabase db push

# 2. Deploy Edge Functions
supabase functions deploy check-answer

# 3. Deploy application code
pnpm build && (your deployment command)
```

### Production Deployment Checklist

- [ ] All database migrations applied (`supabase db push`)
- [ ] Edge Functions deployed with correct environment variables
- [ ] Application build passes (`pnpm build`)
- [ ] Smoke tests pass on production environment

## Documentation

See `docs/` for detailed specifications:
- `PRODUCT_REQUIREMENTS_DOCUMENT.md` - Full PRD (Korean)
- `TECHNICAL_REQUIREMENTS_DOCUMENTS.md` - DB schema, Edge Functions
- `DESIGN_CONCEPTS.md` - Design tokens, colors, typography
- `SYSTEM_POLICIES.md` - Race conditions, abuse prevention
- `AGENT_GUIDELINES.md` - Quick reference for development

## License

MIT
