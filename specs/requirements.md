# Echomind — Requirements

## Overview

Echomind is a single-sitting cognitive memory test modeled on the CERAD Word List Memory Test, a real
clinical instrument used in dementia assessment. Echomind is a portfolio/demo tool, not a diagnostic
product. It presents study, distraction, free recall, and recognition phases, computes standard CERAD-style
scores, persists each session, and lists past sessions on a history page.

Acceptance criteria below use EARS syntax (WHEN/IF ... THEN THE SYSTEM SHALL ...).

---

## R1 — Session data model

**User story:** As the system, I need a durable record of each completed session so that scores can be
reviewed later on the history page.

- **R1.1** THE SYSTEM SHALL store each session in a `sessions` table with columns: `id` (uuid, primary
  key, default random), `created_at` (timestamp, default now), `word_list` (text array), `foil_list` (text
  array), `free_recall_words` (text array), `free_recall_hits` (integer), `free_recall_intrusions` (text
  array), `recognition_answers` (jsonb, word → "yes"/"no"), `recognition_hits` (integer),
  `recognition_false_alarms` (integer), `discrimination_score` (integer).
- **R1.2** THE SYSTEM SHALL define and query this schema using Drizzle ORM against Neon Postgres.

## R2 — Word sets

**User story:** As a user, I need the study material to be drawn from a validated instrument plus
structurally similar alternates, with the difference in validation status made clear to me.

- **R2.1** THE SYSTEM SHALL define three fixed 10-word constants — `SET_A_CLASSIC`, `SET_B_ALT`,
  `SET_C_ALT` — sharing no words with one another.
- **R2.2** THE SYSTEM SHALL treat `SET_A_CLASSIC` as the real, validated CERAD Word List Memory Test
  instrument.
- **R2.3** THE SYSTEM SHALL treat `SET_B_ALT` and `SET_C_ALT` as mirroring Set A's category structure
  (material, body part, landscape, paper item, royal title, dwelling, tall/thin object, paper voucher,
  ground surface, machine) without being independently validated.
- **R2.4** WHEN any UI surface displays or references the word sets' provenance, THE SYSTEM SHALL state
  explicitly that only Set A is the validated CERAD instrument and that Sets B/C are not independently
  validated. (Exact copy is defined in the Visual design & disclaimer section.)
- **R2.5** THE SYSTEM SHALL define a `FOIL_POOL` constant of 20 distractor words disjoint from Sets A, B,
  and C.

## R3 — Word list generation

**User story:** As a user, I need a fresh, unbiased set of study and foil words every time I take the
test, without having to choose anything.

- **R3.1** WHEN a new session starts, THE SYSTEM SHALL combine Sets A, B, and C into a single 30-word pool.
- **R3.2** WHEN generating a session's study list, THE SYSTEM SHALL randomly sample 10 words from the
  combined pool.
- **R3.3** WHEN generating a session's foil list, THE SYSTEM SHALL randomly sample 10 words from a
  candidate set consisting of the 20 combined-pool words not selected for the study list, plus
  `FOIL_POOL`, excluding any word present in the study list.
- **R3.4** THE SYSTEM SHALL ensure the study list and foil list never share a word within a session.
- **R3.5** THE SYSTEM SHALL generate a new random study/foil list pair for every session and SHALL NOT
  expose any user-facing mode-selection control.
- **R3.6** IF a session starts, whether on initial load or via "Try again", THEN THE SYSTEM SHALL
  regenerate the study/foil lists independently of any prior session.

## R4 — Study phase

**User story:** As a user, I need to see the words I'll be tested on before the test begins.

- **R4.1** WHEN the study phase renders, THE SYSTEM SHALL display the session's 10 study words in a grid.
- **R4.2** THE SYSTEM SHALL provide a "Continue" control that advances from the study phase to the
  distraction phase.
- **R4.3** THE SYSTEM SHALL display a visible minimum-exposure timer during the study phase.
- **R4.4** WHILE the minimum-exposure timer has not yet elapsed, THE SYSTEM SHALL keep the "Continue"
  control disabled (non-clickable).
- **R4.5** WHEN the minimum-exposure timer elapses, THE SYSTEM SHALL enable the "Continue" control and
  SHALL NOT auto-advance or force the phase transition — the user must still click "Continue".

## R5 — Distraction phase

**User story:** As a user, I need a brief distractor task between study and recall, consistent with the
CERAD/MMSE protocol.

- **R5.1** WHEN the distraction phase begins, THE SYSTEM SHALL present 5 serial-subtraction problems, one
  at a time.
- **R5.2** THE SYSTEM SHALL generate each problem as a random two-digit number minus a random one-digit
  number, mirroring the MMSE serial-7s task.
- **R5.3** WHEN all 5 distraction rounds are completed, THE SYSTEM SHALL advance to the free recall phase.

## R6 — Free recall phase

**User story:** As a user, I need to freely type out the words I remember and get accurate scoring.

- **R6.1** WHEN the free recall phase renders, THE SYSTEM SHALL present a textarea accepting comma- and/or
  newline-separated word input.
- **R6.2** WHEN the user submits free recall input, THE SYSTEM SHALL parse it into individual words,
  lowercasing and trimming each.
- **R6.3** THE SYSTEM SHALL compute free-recall hits as parsed words that match the study list.
- **R6.4** THE SYSTEM SHALL compute free-recall misses as study-list words absent from the parsed input.
- **R6.5** THE SYSTEM SHALL compute free-recall intrusions as parsed words not present in the study list.

## R7 — Recognition phase

