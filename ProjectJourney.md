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

---

## Chapter 2 — Friends (M2)

### What we built and why

Reading "together" needs a someone. M2 adds the relationship layer: a bottom tab bar (**Shelf · Friends · You**), and a Friends screen where you type a buddy's invite code → preview "Send request to *Name*?" → they see it under **Friends** → **Accept**, and you're both in each other's circle, ready to start a shared read in M4. Decline, cancel, and remove-friend are all there too. Everything is live — one `onSnapshot` keeps requests and the circle current without a refresh, and the Friends tab carries a small count badge for pending invites.

### The headline decision: derive friends from requests, no subcollection

The kickoff modelled friendships as a `users/{uid}/friends/{friendUid}` subcollection on **both** readers. Making that reciprocal on the client (without the Cloud Functions v0 excludes) runs straight into a Firestore rules limitation: **rules can't see other writes in the same batch.** So the obvious "flip the request to `accepted` *and* write both friend edges atomically" fails — when the rule evaluates the edge write, it still sees the request as `pending`.

We sidestepped the whole problem by making **`friendRequests/{pairId}` the single source of truth** and deriving everything from it:

- **Deterministic id** = the two uids sorted and `__`-joined, so a pair can only ever have one doc — duplicate and reverse requests are impossible by construction.
- **Friends / incoming / outgoing** are computed from one listener (`participants array-contains me`), partitioned in JS by `status` and direction.
- **No cross-user writes ever.** Accept updates one field on one doc the recipient is allowed to touch. There are no two edges to keep consistent.
- **No `declined` state.** Decline, cancel, and unfriend are all a single `delete`, which also means re-requesting is a clean `create` rather than a special-cased revival.

This is simpler *and* safer than the subcollection design, and it needs no Cloud Function. The product owner signed off on the deviation.

### Other decisions & trade-offs

- **Denormalize name/photo onto `inviteCodes` (and onto each request).** To preview "Send request to *Devansh*?" the sender needs the target's name — but we keep `users` locked to owner-only reads. So the invite-code lookup doc carries `displayName`/`photoURL` (refreshed on each sign-in), and both parties' display data is copied onto the request. Net effect: nobody ever reads anyone else's `users` doc, yet every list renders from a single query. Cost: a little duplicated profile data that can go stale until next sign-in — fine for v0.
- **No composite indexes.** Querying `participants array-contains me` *and* `orderBy(createdAt)` would force a composite index; sorting client-side keeps us on the free single-field `array-contains` index. With a two-person circle the in-memory sort is free.
- **One shared `FriendsProvider` behind `RequireAuth`.** A single listener feeds both the Friends page and the nav badge, and it only runs while signed in. Rejected: a hook with its own listener per consumer (duplicate reads, duplicate cost).
- **`NotFound` left the `AppShell`.** Once `AppShell` grew a `BottomNav` that reads `useFriends`, the public 404 (outside the provider) would have thrown. The 404 is now a standalone screen — which is right anyway: a not-found page shouldn't wear the app's tab bar.

### Notable details & gotchas

- **react-hooks lint: no `setState` directly in an effect body.** Resetting `loading` synchronously at the top of the subscribe effect tripped the rule; since `loading` already starts `true` and the snapshot clears it, the line was simply removed.
- **Rules validate the id, not just the data.** `create` checks `reqId == pairId(fromUid, toUid)` and that `participants == [fromUid, toUid]`, so a client can't smuggle a relationship in under the wrong key or with a mismatched member list.
- **Accept can't rewrite the parties.** The `update` rule pins `fromUid`/`toUid`/`participants` to their existing values and only allows `pending → accepted`, so accepting can't quietly swap who's involved.

### Questions an interviewer might ask

- **Q: Why not store friendships as a subcollection on each user, like the original design?**
  Reciprocity would require the accepter to write into the other user's subcollection, which needs either a Cloud Function (excluded in v0) or rules that can validate an in-batch status change — but Firestore rules can't see sibling writes in the same batch. Deriving both readers' view from one `friendRequests` doc removes the dual-write entirely, so there's nothing to keep consistent and the rules stay trivial.

- **Q: How do you prevent duplicate or reverse friend requests?**
  The request's document id is the two uids sorted and joined, so A→B and B→A map to the same id. A second request just hits the existing doc, and the create rule enforces that the id matches `pairId(from, to)`.

- **Q: A sender previews the recipient's name before they're friends — doesn't that leak profiles?**
  Only to someone who already holds your invite code, which you chose to share. The name/photo live on the `inviteCodes` lookup doc, not the `users` doc, so the actual profile stays owner-only-readable. There's no way to enumerate users.

- **Q: Why no composite index for the friends query?**
  We filter on a single `array-contains` field (auto-indexed) and sort in memory rather than adding `orderBy` to the query, which would have forced a composite index. At a two-person scale the client-side sort is negligible.

- **Q: What happens to the buddy's view when someone unfriends?**
  Unfriend deletes the one shared `friendRequests` doc; both readers' listeners fire and the relationship drops out of both circles live. There's no second record to clean up.

