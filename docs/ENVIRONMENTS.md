# Environments

Puddle runs in three tiers. The goal is that every change is exercised in a
real, isolated environment before it can touch production.

| Tier | Where | App URL | Database | Triggered by |
|------|-------|---------|----------|--------------|
| **Development** | Your machine | `localhost:3000` | Staging Supabase (or local) | `npm run dev` |
| **Staging / Preview** | Vercel Preview | Per-PR preview URL | Staging Supabase | Any branch / open PR |
| **Production** | Vercel Production | `solvepuddle.com` | Production Supabase | Merge to `main` |

Because we're **trunk-based**, "staging" isn't a single long-lived server — it's
the **per-PR Vercel preview deployment**. Each pull request gets its own URL that
builds the branch and points at the staging database, so every change is
verified in isolation before merge. (If you ever want one stable staging URL,
alias a preview in Vercel or keep a `staging` branch — not required.)

## Vercel configuration

Vercel already separates **Production** (the `main` branch) from **Preview**
(every other branch) from **Development** (local). Scope environment variables
per target in **Vercel → Settings → Environment Variables**:

- **Production** vars → production Supabase + production Discord app.
- **Preview** vars → staging Supabase + (see Discord note below).
- **Development** → your local `app/.env.local`.

The same variable name (e.g. `NEXT_PUBLIC_SUPABASE_URL`) gets a different value
per environment. That's how one codebase talks to the right database.

## Supabase: two projects, $0

We use **two separate Supabase projects** rather than one shared database:

- `puddle` — production.
- `puddle-staging` — staging (create this).

**Cost:** the Supabase Free plan allows **2 active projects** per organization,
so the second project is free. Note that free projects **pause after ~7 days of
inactivity** — resume from the dashboard when you next need staging. (Supabase
*Branching*, which spins up ephemeral preview DBs, requires the paid Pro plan, so
we use a second free project instead.)

### One-time staging setup

1. Create the `puddle-staging` Supabase project.
2. Apply every migration in `app/supabase/migrations/` **in order** via its SQL
   editor, so staging matches the production schema.
3. Enable the auth providers you need (Google, Discord) on the staging project.
4. Put the staging URL + keys into Vercel's **Preview** environment variables and
   into your local `app/.env.local` for dev.

## Migrations across environments

Migrations are applied **manually in the SQL editor** (see
[CONTRIBUTING.md](../CONTRIBUTING.md)). The order is always **staging → verify →
production**:

1. Open a PR that includes the new `app/supabase/migrations/00X_*.sql`.
2. Apply it to **staging**; confirm the PR preview works against it.
3. When releasing, apply it to **production** *before* the dependent code serves
   traffic, then merge.

> This sequence is exactly what prevents the "column does not exist" class of
> outage: prod code never depends on a migration that prod hasn't run yet.

## Discord on previews (known limitation)

Discord OAuth and Activities require **pre-registered redirect URIs / URL
mappings**, which ephemeral per-PR preview URLs don't have. So Discord *login*
and the *Activity* can't be fully exercised on an arbitrary preview. Options:

- Test Discord-specific changes against a **stable staging URL** (aliased
  preview) whose redirect URI you register once on a **staging Discord app**, or
- Verify Discord flows in production right after release.

Non-Discord changes are unaffected and verify normally on any preview.
