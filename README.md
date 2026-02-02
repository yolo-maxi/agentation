# VibeClaw

> **Annotate. Vibe. Claw.** Your new tool for Claw Driven Development.

VibeClaw is a visual feedback tool that lets you click on anything in your web app and tell AI agents exactly what to fix. No more describing "that button somewhere in the sidebar" - just click it, drop your feedback, and let your AI do the heavy lifting.

## Install

```bash
npm install vibeclaw -D
# or
pnpm add vibeclaw -D
```

## Usage

```tsx
import { VibeClaw } from 'vibeclaw';

function App() {
  return (
    <>
      <YourApp />
      <VibeClaw />
    </>
  );
}
```

A floating toolbar appears in the corner. Click to activate, then click any element to sink your claws into it.

## Features

- **Point & Claw** - Click any element, get automatic selector identification
- **Text Selection** - Highlight specific text to annotate
- **Multi-Select** - Drag to grab multiple elements at once
- **Area Selection** - Annotate any region, even empty space
- **Animation Freeze** - Pause CSS animations to capture that perfect moment
- **Structured Output** - Copy markdown with selectors, positions, and context
- **Dark/Light Mode** - Matches your vibe automatically
- **Zero Dependencies** - Pure CSS animations, no runtime bloat

## How It Works

VibeClaw captures class names, selectors, and element positions so AI agents can `grep` straight to the code you're talking about. Instead of writing paragraphs about "the blue button that appears after you scroll down a bit", you give your agent `.sidebar > button.primary` and your feedback.

It's like leaving a trail of breadcrumbs, except the breadcrumbs are CSS selectors and the birds are Claude.

## Claw Driven Development

The workflow is simple:

1. See something wrong? **Claw it.**
2. Add your feedback
3. Let your AI agent handle the rest

No more context-switching. No more "can you find the component where..." - just point, click, vibe.

## API Mode

Connect to [VibeClaw API](https://github.com/yolo-maxi/vibeClaw-api) for:

- **Multiplayer** - See your team's annotations in real-time
- **Auto-processing** - Integrate with Claude CLI for automatic fixes
- **Persistent storage** - Annotations survive page refreshes

```tsx
<VibeClaw
  apiMode
  apiEndpoint="https://your-api.vibeclaw.dev"
  editToken="your-token"
  multiplayerMode
/>
```

## Requirements

- React 18+
- Desktop browser (mobile support coming... eventually)

## Legacy Imports

If you're migrating from older versions:

```tsx
// These all work
import { VibeClaw } from 'vibeclaw';      // Recommended
import { Clawvibes } from 'vibeclaw';     // Legacy
import { Agentation } from 'vibeclaw';    // Legacy
```

## License

MIT - Go forth and claw responsibly.

---

*Built with vibes by the Clawdbot team. Inspired by the original [Agentation](https://github.com/benjitaylor/agentation) concept.*
