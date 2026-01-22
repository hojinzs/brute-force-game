# ENTITIES LAYER

## OVERVIEW
Business logic and domain models for the game's core data structures.

## STRUCTURE

```
entities/
├── block/          # Active password challenges
├── attempt/        # User guess history
├── profile/        # User credentials & CP
└── ranking/        # Leaderboard data
```

## WHERE TO LOOK

| Domain | Types | Hooks | UI |
|--------|-------|-------|-----|
| **block** | `Block`, `DifficultyConfig` | `useCurrentBlock`, `useBlockSubscription`, `useBlockHistory` | `BlockHeader` |
| **attempt** | `Attempt`, `Similarity` | `useAttempts` | `AttemptCard` |
| **profile** | `Profile`, `CP` | (read-only type) | - |
| **ranking** | `RankingEntry`, `UserRank` | `useTopRanking`, `useMyRank`, `useRankingInfinite` | - |

## CONVENTIONS

- **FSD Pattern**: Each entity follows `model/`, `ui/`, `index.ts` structure
- **Types**: All TypeScript types defined in `model/types.ts`
- **Hooks**: Named `use-*.ts` (kebab-case) in `model/` directory
- **Public API**: Exposed only through root `index.ts` barrel exports
- **Separation**: Business logic in model, presentation in ui, no cross-layer imports
- **Subscriptions**: Real-time updates via Supabase subscriptions in block entity
