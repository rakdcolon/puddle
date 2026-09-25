# puddle

Local puzzle curation: see [the local agent guide](docs/LOCAL_AGENT.md) for the
restricted Pi/Ollama profile, local draft database, and review-to-publication path.

Engineering setup: [testing pyramid](docs/TESTING.md) and
[dev / QA / production environments](docs/ENVIRONMENTS.md).

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
npm ci
npm run db:start
npm run db:env
npm run dev
```

The app runs at `http://localhost:3000`. Start Docker Desktop with Linux containers first. `db:env` creates ignored `app/.env.local` using only the local database. See the environment guide for hosted QA setup.

## Development workflow

Puddle follows production-grade practices — trunk-based branches, pull requests,
three environments, and versioned releases. **Don't commit to `main` directly.**

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — branch → PR → squash-merge loop, branch naming, Conventional Commits, local checks, the migration rule.
- **[docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)** — local development / hosted QA / production, and how Vercel + Supabase map to each.
- **[docs/RELEASING.md](docs/RELEASING.md)** — SemVer, cutting releases, hotfixes, and writing patch notes.
- **[CHANGELOG.md](CHANGELOG.md)** — release history; add an entry under `[Unreleased]` in your PR.

CI runs typechecking, coverage, integration tests, security audit, a full build and browser tests on every PR. Vercel previews must use the separate QA database; hosted configuration and required GitHub checks are described in the environment and testing guides.

## Adding puzzles

Puzzle JSON files live in `puzzles/`. Once you've written one, import it into Supabase:

```bash
cd app
npm run import-puzzle -- ../puzzles/your-puzzle.json
```

The script uses `date_active` as the upsert key, preserving puzzle IDs when edition labels change. Volume is the publication year's last two digits; issue number is its day of year (1–365, or 366 in leap years). See `puzzles/template.json` for the schema.

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
