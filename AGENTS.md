# BRUTE FORCE AI

**Generated:** 2026-01-22 | **Commit:** (latest) | **Branch:** main

## OVERVIEW

Social hacking simulation where global users compete to crack AI-generated passwords. High-stakes multiplayer competition powered by Next.js 16 and Supabase serverless architecture.

## STRUCTURE (Feature-Sliced Design)

```
brute-force/
├── app/            # Next.js App Router (Routes & Providers)
├── views/          # Page-level compositions (MainGame, Ranking)
├── widgets/        # Complex UI components (HackingConsole, LiveFeed)
├── features/       # User interactions (CheckAnswer, Auth, CPGauge)
├── entities/       # Business logic & data (Block, Attempt, Profile)
├── shared/         # Reusable infra (API clients, UI kit, Utils)
├── supabase/       # Edge Functions & DB Migrations
├── public/         # Assets & Sounds
└── docs/           # Specifications (PRD, Technical Docs)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Main Game UI | `app/(game)/page.tsx` | Entry point for the hacking interface |
| Game Views | `views/main-game-view/` | Core game layout and components |
| DB Schema | `supabase/migrations/` | PostgreSQL table definitions & RLS |
| Edge Functions| `supabase/functions/` | Server-side logic (Password hashing/checking) |
| Audio System | `shared/sounds/` | ZZFX-based sound engine |
| Global Styles | `app/globals.css` | Tailwind v4 configurations |
| Design Tokens | `docs/DESIGN_CONCEPTS.md` | Colors, typography, and "Hacker" aesthetic |

## CONVENTIONS

- **Architecture**: Strict FSD (Feature-Sliced Design). Avoid cross-imports within layers.
- **Dual Testing**: 
  - **Jest**: Backend logic & Supabase Edge Functions (`pnpm test`)
  - **Vitest**: Frontend UI, Hooks, and Storybook interactions
- **Dev Container**: Recommended environment for consistent toolchains (Docker required).
- **Deployment**: Migration-first. Always `supabase db push` before code deployment.
- **Path Alias**: Always use `@/*` (points to root `./*`).
- **State**: Server state via TanStack Query; client UI state via Zustand.

## ANTI-PATTERNS

- **Security**: Never expose `answer_hash` to client. RLS must restrict sensitive data.
- **TS Strictness**: No `as any`, `@ts-ignore`, or implicit `any` types.
- **Deployment**: Never deploy app code before database migrations are healthy.
- **Performance**: Avoid heavy computations in the main thread; use Framer Motion for animations.

## UNIQUE STYLES

- **Aesthetic**: "Clean-Tech Hacker" - Dark mode, high contrast, glitch effects.
- **CP System**: Computing Power (CP) limits attempts (Refills 1/min, Max 50).
- **Audio**: Retro procedural sounds using ZZFX (no heavy MP3s except background).

## COMMANDS

```bash
pnpm dev              # Start Next.js development server
pnpm build            # Production build
pnpm test             # Run Jest tests (Backend/Shared)
pnpm vitest           # Run Vitest (UI/Frontend)
pnpm storybook        # Launch Storybook

supabase start        # Start local Supabase environment
supabase db push      # Apply local migrations to remote
supabase functions serve [name] # Local Edge Function testing
```

## NOTES

- **MVP Status**: Focus on core loop (Generate Block -> Crack -> Refill CP).
- **Rate Limit**: Hard limit of 2 req/sec per user for `check-answer` to prevent brute-force scripts.
- **Anonymous**: Supports session-based anonymous cracking before signup.
