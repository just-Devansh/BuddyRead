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

All client keys are `VITE_*` (see `.env.example`). Copy to `.env.local` for local dev; set the same in the Vercel project. Firebase keys are set (`buddyread-1121`); Google Books key lands in M3.

## Setup steps

- **Firebase (M1) — config DONE (`buddyread-1121`).** Still required in the console to work end to end:
  1. **Authentication → Sign-in method → enable Google** (set a support email).
  2. **Firestore Database → create** in production mode (region e.g. `asia-south1`).
  3. **Deploy `firestore.rules`:** paste into Firestore → Rules tab and Publish, or `firebase deploy --only firestore:rules`.
  4. `localhost` is an authorized domain by default; add the Vercel domain when deployed.
- **Google Books (M3):** create API key in Google Cloud → **restrict by HTTP referrer** (localhost + Vercel domains) → put in `VITE_GOOGLE_BOOKS_API_KEY`.
- **Firestore composite indexes:** record here as queries demand them (none yet).

## Architecture (current)

```
src/
  main.tsx            React root
  App.tsx             Auth + Theme providers + DeviceFrame + Router
  index.css           Tailwind import + design tokens (@theme) + dark variant
  vite-env.d.ts       env typings + PWA client types
  lib/                firebase.ts (init), users.ts (user doc + invite code), inviteCode.ts
  auth/               auth-context.ts, AuthProvider.tsx, useAuth.ts, RequireAuth.tsx
  theme/              theme-context.ts, ThemeProvider.tsx, useTheme.ts, ThemeToggle.tsx, ThemeSync.tsx
  components/         DeviceFrame.tsx (mobile/iPad cap), AppShell.tsx, Logo.tsx, Avatar.tsx, Splash.tsx
  pages/              Welcome.tsx (/), Home.tsx (/home), Profile.tsx (/profile), NotFound.tsx (*)
public/               favicon.svg, icon.svg, icon-maskable.svg
firestore.rules       Firestore security rules (deploy to console)
```

Auth: `AuthProvider` tracks `onAuthStateChanged`, ensures the `users/{uid}` doc on first sign-in, and subscribes to it live. `/home` and `/profile` sit behind `RequireAuth`; `/` redirects to `/home` when signed in.

Theme: preference (`light|dark|system`) lives in `localStorage` under `buddyread:theme`; `ThemeProvider` resolves `system` live and toggles `.dark` on `<html>`. `ThemeSync` mirrors it to/from `users/{uid}.theme` — account wins once on sign-in, local changes write back up.

## Data model (Firestore)

Implemented (M1):
- `users/{uid}` — `displayName, email, photoURL, username, inviteCode, theme, createdAt`.
- `inviteCodes/{code}` — `{ uid, createdAt }`. A lookup/uniqueness doc (claimed in a transaction) so invite codes are unique and M2 can resolve code→uid without listing `users`. *(Addition beyond the original kickoff model — kept tiny and rule-friendly.)*

Planned (later): `users/{uid}/friends/{friendUid}` + `friendRequests/{id}` (M2); `reads/{id}` unified solo+buddy with flat `participantUids` array + per-person `participants` map (M4). Snapshot book metadata into the read at creation.

## Layout — mobile/iPad-first (CORNERSTONE)

**Exactly two layouts, chosen by screen width: phone and iPad. A laptop/desktop renders the iPad screen — never a bespoke desktop layout.** This is a hard product rule; honour it on every page, component, and the theme toggle.

- Base Tailwind styles = **phone**. The single custom **`ipad:`** breakpoint (`--breakpoint-ipad`, 768px) switches to the **iPad** layout. **Do not use `sm/md/lg/xl/2xl`** — they're cleared from the theme (`--breakpoint-*: initial`), so only `ipad:` exists. Think in two devices.
- App chrome is capped at **`max-w-app`** (`--container-app`, 52rem ≈ iPad portrait) and centred by **`components/DeviceFrame.tsx`**, which wraps all routes. Phone = full width; iPad ≈ full width; desktop = the iPad column centred with hairline side borders.
- Keep prose/text blocks capped narrower (e.g. `max-w-md`) for readability inside the iPad column.
- Manifest is portrait-locked, consistent with this.

## Design system

Dark academia, "3 Cs" (cohesive, classy, consistent). Warm brown/olive/cream, candlelit. **One muted accent, never bright.** Display serif **Fraunces**, body sans **Inter**. Tokens: `bg, surface, surface-alt, text, text-muted, border, accent, accent-contrast, bar-track, bar-fill` — used as Tailwind colors (`bg-bg`, `text-text-muted`, etc.). Generous whitespace, hairline borders over shadows, restrained motion (`prefers-reduced-motion` honoured).

## Current focus / next up

- **Done — M0:** scaffold, tokens + theme toggle, app shell, routing skeleton, PWA (installable, SW), docs, Vercel config. Build + lint green.
- **Done — layout cornerstone:** mobile/iPad-first, two layouts only, `DeviceFrame` caps the app at iPad width; default breakpoints removed in favour of `ipad:`. On `main` via GitHub `origin`.
- **Done — M1:** Firebase init, Google sign-in, `RequireAuth` guard, user-doc creation with a unique invite code (`inviteCodes` transaction), Profile page (avatar, invite code + copy, theme toggle, sign out), theme account-sync. Build + lint green.
- **Next — M2:** friends — add by invite code, friend requests (send/accept/decline), friends list, + security rules.
- Pending external (user): **enable Google sign-in provider**, **create Firestore database**, **deploy `firestore.rules`** (console Rules tab or `firebase deploy --only firestore:rules`) — needed before sign-in works end to end. Later: Vercel deploy; Google Books key (M3).
- Known debt: JS bundle ~245 kB gzip (Firebase). Code-split / lazy-load routes in M7.
