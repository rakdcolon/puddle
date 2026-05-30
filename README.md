# puddle

A quiet daily puzzle column. One puzzle a day across six genres — logic, deduction, quant, sequences, lateral riddles, and wordplay. Editorial aesthetic, no notification spam.

## Tech stack

- **Frontend/backend:** Next.js (App Router) + Tailwind CSS
- **Auth:** Supabase Auth (Google + Discord OAuth, account merge by verified email)
- **Database:** Supabase (Postgres)
- **Hosting:** Vercel
- **Discord:** embedded Activity + rich presence (see [app/docs/DISCORD_INTEGRATION.md](app/docs/DISCORD_INTEGRATION.md))

## Running locally

```bash
cd app
npm install
npm run dev
```

The app runs at `http://localhost:3000`. You need a `.env.local` inside `app/` — copy `.env.local.example` and fill in the credentials (point them at the **staging** Supabase project for local dev, not production).

## Development workflow

Puddle follows production-grade practices — trunk-based branches, pull requests,
three environments, and versioned releases. **Don't commit to `main` directly.**

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — branch → PR → squash-merge loop, branch naming, Conventional Commits, local checks, the migration rule.
- **[docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)** — development / staging (per-PR Vercel previews) / production, and how Vercel + Supabase map to each.
- **[docs/RELEASING.md](docs/RELEASING.md)** — SemVer, cutting releases, hotfixes, and writing patch notes.
- **[CHANGELOG.md](CHANGELOG.md)** — release history; add an entry under `[Unreleased]` in your PR.

CI (typecheck + build) runs on every PR; Vercel posts a preview deployment that serves as the staging environment for that change.

## Adding puzzles

Puzzle JSON files live in `puzzles/`. Once you've written one, import it into Supabase:

```bash
cd app
npm run import-puzzle -- ../puzzles/your-puzzle.json
```

The script uses `issue_no` as the upsert key, so it's safe to re-run to update an existing puzzle. See `puzzles/template.json` for the schema.

## Project layout

```
app/                  Next.js application
  src/
    app/              Routes (App Router)
    components/       Shared UI components
    lib/
      db/             Supabase query helpers
      supabase/       Client/server Supabase instances
      utils/          Dates, XP math
    types/            Shared TypeScript types
  scripts/            CLI utilities (import-puzzle)
  supabase/
    migrations/       SQL schema and seed

puzzles/              Puzzle JSON source files
```

## Database schema

Core tables: `users`, `puzzles`, `solves`, `user_settings`, `submissions`, `anon_solves`. The schema is built up by the ordered SQL files in `app/supabase/migrations/` (starting at `001_schema.sql`), applied by hand in the Supabase SQL editor — see [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md).