**User story:** As a user, I need to identify which words were on the original list from a mixed set of
studied and new words.

- **R7.1** WHEN the recognition phase renders, THE SYSTEM SHALL present a shuffled combination of the 10
  study words and 10 foil words.
- **R7.2** FOR each word shown, THE SYSTEM SHALL provide "In list" / "Not in list" response controls.
- **R7.3** THE SYSTEM SHALL compute recognition hits as study words correctly marked "In list".
- **R7.4** THE SYSTEM SHALL compute recognition false alarms as foil words incorrectly marked "In list".
- **R7.5** THE SYSTEM SHALL compute discrimination score as recognition hits minus recognition false
  alarms.

## R8 — Results phase & persistence

**User story:** As a user, I need to see my full results at the end and know they're saved for later
review.

- **R8.1** WHEN the results phase renders, THE SYSTEM SHALL display free-recall hits, misses, and
  intrusions, recognition hits and false alarms, and the discrimination score.
- **R8.2** THE SYSTEM SHALL present a visual breakdown of hit/miss/intrusion words.
- **R8.3** WHEN the results phase is reached, THE SYSTEM SHALL POST the complete session record —
  including the actual `word_list` and `foil_list` used — to `/api/sessions`.
- **R8.4** WHEN `/api/sessions` receives a POST request, THE SYSTEM SHALL insert the session record into
  the `sessions` table via Drizzle.
- **R8.5** WHEN the user activates "Try again", THE SYSTEM SHALL reset all in-memory session state and
  generate a fresh random study/foil list pair.

## R9 — History page

**User story:** As a user, I need to browse past sessions and their scores.

- **R9.1** WHEN `/history` is requested, THE SYSTEM SHALL fetch past sessions from the database.
- **R9.2** THE SYSTEM SHALL list past sessions ordered most-recent-first, showing at minimum the timestamp
  and key scores.
- **R9.3** THE SYSTEM SHALL NOT require authentication to view `/history`.

## R10 — Navigation model (single-screen wizard)

**User story:** As a user, I need the test to behave like a proctored, one-way instrument — no way to
scroll back to the study words or jump between phases.

- **R10.1** THE SYSTEM SHALL render all five test phases (study, distraction, recall, recognition, results)
  on a single route (`/`).
- **R10.2** THE SYSTEM SHALL transition between phases via client-side state, never via route changes and
  never via scroll position.
- **R10.3** THE SYSTEM SHALL NOT expose separate routes per phase (e.g. no `/study`, no `/recall`).
- **R10.4** IF the user has left the study phase, THEN THE SYSTEM SHALL NOT provide any in-app control
  that makes the study word list visible or reachable again.
- **R10.5** THE SYSTEM SHALL NOT display a "back" control between any two phases.
- **R10.6** THE SYSTEM SHALL leave default browser back-button behavior unmodified.
- **R10.7** THE SYSTEM SHALL treat `/history` as the only route in the application separate from `/`.
- **R10.8** THE SYSTEM SHALL present an in-app link or control to `/history` only once the results phase
  has been reached, and never during study, distraction, recall, or recognition.

## R11 — Visual design & disclaimer

**User story:** As a user, I need the app to look intentional and premium while being honest, clearly and
persistently, that it is a demo and not a diagnostic instrument.

**Palette — "elevated dark, one bold accent":**

- **R11.1** THE SYSTEM SHALL apply the following palette: background `#16181C`, raised surface (cards,
  inputs) `#1F2227`, primary text `#EDEAE3`, secondary/muted text `#9A9A92`, accent `#E8A33D`,
  success/hit state `#3F8F6B`, miss/error state `#B0473F`, hairline borders `#2C2F35`.
- **R11.2** THE SYSTEM SHALL reserve the accent color (`#E8A33D`) for a single bold role — buttons, active
  states, and the app name/logo — and SHALL NOT use it as a general background or secondary fill color.
- **R11.3** THE SYSTEM SHALL use a confident serif typeface (e.g. Source Serif 4) for the app name,
  headings, and score numbers, and a clean sans-serif typeface (e.g. IBM Plex Sans or Inter) for UI and
  body text.
- **R11.4** THE SYSTEM SHALL NOT use cream backgrounds, terracotta accents, soft pastel wellness palettes,
  generic white SaaS cards with soft drop shadows, or all-caps tracked-out labels.
- **R11.5** WHEN a phase transition occurs, THE SYSTEM SHALL apply subtle motion (e.g. a card flip/fade)
  limited to that state change, and SHALL NOT use decorative animation elsewhere.

**Branding assets:**

- **R11.6** THE SYSTEM SHALL place the provided `echomind_icon.svg` in `/public` and use it as the
  favicon/app icon.
- **R11.7** THE SYSTEM SHALL render the main page header using `echomind_wordmark.svg`, or the icon plus
  "Echomind" set live in the app's serif heading font.
- **R11.8** THE SYSTEM SHALL NOT redesign or recolor the provided `echomind_icon.svg` or
  `echomind_wordmark.svg` assets.

**Disclaimer:**

- **R11.9** THE SYSTEM SHALL display the following disclaimer text verbatim: "Echomind is a demo modeled
  on a real clinical memory test structure (CERAD Word List Memory Test). It is not validated and is not a
  diagnostic tool."
- **R11.10** THE SYSTEM SHALL display this disclaimer persistently and clearly visible — never inside a
  popup, modal, or dismissible dialog — on the main page (`/`).
- **R11.11** THE SYSTEM SHALL display this disclaimer, persistently and clearly visible, on the results
  phase specifically, in addition to R11.10.

---

## Open items for design phase

*None currently.*
