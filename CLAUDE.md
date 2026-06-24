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
  lib/                firebase.ts (init), users.ts (user doc + invite code), inviteCode.ts, username.ts (unique handle + 30-day cooldown), friends.ts (relationships), reads.ts (buddy reads), activity.ts (event log), books.ts (Google Books client + cover helpers), starters.ts (curated shelf picks)
  auth/               auth-context.ts, AuthProvider.tsx, useAuth.ts, RequireAuth.tsx (mounts FriendsProvider + ReadsProvider)
  friends/            friends-context.ts, FriendsProvider.tsx (one live listener), useFriends.ts
  reads/              reads-context.ts, ReadsProvider.tsx (one live listener), useReads.ts
  theme/              theme-context.ts, ThemeProvider.tsx, useTheme.ts, ThemeToggle.tsx, ThemeSync.tsx
  components/         DeviceFrame, AppShell (+ BottomNav), BottomNav, Logo, Avatar (photo or gradient-tone initial), BookCover (Google→OpenLibrary→spine), Splash, Eyebrow, Ornament, Crowns (two outline crowns, splayed, on Welcome), ProgressBar, SplitProgressCard, LogSessionSheet, BuddyPicker, StarterBook (3D open-on-hover/long-press; curated row hides scrollbar, snaps, and unfurls in on load), ConfirmDialog + useConfirm (awaitable confirm — gates EVERY destructive action: leave read, decline/cancel, remove friend, sign out)
  pages/              Welcome.tsx (/), Home.tsx (/home), Search.tsx (/search), Book.tsx (/book/:id), CoRead.tsx (/read/:id), Friends.tsx (/friends), Activity.tsx (/activity), Profile.tsx (/profile), NotFound.tsx (*)