---

## Chapter 3 — Catalog: search & book detail (M3)

### What we built and why

The Shelf has been empty since M0 — there was no way to *find* a book. M3 fills that gap with the catalog: a debounced search over the **Google Books API**, a per-book detail page, and cover art that degrades gracefully. It's deliberately read-only — browsing, not committing. Choosing a book and snapshotting it into a *read* is M4's job; here the "Start a read" button is a quiet, disabled promise.

- **`lib/books.ts`** — a thin typed client. `searchBooks` / `getBook` hit Google Books, and both funnel through one `normalizeVolume` that flattens Google's sprawling `volumeInfo` into a small `Book` we control. Google's HTML blurb is run through `htmlToText` (DOMParser → `textContent`, never `innerHTML`) so descriptions are injection-safe plain text.
- **`components/BookCover.tsx`** — a 2:3 frame that tries Google's image, then Open Library by ISBN, then settles into a title-bearing placeholder. A missing cover still reads as a book.
- **`pages/Search.tsx`** (`/search`) and **`pages/Book.tsx`** (`/book/:id`), both behind `RequireAuth`. The empty Shelf's "Find a book" CTA is now a real link.

### Decisions & trade-offs (and what we rejected)

- **Keyless to start.** Google Books volume queries work without an API key at a lower, *shared anonymous* quota. We ship keyless and treat the `.env.example` placeholder as unset, appending `&key=` only when a real key is present. Trade-off surfaced immediately: a test call from a shared CI IP returned **HTTP 429** (the anonymous quota is pooled per source). A home browser gets its own fresh quota, but this is exactly why a free, referrer-restricted key is the recommended next step — it moves us off the shared pool. The error path already handles 429 like any failed fetch.
- **Normalize at the edge.** Every Google volume is mapped to our `Book` the moment it arrives, so pages never touch `volumeInfo.imageLinks.thumbnail`-shaped paths. One place to fix when Google's shape shifts.
- **Cover fallback as a data list, not branching JSX.** `coverCandidates(book)` returns an ordered `[google, openLibrary]`; `BookCover` walks the index on each `onError`. Open Library is requested with `default=false` so it 404s (firing `onError`) instead of serving a blank, which is what makes the chain reach the placeholder.
- **No new dependencies.** No HTTP client, no HTML sanitizer, no image library — `fetch`, `DOMParser`, and an `<img>` error chain cover it.

### Notable details & gotchas

- **react-hooks lint, again: no synchronous `setState` in an effect body** (it bit us in M2 too). Two different fixes for two different shapes:
  - *Search* moves **all** state writes inside the debounce `setTimeout` callback — a callback isn't the effect body, and the 350 ms debounce wanted to own the "searching/idle" transitions anyway.
  - *Book detail* has no debounce to hide behind, so instead of resetting state on `id` change it **derives** status: state holds `{ id, book }` (with `book === null` meaning that id failed), and `loading`/`done`/`error` are computed by comparing the stored id to the current route param. A new id reads as "loading" until its own fetch lands — no reset write needed.
- **`AbortController` on every effect.** Both pages abort in their cleanup, so a fast-typing search or a quick back-navigation can't land a stale response over a newer one.
- **PWA was ready for this.** M0 had already added a `CacheFirst` runtime rule for `books.google` / `googleusercontent` / `openlibrary` hosts, so covers cache offline with no further work.

### Questions an interviewer might ask

- **Q: Why normalize Google's response instead of using it directly?**
  `volumeInfo` is large, deeply optional, and not ours to control. Mapping to a small `Book` at the fetch boundary means components depend on a stable shape, optional-field handling lives in one function, and a future swap of catalog provider touches only `normalizeVolume`.

- **Q: How do you render Google's HTML description safely?**
  Block tags are turned into newlines, then `DOMParser` parses the string and we read `textContent` — never `innerHTML`. The result is plain text shown with `whitespace-pre-line`, so there's no path for injected markup to execute.

- **Q: A cover image 404s — what does the user see?**
  `BookCover` advances through an ordered candidate list (Google, then Open Library) on each `onError`, and when the list is exhausted falls back to a placeholder showing the title. Open Library is asked with `default=false` precisely so a missing cover errors rather than returning a blank image, keeping the fallback chain working.

- **Q: Why keyless, and what's the catch?**
  It lets two friends use the app before anyone touches Google Cloud. The catch is a shared anonymous quota that can 429 under load (we saw it from a shared IP). The fix is a free API key restricted by HTTP referrer, which is the documented M3 setup step.

## Chapter 3.5 — UI revamp: anchoring the dark academia

### What we built and why

Three milestones of features had accumulated against a placeholder skin — Fraunces + Inter, a single olive accent, the right *instincts* but never the actual *vibe*. This chapter anchors the look. Working from a nine-screen Claude Design mockup (imported via the `claude_design` MCP), we adopted a real design system and applied it across the whole app: **Cormorant Garamond** for display, **EB Garamond** for body (serif now, not sans), **IBM Plex Mono** for the uppercase micro-labels that thread through every screen. Parchment by day, espresso by night, with **terracotta** as the primary accent and **gold** reserved for pace and ratings.

