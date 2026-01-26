# WIDGETS

**Generated:** 2026-01-22 | **Parent:** ../AGENTS.md

## OVERVIEW
Self-contained UI blocks that compose features and entities into functional units.

## STRUCTURE
```
widgets/
├── hacking-console/  # Core game interface (180+ lines)
├── live-feed/       # Real-time attempt updates
├── stats-panel/     # CP display and leaderboards
└── onboarding/      # New user guidance
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Game engine | `hacking-console/model/use-hacking-console.ts` | 13 hooks, central game logic |
| Terminal UI | `hacking-console/ui/HackingConsoleView.tsx` | Motion animations, error states |
| Live updates | `live-feed/ui/LiveFeed.tsx` | Real-time feed via Supabase |
| CP display | `stats-panel/ui/StatsPanel.tsx` | Computing Power gauge |
| Onboarding | `onboarding/ui/OnboardingView.tsx` | New user tutorial |

## CONVENTIONS
- **FSD Pattern**: `model/` for logic, `ui/` for components, `index.ts` exports
- **Composition**: Widgets combine features + entities, never other widgets
- **Complexity**: HackingConsole is most complex (13 hooks, animations)
- **Motion**: Framer Motion for interactions and shake effects
- **No Business Logic**: UI components only orchestrate feature hooks