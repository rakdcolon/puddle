# puddle

A quiet daily puzzle column. One puzzle a day across six genres — logic, deduction, quant, sequences, lateral riddles, and wordplay. Editorial aesthetic, no notification spam.

## Tech stack

- **Frontend/backend:** Next.js (App Router) + Tailwind CSS
- **Auth:** Supabase Auth (Google OAuth)
- **Database:** Supabase (Postgres)
- **Hosting:** Vercel

## Running locally

```bash
cd app
npm install
npm run dev
```

The app runs at `http://localhost:3000`. You need a `.env.local` inside `app/` — copy `.env.local.example` and fill in the Supabase credentials.

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

Five tables: `users`, `puzzles`, `solves`, `user_settings`, `submissions`. See `app/supabase/migrations/001_schema.sql`.