Crucially, the mockup shows screens the data model can't back yet — the co-read split card (the heart of the app), logging a session, inviting a buddy, the activity inbox, the finished-books history. All of those are **M4 work**. So the revamp split cleanly in two:

- **The six real screens** (Welcome, Shelf, Search, Book, Friends, Profile) were restyled in place — markup and classes only, not a line of logic, routing, or Firebase touched. Google sign-in, friend add-by-code, invite-code copy, and the debounced search all still work exactly as before.
- **The five M4-vision screens** were built as **presentational mocks** fed by an isolated `src/demo/` folder. They make the whole product legible today; when M4 lands, `src/demo/` is deleted and the pages read from Firestore.

### Decisions & trade-offs (and what we rejected)

- **Two accents, deliberately.** CLAUDE.md had said "one muted accent, never bright." The mockup introduces a second — gold — specifically for a buddy's pace and for star ratings. We adopted it because it *serves the thesis*: terracotta is you/your action, gold is the other reader, and the two never compete on the same bar. Updated the design-system rule rather than quietly breaking it.
- **Keep Google sign-in; drop the mockup's code entry.** The Welcome mock shows a friend's-code field and a "Begin together" button — a different auth model than the one that's actually built (M1 Google). We kept the working sign-in and took only the *look* (the wordmark, the "Est. MMXXVI · a reading compact" framing, the fleuron). Building a non-functional code field would have been a lie on the most important first screen.
- **Mocks over stubs over nothing.** We could have shipped only the design system, or only the real screens. Mocking the M4 screens with throwaway demo data costs a little now and gets deleted later — but it's the only way the co-read card, the thing the entire app exists for, is visible before the backend for it exists.
- **Fluid, not 390px.** The mockup is pixel-fixed at one phone size. We translated proportions into the existing phone/`ipad:` system rather than hardcoding widths, and dropped the mockup's fake iOS status bar and phone bezel — those are presentation chrome; a real PWA gets the OS status bar and the existing `DeviceFrame` cap.

### Notable details & gotchas

- **`text-transform` collisions.** An early `Eyebrow` (always uppercase) was reused for date lines with a `normal-case` override — but both utilities set `text-transform`, so the winner depends on CSS source order, not class order. Swapped those spots to plain mono spans. A reminder that "just add the override class" isn't reliable when two utilities target the same property.
- **Spine placeholders carry the demo.** The finished-books and demo covers have no ISBN, so `coverCandidates` returns `[]` and `BookCover` lands on its placeholder immediately — which we upgraded from a flat box to a gradient "spine" with the title set in Cormorant. A missing cover now reads as a bound book, and the demo screens get their art for free.
- **Avatars gained a `tone`.** Real users have photos; the demo readers don't. `Avatar` now takes an optional gradient `tone` (terracotta = you, gold = Meher, green = Aisha) so people stay legible at a glance without a single fetched image.
- **Honest about verification.** Build, typecheck, and lint are green and the dev server boots clean, but a full visual walkthrough across both themes hadn't been done at commit time — noted as such rather than claimed.

### Questions an interviewer might ask

- **Q: Why build screens you know you'll throw away?**
  Because the split progress card is the product, and it had never been visible. A design system on top of empty screens doesn't communicate the idea; mocked screens do. The throwaway cost is bounded — one `src/demo/` folder and a one-line note in CLAUDE.md telling M4 to delete it — and the payoff is that everyone can see what we're building before the data model for it exists.

- **Q: How do you keep a visual revamp from breaking working features?**
  Touch markup, not logic. The six real screens kept their hooks, effects, routing, and Firebase calls byte-for-byte; only JSX structure and class names changed. The build's typecheck is the backstop — if a restyle had dropped a prop or a handler, `tsc` would have caught it.

- **Q: You changed the body font from sans to serif. Isn't that a readability risk?**
  EB Garamond is a text-grade serif designed for body copy, and the app is short-form by nature — progress cards, notes, lists, not long articles. The serif body is what makes the "old library" feeling cohere rather than reading as a sans app wearing a serif hat. Headings, body, and labels are now three deliberate voices (Cormorant, EB Garamond, Plex Mono) instead of two.

### Addendum — clean slate

Seeing the mocks in the running app, we pulled them. Fabricated activity, a fake finished-books shelf, and a demo co-read with invented names (Meher, "The Secret History" at 35%) read as clutter, not vision — and risked looking like real state. So we deleted `src/demo/` and the mock-only pages (co-read, invite, history) and components (SplitProgressCard, LogSessionSheet, ProgressBar, StarRating). The Shelf and Activity are now honest empty states; the design system and the six real screens stand on their own. The co-read split card returns in M4, built against the real `reads` model rather than a demo shape. The lesson kept: mocks earn their keep only while they clarify more than they mislead — past that point, an honest empty state says more.
