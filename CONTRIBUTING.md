# Contributing to Puddle

Puddle uses a **trunk-based** workflow: `main` is always deployable and is the
single source of truth. All changes land through short-lived branches and pull
requests. **Nothing is committed directly to `main`.**

> Puddle is proprietary and source-available (see [LICENSE](LICENSE)).
> Contributions are welcome and reviewed at the maintainers' discretion; by
> opening a pull request you agree your contribution is licensed under the
> project's terms.

## The loop

1. **Branch off `main`.** Keep branches small and focused — one logical change
   per branch/PR.
   ```bash
   git switch main && git pull
   git switch -c feat/streak-freeze
   ```
2. **Make the change.** Run the checks locally (see below).
3. **Open a pull request into `main`.** CI runs typecheck + build, and Vercel
   posts a **preview deployment** — this is your staging environment for the
   change.
4. **Verify on the preview URL.** Confirm the change works and nothing obvious
   broke before merging.
5. **Squash-merge into `main`.** The merge auto-deploys to production via Vercel.

## Branch naming

Prefix by intent so history reads well:

| Prefix | For |
|--------|-----|
| `feat/` | New functionality |
| `fix/` | Bug fixes |
| `hotfix/` | Urgent production fix (fast-tracked, patch release) |
| `chore/` | Tooling, deps, config |
| `docs/` | Documentation only |
| `refactor/` | Internal change, no behavior change |

## Commits & PRs

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit and
PR titles — they map directly onto the version bump:

- `feat: …` → bumps **minor**
- `fix: …` → bumps **patch**
- `feat!:` or a `BREAKING CHANGE:` footer → bumps **major**

We **squash-merge**, so the PR title becomes the commit on `main`. Keep it a clean
Conventional Commit.

## Local checks

Run before pushing — CI gates on the first two:

```bash
cd app
npx tsc --noEmit     # typecheck (must pass)
npm run build        # production build (must pass)
npm run dev          # manual smoke test at http://localhost:3000
```

## Environments

Puddle runs in three tiers. Every change is exercised in a real, isolated
environment before it can touch production.

| Tier | Where | URL | Database | Triggered by |
|------|-------|-----|----------|--------------|
| **Development** | Your machine | `localhost:3000` | Staging Supabase | `npm run dev` |
| **Staging / Preview** | Vercel Preview | Per-PR preview URL | Staging Supabase | Any open PR |
| **Production** | Vercel Production | `solvepuddle.com` | Production Supabase | Merge to `main` |

Because we're trunk-based, "staging" isn't a long-lived server — it's the **per-PR
Vercel preview deployment**, which builds your branch against the staging database.

- **Vercel** already separates Production (the `main` branch) from Preview (every
  other branch) from Development (local). Scope environment variables per target in
  **Vercel → Settings → Environment Variables**; the same variable name gets a
  different value per environment.
- **Supabase** uses two separate projects — `puddle` (production) and
  `puddle-staging` (staging). The Free plan allows two active projects, so staging
  is free (free projects pause after ~7 days idle; resume from the dashboard).
- **Discord** OAuth and Activities need pre-registered redirect URIs, which
  ephemeral preview URLs don't have — so verify Discord-specific flows against a
  stable staging URL or in production right after release. Non-Discord changes
  verify normally on any preview.

## Database migrations

Migrations live in `app/supabase/migrations/00X_*.sql` and are **applied by hand in
the Supabase SQL editor**, not via the CLI (the remote migration history is empty,
so `db push` is unsafe).

**The rule that prevents outages:** code that depends on a new column or table must
not reach production before its migration has been applied to the production
database. In practice, the order is always **staging → verify → production**:

1. Open a PR that includes the new `app/supabase/migrations/00X_*.sql`.
2. Apply it to **staging**; confirm the PR preview works against it.
3. Apply it to **production** *before* the dependent code serves traffic, then
   merge.

This sequence is exactly what prevents the "column does not exist" class of outage.

## Adding puzzles

Puzzles are JSON files in the repo-root `puzzles/` directory (one per issue;
`template.json` shows the shape). They are the source of truth — the database is
synced *from* them, never edited directly.

To add or change a puzzle, commit the JSON on a branch and merge as usual. The
files reach the database two ways:

- **Automatically:** a daily Vercel cron (`/api/cron/sync-puzzles`) pulls
  `puzzles/*.json` from `main` and upserts them (and soft-deletes any issue no
  longer present). Since puzzles are scheduled by `date_active` ahead of time, the
  daily cadence is plenty.
- **Immediately:** run `cd app && npm run sync-puzzles` locally (add `-- --dry-run`
  to preview), or hit the cron route with the `CRON_SECRET` bearer token.

The sync validates every file first and refuses to touch the database if any is
malformed, so a bad puzzle can't go live.

## Releases

Puddle ships continuously — every squash-merge to `main` deploys to production. A
**release** draws a versioned line under a batch of merges, using
[Semantic Versioning](https://semver.org) (`vMAJOR.MINOR.PATCH`).

To cut a release:

1. Make sure `main` is green (CI passing) and the production deploy is healthy.
2. Bump `"version"` in `app/package.json` on a `chore/release-x.y.z` branch; PR and
   merge.
3. Tag the merge commit and push:
   ```bash
   git switch main && git pull
   git tag -a v1.5.0 -m "v1.5.0"
   git push origin v1.5.0
   ```
4. **Create a [GitHub Release](https://github.com/rakdcolon/puddle/releases)** from
   the tag and write the user-facing notes there — grouped by Added / Changed /
   Fixed / Removed, leading with what the user notices. Publishing also auto-posts
   the notes to the Discord `#patch-notes` channel.

For an urgent production bug, branch `hotfix/<thing>` off `main`, fix with a `fix:`
commit, verify on the preview, squash-merge, and immediately cut a **patch**
release so the running version always maps to a tag.
