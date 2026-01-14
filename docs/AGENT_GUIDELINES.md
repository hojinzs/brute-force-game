# Agent Guidelines: Brute Force AI

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16+ (App Router), Tailwind CSS, Motion (Framer Motion) |
| Backend | Supabase (Edge Functions, Realtime, Auth, PostgreSQL) |
| State | TanStack Query, Supabase Client SDK |
| AI | ChatGPT 4.1 mini / Gemini API |
| Hosting | Vercel (Frontend), Supabase (Backend) |

## Design Tokens

```css
/* Colors */
--bg-color: #0f172a;        /* Deep Slate - main background */
--surface-color: #1e293b;   /* Slate 800 - cards, inputs */
--border-color: #334155;    /* Slate 700 - borders */
--primary-color: #3b82f6;   /* Electric Blue - actions */
--success-color: #10b981;   /* Emerald - success, high similarity */
--warning-color: #f59e0b;   /* Amber - timer, medium similarity */
--danger-color: #ef4444;    /* Rose - errors, low similarity */
--text-main: #f8fafc;       /* Near White - primary text */
--text-dim: #94a3b8;        /* Slate 400 - secondary text */

/* Typography */
--font-ui: 'Pretendard', 'Inter', sans-serif;
--font-data: 'JetBrains Mono', 'Fira Code', monospace;

/* Sizing */
--radius: 12px;
--focus-ring: 2px solid var(--primary-color);
```

## DB Schema

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User metadata & CP | `id`, `nickname`, `cp_count`, `last_cp_refill_at` |
| `blocks` | Hack targets | `id`, `status`, `seed_hint`, `answer_hash`, `winner_id` |
| `attempts` | Global answer logs | `block_id`, `user_id`, `input_value`, `similarity` |

## Edge Functions

| Function | Purpose |
|----------|---------|
| `check-answer` | Validate answer, deduct CP, calculate similarity |
| `generate-block` | Generate new password via AI from seed hint |

## Security Rules

- `answer_hash`: Only accessible by `service_role` (RLS)
- Rate limit: 2 requests/second per user
- Passwords stored as salted hash only

## References

- Product: `docs/PRODUCT_REQUIREMENTS_DOCUMENT.md`
- Technical: `docs/TECHNICAL_REQUIREMENTS_DOCUMENTS.md`
- Design: `docs/DESIGN_CONCEPTS.md`
- Policies: `docs/SYSTEM_POLICIES.md`
