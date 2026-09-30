# Echomind

A single-sitting cognitive memory test modeled on the **CERAD Word List Memory Test**, a real clinical
instrument used in dementia assessment.

> Echomind is a demo modeled on a real clinical memory test structure (CERAD Word List Memory Test). It is
> not validated and is not a diagnostic tool.

## What it does

Echomind walks a user through the CERAD protocol as a single-screen wizard (study → distraction → free
recall → recognition → results), computes standard CERAD-style scores, and persists each session so it can
be reviewed later on `/history`.

- **Word sets** — one validated CERAD word list (Set A) plus two structurally similar, non-validated
  alternate sets (B/C), combined into a pool that's randomly sampled fresh every session
- **Study phase** — timed exposure to 10 study words
- **Distraction phase** — 5 serial-subtraction problems, mirroring the MMSE serial-7s task
- **Free recall** — free-text recall scored for hits, misses, and intrusions
- **Recognition** — old/new judgments over studied + foil words, scored for hits, false alarms, and a
  discrimination score
- **Results** — full score breakdown, persisted via `/api/sessions`
- **History** (`/history`) — past sessions listed most-recent-first; the only route besides `/`

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, TypeScript), React 19
- Tailwind CSS v4 (CSS-first theming via `@theme`, no `tailwind.config.ts`)
- [Drizzle ORM](https://orm.drizzle.team) against [Neon](https://neon.tech) Postgres
- Deployed on [Vercel](https://vercel.com)

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in DATABASE_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

Schema lives in `db/schema.ts`, managed with Drizzle Kit:

```bash
npx drizzle-kit generate   # generate a migration from schema changes
npx drizzle-kit migrate    # apply migrations
# or: npx drizzle-kit push # push schema directly (dev convenience)
```

`DATABASE_URL` is read from the environment — on Vercel it's provided automatically via the Neon
integration; locally, set it in `.env.local` (never commit this file).

## Project structure

- `app/` — the single-screen wizard (`/`) and the history route (`/history`)
- `components/` — UI components
- `db/` — Drizzle schema and client
- `drizzle/` — generated SQL migrations
- `lib/` — shared types and utilities
- `specs/` — requirements, design, and task docs that are the source of truth for feature decisions

## Disclaimer

This is a portfolio/demo project, **not** a diagnostic product, and is not affiliated with or endorsed by
the CERAD consortium.
