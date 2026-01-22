# VIEWS

**OVERVIEW**: Page-level view compositions that assemble widgets into complete game screens.

## STRUCTURE

```
views/
├── main-game-view/        # Primary hacking interface
├── genesis-block-view/    # Initial block creation
├── loading-game-view/     # Game loading state
├── processing-block-view/ # Block computation in progress
├── winner-block-view/     # Successful crack celebration
└── index.ts               # Barrel export of all views
```

Each view follows FSD pattern:
- `ui/` - View component files
- `index.ts` - Public export

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Main game interface | `main-game-view/ui/MainGameView.tsx` | Primary game entry point |
| Genesis block form | `genesis-block-view/ui/GenesisBlockForm.tsx` | First block creation UI |
| Loading screen | `loading-game-view/ui/LoadingGameView.tsx` | Pre-game state |
| Processing animation | `processing-block-view/ui/ProcessingBlockView.tsx` | Hash computation display |
| Winner celebration | `winner-block-view/ui/WinnerBlockView.tsx` | Success feedback |

## CONVENTIONS

- **Composition**: Views compose widgets from `widgets/` layer, never import features directly
- **No Business Logic**: Views handle layout and assembly only; game logic lives in features layer
- **Export Pattern**: Each view exports default component via index.ts for barrel imports
- **Pure Presentation**: Views receive data as props, no data fetching or state mutations
