# CLAUDE.md

Machine-facing, current-state-only guide. Keep lean; prune stale sections each milestone.

## What this is

**BuddyRead** — a dark-academia PWA for two friends (or a solo reader) to read the same book and watch each other's progress on a quiet, shared **split progress card**. Collaborative, never competitive: no streaks, no leaderboards, no gamification. Tone: dry, warm, occasionally witty. When in doubt, make it quieter.

## Operating rules (always)

1. **Never `git push` without asking.** Commit freely; pushing needs explicit yes.
2. **Never merge a branch without asking.** Propose, wait.
3. Write **Conventional Commits** (`feat/fix/chore/docs/refactor`), small and atomic, explaining *why*.
4. Work on **feature branches** (`feat/...`); `main` stays deployable.
5. **Ask before**: heavy/non-obvious deps, data-model changes once set, destructive git (force-push, branch delete, history rewrite, `reset --hard`).
6. **Never commit secrets.** `.env.local` is gitignored; keep `.env.example` current.
7. **Minimum intervention.** Make sensible reversible calls, document them, keep moving. Pause only for the above or genuinely ambiguous product calls.
8. After each milestone: update this file + append a chapter to `ProjectJourney.md`, then propose a commit.

## Stack

- **Vite 8 + React 19 + TypeScript 6**
- **Tailwind CSS v4** (CSS-first via `@tailwindcss/vite`; tokens in `src/index.css`, class-based dark mode through `@custom-variant dark`)
- **Routing:** React Router v7 (`react-router-dom`)
- **PWA:** `vite-plugin-pwa` (Workbox), `registerType: 'autoUpdate'`, standalone, offline app shell, book-covers runtime-cached
- **Backend (M1+):** Firebase Auth (Google only) + Cloud Firestore. No Firebase Hosting, no Cloud Functions in v0.
- **Catalog (M3+):** Google Books API, Open Library cover fallback
- **Deploy:** Vercel (SPA rewrite in `vercel.json`)

## Commands

```bash
npm run dev       # local dev server (Vite)
npm run build     # tsc -b && vite build  (also emits SW + manifest)
npm run preview   # serve the production build locally
npm run lint      # eslint
```

## Env vars

All client keys are `VITE_*` (see `.env.example`). Copy to `.env.local` for local dev; set the same in the Vercel project. Firebase + Google Books keys land in M1/M3.

## Setup steps (deferred until their milestone)

- **Firebase (M1):** create project → enable Google Auth provider → create Firestore (production mode) → copy web-app config into `VITE_FIREBASE_*`. Add Vercel domain to Auth > Authorized domains.
- **Google Books (M3):** create API key in Google Cloud → **restrict by HTTP referrer** (localhost + Vercel domains) → put in `VITE_GOOGLE_BOOKS_API_KEY`.
- **Firestore composite indexes:** record here as queries demand them (none yet).

## Architecture (current)

```
src/
  main.tsx            React root
  App.tsx             ThemeProvider + Router (all routes public for now)
  index.css           Tailwind import + design tokens (@theme) + dark variant
  vite-env.d.ts       env typings + PWA client types
  theme/              theme-context.ts, ThemeProvider.tsx, useTheme.ts, ThemeToggle.tsx
  components/         Logo.tsx, AppShell.tsx
  pages/              Welcome.tsx (/), Home.tsx (/home), NotFound.tsx (*)
public/               favicon.svg, icon.svg, icon-maskable.svg
```

Theme: preference (`light|dark|system`) lives in `localStorage` under `buddyread:theme`; `ThemeProvider` resolves `system` live and toggles `.dark` on `<html>`. M1 will mirror this into `users/{uid}.theme`.

## Data model (target — not yet built)

Firestore collections planned: `users/{uid}` (+ `friends` subcollection), `friendRequests/{id}`, `reads/{id}` (unified solo + buddy, flat `participantUids` array for rules/queries, per-person `participants` map). Snapshot book metadata into the read at creation. Tight security rules from M1. Full shape in the kickoff prompt / `ProjectJourney.md`.

## Design system

Dark academia, "3 Cs" (cohesive, classy, consistent). Warm brown/olive/cream, candlelit. **One muted accent, never bright.** Display serif **Fraunces**, body sans **Inter**. Tokens: `bg, surface, surface-alt, text, text-muted, border, accent, accent-contrast, bar-track, bar-fill` — used as Tailwind colors (`bg-bg`, `text-text-muted`, etc.). Generous whitespace, hairline borders over shadows, restrained motion (`prefers-reduced-motion` honoured).

## Current focus / next up

- **Done — M0:** scaffold, tokens + theme toggle, app shell, routing skeleton, PWA (installable, SW), docs, Vercel config. Build + lint green.
- **Next — M1:** Firebase init, Google sign-in, protected routes, user-doc creation with generated invite code, basic profile page.
- Pending external (user): create Firebase project; create Vercel project + deploy to prove the pipeline; later, Google Books key.
