# Echomind — Design

This document translates `specs/requirements.md` into a concrete technical design: file structure, data
flow, state machine, API contracts, and styling system. No application code is written yet.

---

## 1. Architecture overview

- Next.js App Router, TypeScript, single Vercel deployment.
- `/` is a client-rendered wizard: one root client component owns phase state and session state; the five
  phases are swapped views inside it (R10.1–R10.3).
- `/history` is a React Server Component that queries Neon directly via Drizzle — no API route needed for
  reads.
- `/api/sessions` is the only API route: a POST handler that persists a completed session.
- Session scoring (free recall + recognition) is computed by shared pure functions used both in the
  Results phase (for display) and in the API route (for the authoritative persisted values) — see §8.

## 2. Project structure

```
app/
  layout.tsx              root layout: fonts, metadata/favicon, global CSS
  page.tsx                "/" — renders <Wizard />
  history/
    page.tsx               "/history" — server component, direct Drizzle query
  api/
    sessions/
      route.ts              POST handler
components/
  wizard/
    Wizard.tsx              owns phase + session state, renders shell + active phase
    AppHeader.tsx           wordmark/logo + persistent disclaimer (never unmounts)
    StudyPhase.tsx
    DistractionPhase.tsx
    RecallPhase.tsx
    RecognitionPhase.tsx
    ResultsPhase.tsx
  history/
    SessionTable.tsx
  ui/
    Button.tsx, Card.tsx    shared primitives styled to the palette
db/
  schema.ts                 Drizzle table definition
  client.ts                 Drizzle + Neon connection
lib/
  words.ts                  SET_A_CLASSIC / SET_B_ALT / SET_C_ALT / FOIL_POOL / generateSession()
  scoring.ts                 computeFreeRecallStats(), computeRecognitionStats()
  types.ts                   Phase, SessionState, and shared interfaces
drizzle.config.ts
public/
  echomind_icon.svg
  echomind_wordmark.svg
.env.local.example
```

Scaffolded with Tailwind v4, which uses CSS-first theming (`@theme` in `app/globals.css`) rather than a
`tailwind.config.ts` file — see §7.

## 3. Data layer

- `db/schema.ts` defines the `sessions` table exactly as specified in R1.1, using Drizzle's `pgTable`
  (`uuid().defaultRandom().primaryKey()`, `timestamp().defaultNow()`, `text().array()`, `integer()`,
  `jsonb()`).
- `db/client.ts` creates the Drizzle instance using the Neon HTTP driver
  (`drizzle-orm/neon-http` + `@neondatabase/serverless`), reading `process.env.DATABASE_URL`. The HTTP
  driver is chosen over a pooled/websocket driver because every call site (one API route, one server
  component) issues a single query per invocation — a good fit for Vercel serverless functions, no
  connection pooling required.
- Migrations are managed with `drizzle-kit` (`generate` to produce SQL from `schema.ts`, `migrate`/`push`
  to apply). `drizzle.config.ts` reads `DATABASE_URL` from the environment.
- `.env.local.example` documents `DATABASE_URL=` with a comment that Vercel's Neon integration provides
  the real value in deployed environments.

## 4. Word sets & session generation

`lib/words.ts` holds the four constants verbatim (`SET_A_CLASSIC`, `SET_B_ALT`, `SET_C_ALT`, `FOIL_POOL`)
and one pure function:

```
generateSession(): { wordList: string[]; foilList: string[] }
```

Implementation follows R3.1–R3.4: combine the three 10-word sets into a 30-word pool, randomly sample 10
for `wordList`, then randomly sample 10 for `foilList` from a candidate set of the 20 unselected pool words
plus `FOIL_POOL` (30 candidates total), filtering out anything present in `wordList` first.

**Hydration note:** because the list is random per session, it must not be generated during server
rendering (it would mismatch the client's first render and either throw a hydration error or flash
incorrect words). `Wizard` therefore starts with no word lists, and calls `generateSession()` in a
`useEffect` that runs once on mount, then transitions into the study phase. The server-rendered and
first-client-rendered HTML are both an empty/loading shell; the actual words only ever render client-side.
The same applies on "Try again" (R8.5) — trivially safe there since it's already a client-side event.