public/               favicon.svg, icon.svg, icon-maskable.svg
firestore.rules       Firestore security rules (deploy to console)
```

Auth: `AuthProvider` tracks `onAuthStateChanged`, ensures the `users/{uid}` doc on first sign-in, and subscribes to it live. Everything except `/` sits behind `RequireAuth`; `/` redirects to `/home` when signed in.

**Design:** the dark-academia direction is anchored from a Claude Design mockup — Cormorant Garamond / EB Garamond / IBM Plex Mono, terracotta + gold on parchment/espresso. The Shelf leads with a warm time-of-day greeting and a curated starter row (`StarterBook`, real Open Library covers, 3D open on hover / long-press) when you have no active reads. Bottom nav is 4 tabs (Shelf · Friends · Activity · You).

**Buddy reads (M4):** the co-read loop is real. `lib/reads.ts` + `ReadsProvider` mirror the friends pattern (one `participants array-contains uid` listener, partitioned into active / incoming / outgoing). Send a request from **two points** — Book detail's "Read this together" (a `BuddyPicker` sheet), or a friend's "Read" button (→ `/search?with=uid` → Book detail's direct `?with=` send). The recipient accepts/declines in **Activity** (badge on the nav). On accept the read goes **active**: each reader sets their own edition + length (`SetupMine`), logs pages (`LogSessionSheet`), and both see the live `SplitProgressCard` on `/read/:id`. Sends are minimal (book snapshot only); progress is per-uid. **Activity** = live pending requests (Needs-you, from the providers) pinned over the **event log** (`lib/activity.ts`): each action appends an immutable doc to the *other* party's `users/{uid}/activity` via `logActivity` (best-effort), so accepts, **declines/rejections**, every page logged + its note, and a read being left all persist as real history. The "Lately" feed reads that subcollection live.

Catalog (M3): `lib/books.ts` wraps Google Books — `searchBooks`/`getBook` normalize each volume into a small `Book`; HTML blurbs flattened via DOMParser `textContent` (injection-safe). Keyless by default (shared anonymous quota; `&key=` appended only when a real key is set). Covers: `BookCover` walks `coverCandidates` (Google image → Open Library by ISBN with `default=false` → title placeholder) on `<img>` onError. Search is debounced (350ms) + AbortController; reads are M4.

Theme: preference (`light|dark|system`) lives in `localStorage` under `buddyread:theme`; `ThemeProvider` resolves `system` live and toggles `.dark` on `<html>`. `ThemeSync` mirrors it to/from `users/{uid}.theme` — account wins once on sign-in, local changes write back up.

## Data model (Firestore)

Implemented (M1–M2):
- `users/{uid}` — `displayName, email, photoURL, username, usernameUpdatedAt, inviteCode, theme, createdAt`. Owner-only read/write.
- `usernames/{name}` — `{ uid }` claim doc for handle uniqueness (mirrors `inviteCodes`). `lib/username.ts` `changeUsername` runs a transaction: enforce the 30-day cooldown (`usernameUpdatedAt`), ensure the name is free, claim the new doc, release the old. Rules: read by any signed-in (availability check), create/delete only as the owner, **no update** (can't steal a taken handle).
- `inviteCodes/{code}` — `{ uid, displayName, photoURL, createdAt }`. Lookup/uniqueness doc (claimed in a transaction); name/photo denormalized so a sender previews "Send request to <name>?" without reading the target's profile. Owner-refreshed on each sign-in.
- `friendRequests/{pairId}` — **single source of truth for a relationship** (no `friends` subcollection — deliberate deviation). `pairId` = the two uids sorted + `__`-joined. Fields: `participants:[from,to]`, `fromUid/toUid`, `fromName/fromPhotoURL`, `toName/toPhotoURL`, `status: pending|accepted`, `createdAt/respondedAt`. Friends/incoming/outgoing are all derived from one `participants array-contains uid` listener, partitioned client-side. Decline/cancel/unfriend = delete the doc.

- `users/{uid}/activity/{eventId}` — a reader's private event log. Fields: `actorUid/actorName/actorPhotoURL`, `type` (friend_accepted | friend_declined | read_accepted | read_declined | read_logged | read_left), `bookTitle/page/note` (nullable), `createdAt`. The *other* party appends (rules: create if `actorUid == auth.uid`); the owner reads/deletes. Queried `orderBy createdAt desc` (single-field, no composite index).
- `reads/{readId}` (M4) — a buddy read. **Auto-id** (a pair can have many reads, unlike `friendRequests`). Fields: `participants:[from,to]`, `fromUid/toUid`, denormalized `fromName/fromPhotoURL/toName/toPhotoURL`, `book` snapshot `{id,title,authors,coverUrl,pageCount}`, `status: pending|active`, `progress: { [uid]: { edition, totalPages, currentPage, note, updatedAt, noteAt } }`, `createdAt/respondedAt`. Active/incoming/outgoing derived from one `participants array-contains uid` listener. Decline/cancel/leave = delete. Rules: only a **friend** (an accepted `friendRequests` doc exists) may be sent a request; only the recipient flips pending→active; a participant may edit **only their own** `progress` key (`progress.diff().affectedKeys().hasOnly([uid])`).

**Indexes:** none required so far — both the friends and reads queries use a single `array-contains` (auto-indexed); ordering is done client-side to avoid a composite index.

## Layout — mobile/iPad-first (CORNERSTONE)

**Exactly two layouts, chosen by screen width: phone and iPad. A laptop/desktop renders the iPad screen — never a bespoke desktop layout.** This is a hard product rule; honour it on every page, component, and the theme toggle.

- Base Tailwind styles = **phone**. The single custom **`ipad:`** breakpoint (`--breakpoint-ipad`, 768px) switches to the **iPad** layout. **Do not use `sm/md/lg/xl/2xl`** — they're cleared from the theme (`--breakpoint-*: initial`), so only `ipad:` exists. Think in two devices.
- App chrome is capped at **`max-w-app`** (`--container-app`, 52rem ≈ iPad portrait) and centred by **`components/DeviceFrame.tsx`**, which wraps all routes. Phone = full width; iPad ≈ full width; desktop = the iPad column centred with hairline side borders.
- Keep prose/text blocks capped narrower (e.g. `max-w-md`) for readability inside the iPad column.
- Manifest is portrait-locked, consistent with this.

## Design system

Dark academia, "3 Cs" (cohesive, classy, consistent). **Parchment by day, espresso by night**, candlelit. **Two muted accents, never bright:** **terracotta** for primary actions and your pace, **gold** for the buddy's pace on the split progress card (collaboration, never competition). Three faces: display serif **Cormorant Garamond** (`font-display`, headings sit at weight 600), body serif **EB Garamond** (`font-body`), and **IBM Plex Mono** (`font-mono`) for the uppercase micro-labels/eyebrows and meta. Tokens (CSS vars → Tailwind colors `bg-bg`, `text-text-muted`, …): `bg, surface (cards), surface-alt (inputs/nested), text, text-muted, text-faint (mono meta), border, border-soft (dividers), accent, accent-contrast, gold, bar-track, bar-fill`. Reusable primitives: `Eyebrow` (mono label), `Ornament` (❧ break). Generous whitespace, hairline borders over shadows, restrained motion (`prefers-reduced-motion` honoured).

## Current focus / next up

- **Done — M0:** scaffold, tokens + theme toggle, app shell, routing skeleton, PWA (installable, SW), docs, Vercel config. Build + lint green.
- **Done — layout cornerstone:** mobile/iPad-first, two layouts only, `DeviceFrame` caps the app at iPad width; default breakpoints removed in favour of `ipad:`. On `main` via GitHub `origin`.
- **Done — M1:** Firebase init, Google sign-in, `RequireAuth` guard, user-doc creation with a unique invite code, Profile page, theme account-sync. Build + lint green.
- **Done — M2:** friends — bottom tab bar (Shelf · Friends · You), add-by-code (resolve → confirm → send), incoming/outgoing requests, the circle, remove-friend, all live via one `onSnapshot`; `friendRequests` security rules. Build + lint green.
- **Done — M3:** catalog — debounced Google Books search (`/search`), book detail (`/book/:id`), `BookCover` with Open Library + placeholder fallback, Shelf "Find a book" CTA wired. Keyless (works without an API key); no Firestore writes yet. Build + lint green.
- **Done — UI revamp:** new design system (Cormorant Garamond + EB Garamond + IBM Plex Mono; terracotta + gold on parchment/espresso) from a Claude Design mockup. Restyled all real screens; bottom nav now 4 tabs (Shelf · Friends · Activity · You). **Clean slate — no fabricated data:** the M4-vision screens were not mocked; Shelf and Activity are honest empty states. Build + lint green. Dev server pinned to **port 5180** (`vite.config.ts`, `strictPort`) — 5173 is another project's.
- **Done — Shelf hub:** the empty Shelf became a warm hub — time-of-day greeting (real account name), curated `StarterBook` row (real Open Library covers, 3D open on hover / mobile long-press, → prefilled search), `?q=` on `/search`.
- **Done — M4 (buddy reads):** the co-read loop end to end — `reads/{readId}` + `ReadsProvider`, send from two points (Book detail `BuddyPicker`, Friends "Read" → `?with=`), accept/decline in Activity (nav badge), per-reader edition setup, page logging, live `SplitProgressCard` on `/read/:id`. New `reads` security rules. Build + lint green.
- **Next — M5:** finishing a read (rating + the line it left), a finished-books history, and the activity feed (logged pages / notes), so Profile's "read" count and the inbox fill out. Optionally solo reads.
- Pending external (user): ⚠️ **re-publish `firestore.rules` now** — it adds the `reads` collection, the `users/{uid}/activity` subcollection, **and the `usernames` collection**; until deployed, buddy-reads, the activity feed, and username changes fail with permission-denied.
- **Next:** preset avatars (no Storage) — render presets via `Avatar`, and propagate a reader's chosen avatar into the denormalized photo on inviteCodes/friendRequests/reads/activity so buddies see it; slot the picker into `EditProfileDialog`. (Also still includes the earlier `friendRequests` + `inviteCodes` update.) Recommended: **Google Books API key** (keyless shares an anonymous quota that can 429 under load) — restrict by HTTP referrer, set `VITE_GOOGLE_BOOKS_API_KEY`. Later: Vercel deploy.
- Known debt: JS bundle ~251 kB gzip (Firebase). Code-split / lazy-load routes in M7. Keyless Google Books can 429 on a shared quota until a key is added.
