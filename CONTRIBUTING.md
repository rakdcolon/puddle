# Contributing to Puddle

Puddle uses a **trunk-based** workflow: `main` is always deployable and is the
single source of truth. All changes land through short-lived branches and pull
requests. Nothing is committed directly to `main`.

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
   change (see [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)).
4. **Verify on the preview URL.** Confirm the change works and nothing obvious
   broke before merging.
5. **Squash-merge into `main`.** The merge auto-deploys to production via Vercel.
6. **Update the changelog** as part of the PR (see below).

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
PR titles — they map directly onto the changelog and version bump:

- `feat: …` → **Added/Changed**, bumps **minor**
- `fix: …` → **Fixed**, bumps **patch**
- `feat!:` or a `BREAKING CHANGE:` footer → bumps **major**

We **squash-merge**, so the PR title becomes the commit on `main`. Keep it a
clean Conventional Commit.

## Local checks

Run before pushing — CI gates on the first two:

```bash
cd app
npx tsc --noEmit     # typecheck (must pass)
npm run build        # production build (must pass)
npm run dev          # manual smoke test at http://localhost:3000
```

## Changelog

Every user-facing PR adds a bullet under `## [Unreleased]` in
[CHANGELOG.md](CHANGELOG.md), under the right heading (`Added`, `Changed`,
`Fixed`, `Removed`). Internal-only changes (chore/refactor/docs) can skip it.
Entries are bundled into the next release — see [docs/RELEASING.md](docs/RELEASING.md).

## Database migrations

Migrations live in `app/supabase/migrations/00X_*.sql` and are **applied by hand
in the Supabase SQL editor**, not via the CLI (the remote migration history is
empty, so `db push` is unsafe).

**The rule that prevents outages:** code that depends on a new column/table must
not reach production before its migration has been applied to the production
database. In practice:

1. Apply the migration to the **staging** Supabase project; verify on the PR
   preview.
2. Apply it to **production** as part of the release, *before or as* the code
   that needs it merges to `main`.

See [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md) for the per-environment detail.
