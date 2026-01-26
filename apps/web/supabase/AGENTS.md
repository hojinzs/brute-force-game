# SUPABASE

## OVERVIEW
Serverless backend: Edge Functions, PostgreSQL migrations, shared utilities for password verification game logic.

## STRUCTURE

```
supabase/
├── functions/
│   ├── check-answer/         # Critical: CP consumption, answer validation, rate limiting
│   ├── generate-block/       # Block generation with AI password
│   └── _shared/
│       ├── utils/            # similarity.ts, crypto.ts, charset.ts
│       ├── cli/              # test-similarity.ts - local similarity testing
│       └── __tests__/        # Jest tests for _shared utilities
├── migrations/               # 19 sequential migrations (RLS, functions, views)
└── config.toml               # Supabase CLI configuration
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Password verification | `functions/check-answer/index.ts` | CP consume → similarity check → points award |
| Similarity algorithm | `functions/_shared/utils/similarity.ts` | String comparison for hints |
| Crypto utilities | `functions/_shared/utils/crypto.ts` | Password hashing (answer_hash) |
| Atomic operations | `migrations/*_atomic.sql` | Race-condition safe attempt insertion |
| CP refund logic | `migrations/20260118200000_add_refund_cp_function.sql` | Refunds on inactive blocks |

## CONVENTIONS

- **Migration-First**: Always `supabase db push` before deploying Edge Functions
- **Rate Limiting**: Hard limit 2 req/sec per user in check-answer (in-memory Map)
- **Atomic Operations**: Use RPC functions (`insert_attempt_atomic`, `consume_cp`) to prevent race conditions
- **Testing**: Jest for _shared utilities; run with `pnpm test` (root level)

## ANTI-PATTERNS

- **Schema Drift**: Never deploy Edge Functions before migrations (code references columns like `solved_attempt_id`)
- **Race Conditions**: Avoid direct INSERT to `attempts`; use `insert_attempt_atomic()` RPC
- **Client-Side Hashing**: Never expose `answer_hash` or `answer_plaintext` to client
- **CP Leaks**: Always refund CP on BLOCK_INACTIVE errors before returning response
