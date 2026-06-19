# BuddyRead — Project Journey

An append-only logbook. One chapter per milestone: what we built, *why*, the trade-offs, gotchas, and interview-style Q&A. Earlier chapters are never rewritten.

---

## Chapter 0 — Scaffold & deployable skeleton (M0)

### What we built and why

The goal of M0 was to prove the whole pipeline end-to-end on day one — a real, installable PWA you can deploy — before writing a single feature. A deployed skeleton de-risks everything after it: routing, the design system, theming, the build, and the service worker are all the kind of plumbing that's miserable to debug late, so we stand it up first and layer features onto something that already ships.

Concretely, M0 delivers:

- A **Vite + React + TypeScript** app (Vite 8 / React 19 / TS 6 from the current `create-vite` template).
- The **dark-academia design system** as CSS-variable tokens, wired into Tailwind v4 so a single `.dark` class on `<html>` repaints the entire app.
- A **three-way theme system** (light / dark / system) that persists to `localStorage` and follows the OS live when set to "system".
- An **app shell** (hairline header, wordmark, theme toggle, reading-width column) and three routes: a quietly handsome **Welcome** landing, a stub **Home** ("your shelf"), and a voice-appropriate **404**.
- **PWA** support via `vite-plugin-pwa`: web manifest, brand SVG icons (standard + maskable), `autoUpdate` service worker, an offline app shell, and a runtime cache for book-cover images (ready for M3).
- Project hygiene: `.env.example`, tightened `.gitignore`, `vercel.json` SPA rewrite, and the two living docs (`CLAUDE.md`, this journal).

### Architecture & tech-stack decisions (and what we rejected)

- **Tailwind v4 (CSS-first) over v3.** v4's `@theme` lets us declare design tokens as CSS variables *and* expose them as Tailwind color utilities in one place, with `@custom-variant dark` giving class-based dark mode without a `tailwind.config.js`. This matches the brief's "light/dark is a single token swap" exactly. Rejected: v3 + a JS config + a separate `darkMode: 'class'` setup — more files, more indirection, the token values duplicated between CSS and config.

- **CSS-variable tokens, not Tailwind theme colors directly.** Colors live as `--bg`, `--accent`, etc. on `:root`/`.dark`, and `@theme inline` maps them to `bg-bg`, `text-accent`… The swap happens in CSS, so it's instant, FOUC-free, and reusable outside Tailwind. This also leaves a clean seam for M1 to drive theme from the user's Firestore doc.

