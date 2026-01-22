# SHARED

**Generated:** 2026-01-22 | **Parent:** ../AGENTS.md

## OVERVIEW
Cross-cutting utilities, reusable components, and infrastructure shared across features.

## STRUCTURE
```
shared/
├── api/        # Supabase client and API utilities
├── ui/          # Reusable UI atoms (LoadingSpinner, CountdownTimer)
├── store/       # Zustand global state management
├── sounds/       # ZZFX audio system and event emitter
├── lib/         # Pure utilities (crypto, validation)
└── config/      # Constants and configuration
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Supabase client | `api/supabase-client.ts` | Main DB client initialization |
| Global state | `store/game-store.ts` | Zustand store for app-wide state |
| Audio system | `sounds/manager.ts` | ZZFX procedural sound engine |
| UI atoms | `ui/LoadingSpinner.tsx` | Generic components without business logic |
| Crypto utils | `lib/crypto.ts` | Hashing and similarity algorithms |
| Sounds | `sounds/ui/` | Procedural sound effects (no MP3s) |

## CONVENTIONS
- **No Business Logic**: Shared layer only provides utilities
- **Zustand**: All global state managed in `store/`
- **ZZFX**: Procedural audio via `emitSoundEvent` events
- **Reusability**: UI components must work across different contexts
- **API Client**: Single source of truth for Supabase configuration