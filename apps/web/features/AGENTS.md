# FEATURES

**Generated:** 2026-01-22 | **Parent:** ../AGENTS.md

## OVERVIEW
User-facing actions and business logic that deliver core functionality.

## STRUCTURE
```
features/
├── auth/           # Authentication flows (signup, login, anonymous)
├── check-answer/   # Password submission validation
└── generate-block/  # New password creation
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Auth logic | `auth/model/use-auth.ts` | Session management, anonymous→registered |
| Submit answer | `check-answer/model/use-submit-answer.ts` | Client validation before API call |
| Password generation | `generate-block/api/genesis-action.ts` | Server-side block creation |
| Auth UI | `auth/ui/AuthForm.tsx` | Signup/login forms |

## CONVENTIONS
- **FSD Pattern**: Each feature has `model/`, `ui/`, `api/`, `index.ts`
- **Business Logic**: Orchestrated in `model/use-*.ts` hooks
- **API Calls**: Isolated in `api/` subdirectories
- **State**: Features don't directly manage global state (use shared/store)
- **Composition**: Features are composed by widgets, not other features