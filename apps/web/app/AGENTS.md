# APP LAYER AGENTS

**Generated:** 2026-01-22 | **Layer:** App Router

## OVERVIEW
Next.js App Router layer with route groups for server components, layouts, and auth flows.

## STRUCTURE (Route Groups)

```
app/
├── [locale]/            # Locale segment (internal, rewritten from /)
│   ├── (game)/          # Main game route group (hidden from URL)
│   │   ├── layout.tsx   # Game-specific layout
│   │   ├── page.tsx     # Main game entry (SERVER COMPONENT)
│   │   └── _components/ # Client components for game UI
│   ├── auth/
│   │   ├── signup/page.tsx  # User registration
│   │   └── callback/page.tsx # OAuth/callback handler
│   ├── history/
│   │   ├── layout.tsx   # History page layout
│   │   └── page.tsx     # User attempt history
│   ├── ranking/
│   │   ├── layout.tsx   # Ranking page layout
│   │   └── _components/ # Ranking client components
│   │   └── page.tsx     # Leaderboard display
│   └── settings/
│       └── page.tsx     # User settings
├── layout.tsx           # Root layout (global providers, fonts)
├── providers.tsx        # React Query & global providers
└── globals.css          # Global styles & Tailwind v4 config
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Main Game Entry | `[locale]/(game)/page.tsx` | Server component, NOT app/page.tsx |
| Server-side Data Fetch | `[locale]/(game)/page.tsx` | `createServerSupabaseClient()` pattern |
| Auth Callback | `[locale]/auth/callback/page.tsx` | OAuth session handling, redirect logic |
| Query Client Config | `providers.tsx` | TanStack Query defaults (60s staleTime) |
| Game Layout | `[locale]/(game)/layout.tsx` | Game-specific providers, styles |
| Global Layout | `layout.tsx` | Root-level providers, fonts, HTML structure |

## CONVENTIONS

- **Route Groups**: Parenthesized folders `(game)` are URL segments not visible in path
- **Server Components Default**: All pages in `app/` are server components by default
- **Client Components**: Use `"use client"` directive in `_components/` or specific pages
- **Data Fetching**: Server-side via `createServerSupabaseClient()` in RSC; client-side via TanStack Query
- **Dynamic Routes**: `export const dynamic = "force-dynamic"` for pages requiring fresh data
- **Provider Pattern**: Global providers in `providers.tsx`, route-specific in `layout.tsx`
- **Type Imports**: Import types from `@/entities/*`, never use `any`
