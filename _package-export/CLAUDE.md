# Agentation Package

This is the publishable npm package. Changes here affect everyone who installs `agentation`.

## Critical Rules

1. **NEVER run `npm publish`** - Only publish when explicitly instructed
2. **NEVER bump version** in package.json without explicit instruction
3. **NEVER modify exports** in index.ts without discussing breaking changes

## What Gets Published

- `dist/` folder (compiled from `src/`)
- `package.json`, `README.md`, `LICENSE`

## Before Modifying `src/`

- Consider: Is this a breaking change?
- Consider: Does this affect the API surface?
- Consider: Will existing users' code still work?

## Structure

```
src/
├── index.ts           # Main exports
├── types.ts           # TypeScript types (Annotation, etc.)
├── components/
│   ├── icons.tsx      # SVG icons
│   ├── annotation-popup/       # Popup with framer-motion (optional export)
│   ├── annotation-popup-css/   # Popup with CSS animations
│   └── page-toolbar-css/       # Main floating toolbar (CSS-only)
└── utils/
    ├── element-identification.ts  # Smart DOM element naming
    └── storage.ts                 # localStorage helpers
```

## Exports

- **`Agentation`** — The main component. CSS-only animations, no framer-motion.
- **`AnnotationPopup`** — Optional export for custom UIs. Uses framer-motion (optional peer dep).

## Testing Changes

1. Run `pnpm build` to ensure it compiles
2. Check the example app still works: `pnpm dev`
3. Verify no TypeScript errors in consumers

## Before v1 Release

See PLAN.md for detailed roadmap.
