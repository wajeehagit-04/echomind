# Echomind — Tasks

Implementation checklist derived from `specs/requirements.md` and `specs/design.md`. Execute one task at a
time, in order — each task leaves the app in a working (if incomplete) state. Requirement IDs are cited for
traceability back to `requirements.md`.

- [x] 1. Project scaffolding & config
  - Initialize Next.js (App Router, TypeScript, Tailwind) project.
  - Install `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`.
  - Define the semantic palette tokens (background, surface, ink, muted, accent, success, danger,
    hairline) as CSS variables in `app/globals.css` and map them into Tailwind's `@theme inline` block
    (scaffolded with Tailwind v4 — CSS-first theming, no `tailwind.config.ts`).
  - Load Source Serif 4 + IBM Plex Sans via `next/font/google` in `app/layout.tsx`; wire `font-serif` /
    `font-sans` into the same `@theme inline` block.
  - Create `.env.local.example` documenting `DATABASE_URL`.
  - Create `drizzle.config.ts` reading `DATABASE_URL` from the environment.
  - _Requirements: R11.1, R11.3; environment per design §10_

- [x] 2. Branding assets
  - Add the provided `echomind_icon.svg` and `echomind_wordmark.svg` to `/public`, unmodified.
  - Wire `echomind_icon.svg` as the favicon/app icon in `app/layout.tsx` metadata.
  - _Requirements: R11.6, R11.8_

- [x] 3. Data layer — schema & client
  - `db/schema.ts`: define the `sessions` table exactly per R1.1 (all columns, types, defaults).
  - `db/client.ts`: Drizzle instance using the Neon HTTP driver, reading `process.env.DATABASE_URL`.
  - _Requirements: R1.1, R1.2; design §3_

- [x] 4. Initial migration
  - Run `drizzle-kit generate` to produce the migration for the `sessions` table.
  - Apply it (`drizzle-kit migrate` or `push`) against the Neon database.
  - _Requirements: R1.1_

- [x] 5. Shared types
  - `lib/types.ts`: `Phase` union, `SessionState` interface, any shared request/response shapes for
    `/api/sessions`.
  - _Design §5_

- [x] 6. Word sets & session generation
  - `lib/words.ts`: `SET_A_CLASSIC`, `SET_B_ALT`, `SET_C_ALT`, `FOIL_POOL` constants (verbatim word lists).
  - `generateSession()`: combine into a 30-word pool, sample 10 for `wordList`; sample 10 for `foilList`
    from a candidate set of the remaining 20 pool words + `FOIL_POOL`, excluding anything in `wordList`.
  - _Requirements: R2.1–R2.5, R3.1–R3.5; design §4_

- [x] 7. Scoring functions
  - `lib/scoring.ts`: `computeFreeRecallStats(wordList, freeRecallWords)` → hits, misses, intrusions.
  - `computeRecognitionStats(wordList, foilList, recognitionAnswers)` → hits, false alarms, discrimination
    score.
  - Pure functions, no side effects — reused by both `ResultsPhase` and `/api/sessions`.
  - _Requirements: R6.3–R6.5, R7.3–R7.5; design §5, §8_

- [x] 8. POST /api/sessions
  - `app/api/sessions/route.ts`: accept `{ wordList, foilList, freeRecallWords, recognitionAnswers }`.
  - Recompute all derived scores server-side via `lib/scoring.ts` (do not trust client-submitted scores).
  - Insert the full row via Drizzle; respond `201` with `{ id, createdAt }`.
  - _Requirements: R8.3, R8.4; design §8_

- [x] 9. UI primitives
  - `components/ui/Button.tsx`, `components/ui/Card.tsx` styled to the palette (accent-colored primary
    button, surface-colored cards, hairline borders).
  - _Requirements: R11.1, R11.2, R11.4_

- [x] 10. AppHeader (persistent header + disclaimer)
  - `components/wizard/AppHeader.tsx`: renders `echomind_wordmark.svg` (or icon + live "Echomind" text in
    `font-serif`), plus the disclaimer text verbatim, non-dismissible.
  - Confirm this component is mounted once, outside the phase-switching subtree, so it never unmounts
    across phase transitions.
  - _Requirements: R11.7, R11.9, R11.10, R11.11; design §6_

- [x] 11. Wizard shell & phase state machine
  - `components/wizard/Wizard.tsx`: `useReducer` with `SESSION_READY`, `ADVANCE`, `SUBMIT_RECALL`,
    `SUBMIT_RECOGNITION`, `RESET` actions per design §5.
  - Starts in a loading state; `useEffect` on mount calls `generateSession()` and dispatches
    `SESSION_READY` (avoids SSR/hydration mismatch — words never render server-side).
  - `PhaseContent` sub-component: switches on `phase`, keyed remount, CSS fade/translate transition on
    change.
  - `app/page.tsx`: renders `<AppHeader />` + `<Wizard />`.
  - _Requirements: R3.6, R10.1–R10.3, R11.5; design §4, §5, §7_

- [x] 12. Study phase
  - `components/wizard/StudyPhase.tsx`: grid of `wordList`; visible minimum-exposure countdown; "Continue"
    disabled until timer elapses, then enabled (never auto-advances).
  - _Requirements: R4.1–R4.5_

- [x] 13. Distraction phase
  - `components/wizard/DistractionPhase.tsx`: 5 sequential serial-subtraction problems (random two-digit
    minus one-digit), local-only state, not persisted; advances after round 5.
  - _Requirements: R5.1–R5.3_

- [x] 14. Recall phase
  - `components/wizard/RecallPhase.tsx`: textarea (comma/newline separated); on submit, parse
    (split → trim → lowercase → drop empties), dispatch `SUBMIT_RECALL`.
  - _Requirements: R6.1, R6.2_

- [x] 15. Recognition phase
  - `components/wizard/RecognitionPhase.tsx`: shuffle `[...wordList, ...foilList]` once (memoized on
    mount); render 20 rows with "In list" / "Not in list"; Submit disabled until all 20 answered; dispatch
    `SUBMIT_RECOGNITION`.
  - _Requirements: R7.1, R7.2_

- [x] 16. Results phase
  - `components/wizard/ResultsPhase.tsx`: compute stats via `lib/scoring.ts` (`useMemo`); render free
    recall hits/misses/intrusions, recognition hits/false alarms/discrimination score, and the visual
    hit/miss/intrusion breakdown.
  - On mount, POST the raw session data to `/api/sessions`; on failure, log to console and show a small
    inline "couldn't save this session" note without blocking the display.
  - "Try again" dispatches `RESET`. Render a link to `/history` (only place in the app this link exists).
  - _Requirements: R8.1, R8.2, R8.3, R8.5, R10.8_

- [x] 17. History page
  - `app/history/page.tsx`: server component, `db.select().from(sessions).orderBy(desc(sessions.createdAt))`.
  - Export `export const dynamic = 'force-dynamic'` so the page queries fresh on every request instead of
    being statically prerendered at build time.
  - `components/history/SessionTable.tsx`: renders timestamp + key scores per row, most-recent-first.
  - No auth guard.
  - _Requirements: R9.1–R9.3, R10.7_

- [x] 18. End-to-end pass
  - Walk the full flow (study → distraction → recall → recognition → results → history) manually.
  - Verify against `requirements.md`: no back-navigation to study words, no per-phase routes, disclaimer
    visible in every phase, `/history` link only appears post-results, palette/typography/motion match
    R11, a persisted session round-trips correctly into `/history`.