## 5. Application state & phase machine

`lib/types.ts`:

```
type Phase = 'study' | 'distraction' | 'recall' | 'recognition' | 'results';

interface SessionState {
  wordList: string[];
  foilList: string[];
  freeRecallWords: string[];        // parsed, lowercased, trimmed
  recognitionAnswers: Record<string, 'yes' | 'no'>;
}
```

`Wizard.tsx` owns `phase: Phase | 'loading'` and `session: SessionState` via `useReducer`. Actions:

- `SESSION_READY` — sets `wordList`/`foilList` from `generateSession()`, moves `loading → study`.
- `ADVANCE` — moves to the next phase in the fixed order (`study → distraction → recall → recognition →
  results`); phase order lives in one place so it can't drift.
- `SUBMIT_RECALL(words: string[])` — stores parsed words, then advances.
- `SUBMIT_RECOGNITION(answers)` — stores the answer map, then advances.
- `RESET` — re-runs `generateSession()`, clears `freeRecallWords`/`recognitionAnswers`, returns to `study`.

Raw inputs (`freeRecallWords`, `recognitionAnswers`) are kept in state; hits/misses/intrusions/false-alarms/
discrimination are **derived**, not stored redundantly — computed via `lib/scoring.ts` with `useMemo` when
the Results phase renders, and independently recomputed server-side on POST (§8). This keeps one source of
truth for the scoring rules (R6.3–R6.5, R7.3–R7.5) instead of duplicating the logic client- and
server-side with room to drift.

The distraction phase (R5.1–R5.3) is local-only state inside `DistractionPhase.tsx` (current round 0–4,
current problem). Per-round answers are not validated or persisted — the sessions table has no distraction
columns, so this phase is purely the CERAD/MMSE-style interference task, not a scored step. After 5 rounds
it calls `ADVANCE`.

## 6. Component architecture

`Wizard.tsx` renders:

```
<AppHeader />               ← persistent: wordmark + disclaimer, never unmounts across phases
<PhaseContent />            ← swaps StudyPhase / DistractionPhase / RecallPhase / RecognitionPhase / ResultsPhase
```

Putting the disclaimer inside the always-mounted `AppHeader` (rather than inside each phase component)
satisfies R11.10 (visible on the main page) and R11.11 (visible specifically on results) with one
component instead of duplicating it — it's simply never removed from the tree regardless of phase.

`PhaseContent` renders the active phase keyed by `phase`, so React remounts the subtree on every
transition; this is also the hook used for the phase-transition motion (§7).

Each phase component:
- **StudyPhase** — grid of `session.wordList`; visible countdown; "Continue" disabled via local timer
  state until it reaches 0 (R4.3–R4.5); on click, `ADVANCE`.
- **DistractionPhase** — as above; calls `ADVANCE` after round 5.
- **RecallPhase** — textarea + "Submit"; on submit, parses (split on `,`/newline, `trim().toLowerCase()`,
  drop empties), dispatches `SUBMIT_RECALL`.
- **RecognitionPhase** — shuffles `[...wordList, ...foilList]` once (via `useMemo`, seeded by the phase
  mount) and renders 20 rows with "In list"/"Not in list" toggles. "Submit" is disabled until all 20 rows
  have an answer — see §9 for why this gating was added.
- **ResultsPhase** — computes stats via `lib/scoring.ts`, renders them plus the hit/miss/intrusion visual
  breakdown (R8.2), fires the `/api/sessions` POST once on mount, and renders "Try again" (`RESET`) and a
  link to `/history`. The `/history` link only exists inside this component, which is the only place it
  could render (R10.8).

## 7. Styling system

- **Palette** — the project scaffolded with Tailwind v4, which configures theme values in CSS rather than
  `tailwind.config.ts`. Semantic tokens (`background`, `surface`, `ink`, `muted`, `accent`, `success`,
  `danger`, `hairline`) are defined as CSS variables in `app/globals.css` and mapped into Tailwind's
  `@theme inline` block, which is what generates the utility classes (`bg-background`, `text-ink`,
  `bg-accent`, `border-hairline`, etc.). Components reference the semantic utility classes, never raw hex,
  so the palette stays centralized in one file.
