@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Echomind — a cognitive memory test modeled on the CERAD Word List Memory Test. This is a portfolio/demo
tool, **not** a diagnostic product.

## Tech stack

- Next.js (App Router, TypeScript) — v16, Tailwind CSS v4 (CSS-first theming via `@theme` in
  `app/globals.css`, no `tailwind.config.ts`)
- Drizzle ORM
- Neon Postgres
- Deployed on Vercel

## Environment

- `DATABASE_URL` is read from `process.env`, provided via Vercel's Neon integration — never hardcode it.
- `.env.local.example` documents the required variable(s).

## Navigation constraint (hard rule)

This app is a **single-screen wizard**. All test phases — study, distraction, recall, recognition,
results — render on the same route (`/`) and swap via client-side state.

- Never separate routes per phase.
- Never a scrollable page.
- Never a way to scroll or navigate back to the study word list once it's left.
- `/history` is the only separate route, and only reachable after a session completes.

## Common commands

- `npm run dev`
- `drizzle-kit generate`
- `drizzle-kit migrate` (or `push`)

## Specs

`specs/requirements.md`, `specs/design.md`, and `specs/tasks.md` hold the current feature's detailed plan
and are the source of truth for implementation decisions. This file (CLAUDE.md) is for standing
conventions, not feature-specific detail.
