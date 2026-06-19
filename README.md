# BuddyRead

A quiet, dark-academia PWA for two friends — or a solo reader — to read the same
book and watch each other's progress on a shared **split progress card**.
Collaborative, never competitive: no streaks, no leaderboards, no gamification.

> Closeness over distance. When in doubt, make it quieter.

## Stack

Vite + React + TypeScript · Tailwind CSS v4 (CSS-variable tokens, class-based
dark mode) · React Router · `vite-plugin-pwa` (Workbox) · Firebase Auth +
Firestore · Google Books API · deployed on Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in once Firebase/Google Books exist (M1/M3)
npm run dev
```

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Vite dev server                               |
| `npm run build`   | Type-check + production build (+ SW/manifest) |
| `npm run preview` | Serve the production build locally            |
| `npm run lint`    | ESLint                                         |

## Docs

- **`CLAUDE.md`** — current state, commands, setup, architecture (kept lean).
- **`ProjectJourney.md`** — append-only logbook: decisions, trade-offs, Q&A.

## Status

v0 in progress. **M0 (scaffold + deployable PWA skeleton)** complete; auth,
friends, catalog, reads, and the split card follow in M1–M7.