- **Typography** — `next/font/google` loads Source Serif 4 and IBM Plex Sans once in `app/layout.tsx` as
  CSS variables (`--font-source-serif-4`, `--font-ibm-plex-sans`), mapped in the same `@theme inline` block
  to `--font-serif` / `--font-sans`. Headings, the app name, and score numbers use `font-serif`; everything
  else uses `font-sans`.
- **Motion** — no animation library. `PhaseContent`'s keyed remount is paired with a small CSS
  fade/translate transition (enter: opacity 0→1 + slight translateY, ~150–200ms) applied via a couple of
  Tailwind transition utility classes. This keeps the bundle small and satisfies "subtle motion only on
  state changes" (R11.5) without decorative animation elsewhere.
- **Branding** — `echomind_icon.svg` copied into `/public` unmodified, referenced from `app/layout.tsx`
  metadata as the favicon/app icon (R11.6). `AppHeader` renders `echomind_wordmark.svg` directly via
  `next/image` or an inline `<img>` — not recolored, not rebuilt as JSX/icon font (R11.7–R11.8).

## 8. API design

**`POST /api/sessions`**

Request body — the raw materials, not pre-computed scores:

```
{ wordList: string[], foilList: string[], freeRecallWords: string[], recognitionAnswers: Record<string,'yes'|'no'> }
```

The route handler calls the same `lib/scoring.ts` functions used by `ResultsPhase` to derive
`free_recall_hits`, `free_recall_intrusions`, `recognition_hits`, `recognition_false_alarms`, and
`discrimination_score` **server-side**, then inserts the full row via Drizzle (R8.4). The server
recomputes rather than trusting client-submitted numbers — same rule, single implementation, and the
persisted scores can't be tampered with via the request body. Response: `201` with `{ id, createdAt }`.

**`/history`**

Server component, no API route: `db.select().from(sessions).orderBy(desc(sessions.createdAt))` directly in
`app/history/page.tsx`, rendered into `SessionTable`. Simpler than round-tripping through a GET API route
for a single first-party read.

This project is not using Next.js 16's Cache Components model (no `cacheComponents` flag set), so the
default "previous model" caching rules apply: a page with no `fetch` calls and no request-time APIs is
eligible for static prerendering at build time, which would freeze `/history` on whatever rows existed at
build time. Since sessions are inserted continuously, `app/history/page.tsx` must export
`export const dynamic = 'force-dynamic'` so it queries Neon fresh on every request.

## 9. Edge cases & decisions made during design

These weren't fully specified in requirements; flagging the calls made so they can be overridden if wrong.

- **Recognition submit gating:** the requirements don't say whether all 20 words must be answered before
  continuing. Decision: disable "Submit" until every word has a selection — consistent with the
  gating pattern already established for the study timer (R4.4), and it avoids ambiguous
  null/undefined answers in `recognition_answers` jsonb.
- **Free recall empty/partial submission:** allowed — an empty or partial textarea is valid input (all
  study words simply score as misses); nothing in R6 requires a minimum.
- **POST failure handling:** `ResultsPhase` already has everything it needs to render from local state, so
  a failed POST doesn't block or delay showing results. On failure, log to console and show a small,
  non-blocking inline note ("Couldn't save this session") rather than a retry loop — acceptable for a demo
  tool with no auth/account tying a user to their data anyway.
- **Recognition shuffle stability:** the combined 20-word order is shuffled once per session (memoized on
  phase mount) so it doesn't re-shuffle on every re-render while answers are being selected.

## 10. Environment & configuration

- `.env.local.example`:
  ```
  # Provided automatically in Vercel via the Neon integration; set manually for local dev.
  DATABASE_URL=
  ```
- `drizzle.config.ts` reads `DATABASE_URL` from `process.env` for both `generate` and `migrate`/`push`.
- No other environment variables are required by anything in scope.

---

## Design decisions — confirmed

1. Recognition Submit stays disabled until all 20 words are answered (§9). Confirmed.
2. Phase-transition motion is CSS-only (keyed remount + Tailwind transition classes), no animation
   library (§7). Confirmed.
3. POST failure: console log + small inline note, no retry (§9). Confirmed.
