# BRUTE FORCE AI

**Generated:** 2026-01-14 | **Commit:** ff2f5c5 | **Branch:** main

## OVERVIEW

Social hacking simulation where global users compete to crack AI-generated passwords. Next.js 16 + Supabase serverless architecture. MVP stage.

## STRUCTURE

```
brute-force/
├── app/           # Next.js App Router (page.tsx, layout.tsx, globals.css)
├── docs/          # Product specs, design guide, policies (READ THESE FIRST)
├── public/        # Static assets (SVGs)
└── configs        # tsconfig, eslint, postcss, next.config
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| UI entry | `app/page.tsx` | Main landing, edit here to start |
| Layout/fonts | `app/layout.tsx` | Geist fonts configured |
| Global styles | `app/globals.css` | Tailwind v4 import |
| Product requirements | `docs/PRODUCT_REQUIREMENTS_DOCUMENT.md` | Korean, full PRD |
| Technical spec | `docs/TECHNICAL_REQUIREMENTS_DOCUMENTS.md` | DB schema, edge functions |
| Design tokens | `docs/DESIGN_CONCEPTS.md` | Colors, typography, animations |
| Edge cases | `docs/SYSTEM_POLICIES.md` | Race conditions, abuse prevention |
| Quick reference | `docs/AGENT_GUIDELINES.md` | Condensed tech stack & tokens |

## CONVENTIONS

### Stack (from docs)
- Frontend: Next.js 16+ (App Router), Tailwind CSS, Motion (Framer Motion)
- Backend: Supabase (Edge Functions, Realtime, Auth, PostgreSQL)
- State: TanStack Query, Supabase Client SDK
- AI: ChatGPT 4.1 mini

### Path Alias
```json
"@/*": ["./*"]  // Use @/app/*, @/components/*, etc.
```

### Styling
- Tailwind v4 via `@tailwindcss/postcss`
- Dark mode: `prefers-color-scheme` based (see globals.css)
- Design tokens defined in `docs/DESIGN_CONCEPTS.md`:
  - Background: `#0f172a`, Surface: `#1e293b`
  - Primary: `#3b82f6`, Success: `#10b981`
  - Fonts: Pretendard (UI), JetBrains Mono (data/logs)

### TypeScript
- Strict mode enabled
- Target: ES2017, JSX: react-jsx
- No `as any`, `@ts-ignore`, `@ts-expect-error`

## ANTI-PATTERNS

- Never expose `answer_hash` to client (RLS restricts to service_role only)
- Never store plaintext passwords in DB (salted hash only)
- Rate limit: 2 req/sec per user for `check-answer`

## COMMANDS

```bash
pnpm dev      # Start dev server (http://localhost:3000)
pnpm build    # Production build
pnpm lint     # ESLint check
pnpm start    # Start production server
```

## NOTES

- MVP stage: Focus on core loop validation
- Supabase Edge Functions not yet implemented
- Design specifies "Clean-Tech Hacker" aesthetic with glitch animations
- CP (Computing Power) system: time-based refill, 1/min, max 50
- All docs are in Korean except AGENT_GUIDELINES.md
