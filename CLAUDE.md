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
  lib/                firebase.ts (init), users.ts (user doc + invite code), inviteCode.ts, friends.ts (relationships), books.ts (Google Books client + cover helpers)
  auth/               auth-context.ts, AuthProvider.tsx, useAuth.ts, RequireAuth.tsx (mounts FriendsProvider)
  friends/            friends-context.ts, FriendsProvider.tsx (one live listener), useFriends.ts
  theme/              theme-context.ts, ThemeProvider.tsx, useTheme.ts, ThemeToggle.tsx, ThemeSync.tsx
  components/         DeviceFrame.tsx (mobile/iPad cap), AppShell.tsx (+ BottomNav), BottomNav.tsx, Logo.tsx, Avatar.tsx (photo or gradient-tone initial), BookCover.tsx (Google→OpenLibrary→spine placeholder), Splash.tsx, Eyebrow.tsx, Ornament.tsx, ProgressBar.tsx, StarRating.tsx, SplitProgressCard.tsx, LogSessionSheet.tsx
  pages/              Welcome.tsx (/), Home.tsx (/home), Search.tsx (/search), Book.tsx (/book/:id), InviteRead.tsx (/start/:id), CoRead.tsx (/read), Friends.tsx (/friends), Activity.tsx (/activity), History.tsx (/finished), Profile.tsx (/profile), NotFound.tsx (*)
  demo/               coread.ts, history.ts, activity.ts — DEMO DATA for the M4-vision screens; delete when reads land