- **Theme context split into three files** (`theme-context.ts` for the context object, `ThemeProvider.tsx`, `useTheme.ts`). Keeping the context and the component in separate modules keeps React Fast Refresh happy (a file that exports a component shouldn't also export non-component values) and keeps the hook import-light.

- **React Router v7** with all routes public *for now*. Auth gating is deliberately deferred to M1 so the skeleton walks end-to-end today. The `Welcome → /home` CTA is a placeholder that becomes Google sign-in later.

- **SVG app icons** instead of generating PNGs. Avoids pulling in a native image dependency (`sharp`) just to ship M0; modern browsers accept SVG manifest icons, and we include a dedicated maskable variant with a safe-zone glyph. Crisp raster icons are a cheap M7 polish task if any target platform needs them.

- **Firebase installed but unused.** It's a settled dependency, so it's in `package.json`, but nothing imports it yet — so it stays out of the bundle until M1.

### Notable details & gotchas

- **Tailwind v4 needs no PostCSS config here** — the `@tailwindcss/vite` plugin handles everything; styling is a single `@import 'tailwindcss'` at the top of `index.css`.
- **`color-scheme` is set alongside the `.dark` class** so native form controls and scrollbars match the theme.
- **`prefers-reduced-motion` is honoured globally** in `index.css` — fitting for a "restrained motion" brief.
- **Vercel SPA rewrite** (`vercel.json`) is required or a hard refresh on `/home` 404s on the host.
- **`.gitignore`** explicitly allows `.env.example` through while blocking every other `.env*`.
- Production build is green: `tsc -b && vite build` emits the SW + manifest; ESLint is clean.

### Questions an interviewer might ask

- **Q: Why deploy an empty skeleton before building features?**
  To prove the riskiest, most cross-cutting plumbing (build, routing, theming, service worker, host config) once, early, against a real deployment — so every later feature lands on a known-good pipeline instead of debugging infra and product at the same time.

- **Q: How does the single-token-swap theming actually work?**
  All colors are CSS custom properties defined twice — on `:root` (light) and `.dark` (dark). Tailwind v4's `@theme inline` maps those variables to color utilities. `ThemeProvider` toggles the `.dark` class on `<html>`, so one class flip repaints everything with no component re-render needed for the colors themselves.

- **Q: Why three theme states instead of a boolean?**
  "System" is the respectful default: it tracks the OS via a `matchMedia` listener and updates live. The user can still pin light or dark. The stored value is one of `light | dark | system`, which is exactly what the planned `users/{uid}.theme` field expects.

- **Q: What makes it a PWA, and what's cached?**
  A web manifest (name, icons, `standalone`, theme color) plus a Workbox service worker from `vite-plugin-pwa` with `autoUpdate`. The build precaches the app shell; a runtime `CacheFirst` rule stores book-cover images from Google Books / Open Library so covers survive offline.

- **Q: Why SVG icons instead of PNGs?**
  To avoid a native image-processing dependency for a skeleton. Browsers accept SVG manifest icons, and we ship a separate maskable variant with the glyph inside the safe zone. Generating PNG sizes is a trivial polish step later if a platform requires them.

- **Q: Where will real authentication slot in?**
  M1: Firebase Google sign-in, a route guard wrapping `/home` and friends, and user-doc creation with a generated invite code. The Welcome CTA and the public routes are placeholders shaped to receive that with minimal churn.

---

## Chapter 0.5 — Layout cornerstone: mobile/iPad-first

### What changed and why

After the M0 skeleton, the user set a hard product rule: **BuddyRead targets exactly two layouts — a phone and an iPad — and a laptop/desktop simply renders the iPad screen.** No bespoke desktop design, ever. The only real readers use a phone and an iPad, so a desktop layout would be wasted effort and would dilute the focus. This is a cornerstone, applied to every page, component, and the theme toggle from here on.

### How we enforced it (not just styled for it)

- **Two layouts, one breakpoint.** Base Tailwind styles target the phone; a single custom `ipad:` breakpoint (768px) switches to the iPad layout. To make the rule structural rather than a matter of discipline, we *cleared* Tailwind's default breakpoints (`--breakpoint-*: initial`) so `sm/md/lg/xl/2xl` no longer exist — a stray `lg:` can't silently introduce a third layout; only `ipad:` compiles.
- **Desktop = the iPad screen.** A new `DeviceFrame` wraps every route: it fills the viewport with the themed background and caps the app at `max-w-app` (`--container-app`, ~832px ≈ iPad portrait), centred. Phones run full-width; iPads run ≈ full-width; anything wider gets the iPad column centred with hairline side borders so the cap reads as intentional, not stranded.
- **Pages stopped capping themselves.** `AppShell` and `Welcome` dropped their own `max-w-*`/background wrappers and now just fill the frame, with padding stepping up slightly at `ipad:`. Readability caps on prose (e.g. `max-w-md`) stay, since an 832px-wide line of text is too long regardless of device.

### Trade-offs considered

- **Clearing default breakpoints vs. just "not using them."** Clearing them is mildly unconventional and means any future contributor must learn the `ipad:`-only convention — but it turns a guideline into a guarantee, which is exactly what a "cornerstone" deserves.
- **Capping at the frame level vs. per-page.** A single `DeviceFrame` means every current and future screen inherits the device behaviour for free, at the cost of pages no longer being self-contained full-screen units. Worth it: it makes the two-layout rule the path of least resistance.
- **Where to set the iPad cap.** 832px (52rem) covers iPad portrait widths up to the 11" Pro, so real iPads render essentially full-bleed while desktops letterbox to that same width — the "show the iPad screen on desktop" goal, precisely.

### Questions an interviewer might ask

- **Q: How do you guarantee only two layouts exist?**
  By removing Tailwind's default responsive breakpoints entirely and defining a single `ipad:` breakpoint. There's literally no `lg:`/`xl:` to reach for, so the design can't fork into a third layout, and the app's max width is capped at iPad size by one wrapper component.

- **Q: What does a desktop user actually see?**
  The iPad layout, centred, capped at ~832px, with hairline side borders framing it. We deliberately don't build a wide desktop view — the audience is a phone-and-iPad pair, so a desktop design would be effort spent on a screen no one reads on.

- **Q: Why cap at the frame instead of styling each page responsively?**
  One `DeviceFrame` makes the device behaviour automatic and uniform for every screen we'll build (friends, search, the split card, history), so no page can accidentally stretch on desktop. It trades per-page independence for a guarantee that the cornerstone holds everywhere.

---

## Chapter 1 — Auth & profile (M1)

### What we built and why

M1 turns the skeleton into something you sign in to. A reader now: lands on Welcome → **Continue with Google** → gets a `users/{uid}` document created with a unique, human-typeable **invite code** → arrives at a guarded `/home` → can open a **Profile** page (avatar, invite code with copy, theme toggle, sign out). Everything behind `/home` and `/profile` requires auth; the rest of the app (friends, reads) builds on this identity layer.

Concretely:

- **Firebase initialised** from the `VITE_FIREBASE_*` env (`lib/firebase.ts`) — Auth (Google provider, `prompt: 'select_account'`) + Firestore.
- **`AuthProvider`** tracks `onAuthStateChanged`, ensures the user doc on first sign-in, and subscribes to it live with `onSnapshot` so the invite code and theme are always current.
- **`RequireAuth`** route guard waits for auth to resolve (a `Splash`), then redirects signed-out readers to the landing — no flash of the wrong screen on reload.
- **Unique invite codes** via an `inviteCodes/{code}` lookup doc claimed in a Firestore **transaction**.
- **Profile page** + an **Avatar** with an initial fallback (Google photos are loaded with `referrerPolicy="no-referrer"` so they don't 403).
- **Theme account-sync** (`ThemeSync`): the per-device theme and `users/{uid}.theme` are reconciled — account wins once on sign-in, then local changes write back up.
- **Tight Firestore rules** (`firestore.rules`): a reader can read/write only their own `users/{uid}`; invite-code docs are readable by any signed-in user but can only be created pointing at your own uid, and are immutable.

### Decisions & trade-offs (and what we rejected)

- **An `inviteCodes` lookup collection — a deliberate addition to the kickoff data model.** The original model put `inviteCode` only on the user doc. But two needs push for a dedicated collection: (1) guaranteeing uniqueness, and (2) letting M2 resolve a typed-in code → uid. Doing that against the `users` collection would require granting *list/query* permission over all users — leaking everyone's profile. A tiny `inviteCodes/{code} → { uid }` doc, claimed in a transaction, gives atomic uniqueness and a rule-friendly point lookup (`get` by id, not a query) without opening `users` at all. The cost is one extra write at signup and a second collection to reason about — well worth it. (Flagged to the product owner since it extends the agreed model.)

- **Invite-code alphabet.** 6 chars from a 31-symbol set with `0/O/1/I/L` removed (~887M combinations). Ambiguous glyphs are dropped because the code gets read off a screen or spoken to a friend; collision odds at two-user scale are negligible, and the transaction handles the rare clash by retrying.

- **`signInWithPopup` over `signInWithRedirect`.** Popup keeps the SPA state intact and is simpler to reason about for a phone/iPad PWA; redirect's whole-page round-trip and its known quirks inside standalone PWAs weren't worth it for v0. Revisit only if a target browser blocks the popup.

- **Theme: account-wins-once, then local-wins.** Rather than make either store the permanent source of truth, the account value is adopted a single time per sign-in (so your iPad inherits your phone's choice), after which on-device toggles propagate upward. A `hydratedForUid` ref prevents the two `onSnapshot`/effect loops from ping-ponging. Rejected: making Firestore the live source for every paint (a network hop before first render, and a flicker offline).

- **Provider order.** `AuthProvider` wraps `ThemeProvider` wraps `ThemeSync`, so the sync bridge can consume both without coupling the two providers to each other.

### Notable details & gotchas

- **`serverTimestamp()` is a `FieldValue`, not a `Timestamp`.** The write payload therefore can't be typed directly as `UserDoc` (whose `createdAt` is the resolved `Timestamp`); the field is written as a server timestamp and read back as a `Timestamp`.
- **Vite reads env only at startup** — adding `.env.local` required a dev-server restart before sign-in could see the config.
- **Bundle size jumped** to ~245 kB gzip once Firebase Auth + Firestore were imported. Acceptable for now; route-level code-splitting / lazy Firebase is queued for the M7 polish pass.
- **Firebase web config isn't a secret** — it ships in the client. Data is protected by Firestore rules + the Auth domain allowlist, which is why writing tight rules in this milestone matters more than hiding keys.

### Questions an interviewer might ask

- **Q: How do you guarantee invite codes are unique?**
  Each code is also a document id in an `inviteCodes` collection, claimed inside a Firestore transaction that fails if the id already exists; on a clash we generate another and retry. Document-id uniqueness + transactional create gives atomicity without a server.

- **Q: Why not just query `users` by `inviteCode`?**
  A query needs list permission over the collection, which would expose every user's profile to any signed-in reader. A keyed `get` on `inviteCodes/{code}` returns only the uid, so rules stay tight and the lookup is a single document read.

- **Q: How does the route guard avoid a flash of the login screen?**
  `AuthProvider` starts in a `loading` state until the first `onAuthStateChanged` (and the user doc) resolve; `RequireAuth` renders a quiet splash during that window instead of deciding too early, so a reload doesn't briefly show Welcome before redirecting.

- **Q: What stops one reader from editing another's data?**
  Firestore rules: `users/{uid}` is read/write only when `request.auth.uid == uid`, and an `inviteCodes` doc can only be created with `uid == request.auth.uid` and never updated or deleted. The per-read participant rules come in M4, but the principle — every write authorised against `request.auth.uid` — is set here.

- **Q: How does theme follow a reader across devices without flicker?**
  The painted theme is local (localStorage) for an instant, offline-safe first render. On sign-in the account's stored theme is adopted once; subsequent local toggles are written back to `users/{uid}.theme`. So device A's change reaches device B on its next sign-in, but no render ever waits on the network.
