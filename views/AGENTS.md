# VIEWS

**Generated:** 2026-01-22 | **Parent:** ../AGENTS.md

## OVERVIEW
Page-level compositions that assemble widgets into complete screens.

## STRUCTURE
```
views/
├── main-game-view/      # Primary game interface
└── genesis-block-view/  # Initial game state
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Game layout | `main-game-view/ui/MainGameView.tsx` | Composes hacking console, stats, feed |
| Initial state | `genesis-block-view/ui/GenesisBlockView.tsx` | First-time user experience |
| Page routing | Uses Next.js App Router in `app/(game)/page.tsx` | Server-side data fetching |

## CONVENTIONS
- **FSD Pattern**: `ui/` for components, `index.ts` for exports
- **Page Assembly**: Views compose multiple widgets into full screens
- **No State Management**: Views orchestrate widget composition only
- **Server-Client**: Data fetched in app routes, passed as props
- **Single Responsibility**: Each view represents one major screen