public/               favicon.svg, icon.svg, icon-maskable.svg
firestore.rules       Firestore security rules (deploy to console)
```

Auth: `AuthProvider` tracks `onAuthStateChanged`, ensures the `users/{uid}` doc on first sign-in, and subscribes to it live. Everything except `/` sits behind `RequireAuth`; `/` redirects to `/home` when signed in.

**UI revamp (presentational):** the dark-academia direction is anchored from a Claude Design mockup. The co-read (`/read`), log-session sheet, invite (`/start/:id`), activity (`/activity`) and history (`/finished`) screens are **presentational mocks fed by `src/demo/*`** — they show the M4 vision before the `reads` model exists. The six real screens (Welcome, Shelf, Search, Book, Friends, Profile) keep all their M1–M3 logic; only markup/classes changed. Welcome keeps Google sign-in (the mockup's code-entry was not adopted).

Catalog (M3): `lib/books.ts` wraps Google Books — `searchBooks`/`getBook` normalize each volume into a small `Book`; HTML blurbs flattened via DOMParser `textContent` (injection-safe). Keyless by default (shared anonymous quota; `&key=` appended only when a real key is set). Covers: `BookCover` walks `coverCandidates` (Google image → Open Library by ISBN with `default=false` → title placeholder) on `<img>` onError. Search is debounced (350ms) + AbortController; reads are M4.

Theme: preference (`light|dark|system`) lives in `localStorage` under `buddyread:theme`; `ThemeProvider` resolves `system` live and toggles `.dark` on `<html>`. `ThemeSync` mirrors it to/from `users/{uid}.theme` — account wins once on sign-in, local changes write back up.

## Data model (Firestore)

Implemented (M1–M2):
- `users/{uid}` — `displayName, email, photoURL, username, inviteCode, theme, createdAt`. Owner-only read/write.
- `inviteCodes/{code}` — `{ uid, displayName, photoURL, createdAt }`. Lookup/uniqueness doc (claimed in a transaction); name/photo denormalized so a sender previews "Send request to <name>?" without reading the target's profile. Owner-refreshed on each sign-in.
- `friendRequests/{pairId}` — **single source of truth for a relationship** (no `friends` subcollection — deliberate deviation). `pairId` = the two uids sorted + `__`-joined. Fields: `participants:[from,to]`, `fromUid/toUid`, `fromName/fromPhotoURL`, `toName/toPhotoURL`, `status: pending|accepted`, `createdAt/respondedAt`. Friends/incoming/outgoing are all derived from one `participants array-contains uid` listener, partitioned client-side. Decline/cancel/unfriend = delete the doc.

Planned (later): `reads/{id}` unified solo+buddy with flat `participantUids` array + per-person `participants` map (M4). Snapshot book metadata into the read at creation.

**Indexes:** none required so far — the friends query uses a single `array-contains` (auto-indexed); ordering is done client-side to avoid a composite index.

## Layout — mobile/iPad-first (CORNERSTONE)

**Exactly two layouts, chosen by screen width: phone and iPad. A laptop/desktop renders the iPad screen — never a bespoke desktop layout.** This is a hard product rule; honour it on every page, component, and the theme toggle.

- Base Tailwind styles = **phone**. The single custom **`ipad:`** breakpoint (`--breakpoint-ipad`, 768px) switches to the **iPad** layout. **Do not use `sm/md/lg/xl/2xl`** — they're cleared from the theme (`--breakpoint-*: initial`), so only `ipad:` exists. Think in two devices.
- App chrome is capped at **`max-w-app`** (`--container-app`, 52rem ≈ iPad portrait) and centred by **`components/DeviceFrame.tsx`**, which wraps all routes. Phone = full width; iPad ≈ full width; desktop = the iPad column centred with hairline side borders.
- Keep prose/text blocks capped narrower (e.g. `max-w-md`) for readability inside the iPad column.
- Manifest is portrait-locked, consistent with this.

## Design system

Dark academia, "3 Cs" (cohesive, classy, consistent). **Parchment by day, espresso by night**, candlelit. **Two muted accents, never bright:** **terracotta** for primary actions, **gold** for pace indicators & star ratings (used sparingly — collaboration, never competition). Three faces: display serif **Cormorant Garamond** (`font-display`, headings sit at weight 600), body serif **EB Garamond** (`font-body`), and **IBM Plex Mono** (`font-mono`) for the uppercase micro-labels/eyebrows and meta. Tokens (CSS vars → Tailwind colors `bg-bg`, `text-text-muted`, …): `bg, surface (cards), surface-alt (inputs/nested), text, text-muted, text-faint (mono meta), border, border-soft (dividers), accent, accent-contrast, gold, bar-track, bar-fill`. Reusable primitives: `Eyebrow` (mono label), `Ornament` (❧ break), `ProgressBar` (accent|gold), `StarRating`, `SplitProgressCard`. Generous whitespace, hairline borders over shadows, restrained motion (`prefers-reduced-motion` honoured).

## Current focus / next up

- **Done — M0:** scaffold, tokens + theme toggle, app shell, routing skeleton, PWA (installable, SW), docs, Vercel config. Build + lint green.
- **Done — layout cornerstone:** mobile/iPad-first, two layouts only, `DeviceFrame` caps the app at iPad width; default breakpoints removed in favour of `ipad:`. On `main` via GitHub `origin`.
- **Done — M1:** Firebase init, Google sign-in, `RequireAuth` guard, user-doc creation with a unique invite code, Profile page, theme account-sync. Build + lint green.
- **Done — M2:** friends — bottom tab bar (Shelf · Friends · You), add-by-code (resolve → confirm → send), incoming/outgoing requests, the circle, remove-friend, all live via one `onSnapshot`; `friendRequests` security rules. Build + lint green.
- **Done — M3:** catalog — debounced Google Books search (`/search`), book detail (`/book/:id`), `BookCover` with Open Library + placeholder fallback, Shelf "Find a book" CTA wired. Keyless (works without an API key); no Firestore writes yet. Build + lint green.
- **Done — UI revamp:** new design system (Cormorant Garamond + EB Garamond + IBM Plex Mono; terracotta + gold on parchment/espresso) from a Claude Design mockup. Restyled all six real screens; built the M4-vision screens (co-read `/read`, log-session sheet, invite `/start/:id`, activity `/activity`, history `/finished`) as **presentational mocks fed by `src/demo/*`**. Bottom nav now 4 tabs (Shelf · Friends · Activity · You). Build + lint green. (Visual walkthrough not yet done — see Verification in the plan.)
- **Next — M4:** reads — `reads/{id}` (solo + buddy), snapshot book metadata at creation. Wire the mock screens to real data and **delete `src/demo/`**; "Read this together" (Book) and "Log tonight's pages"/"Send the invitation" become live.
- Pending external (user): **re-publish `firestore.rules`** (includes `friendRequests` + `inviteCodes` update). Recommended now: **Google Books API key** (keyless shares an anonymous quota that can 429 under load) — create in Google Cloud, restrict by HTTP referrer, set `VITE_GOOGLE_BOOKS_API_KEY`. Later: Vercel deploy.
- Known debt: JS bundle ~251 kB gzip (Firebase). Code-split / lazy-load routes in M7. Keyless Google Books can 429 on a shared quota until a key is added.
