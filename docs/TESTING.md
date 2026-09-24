# Testing and release quality

The pyramid has many fast domain checks, fewer component/API/database checks, and
a small set of real browser journeys. Production has a separate read-only smoke.

| Layer | Command (from app/) | What it proves |
|---|---|---|
| Static | `npm run typecheck` | Type contracts and Next route signatures |
| Unit | `npm run test:unit` | XP boundaries, NY/DST dates, signatures, archive validation, environment isolation |
| Component | `npm run test:component` | Answer submission, progressive hints, retry after server failure |
| Integration | `npm run test:integration` | API orchestration, sync failure behavior, PostgreSQL migrations/RLS/constraints using PGlite |
| Live database | `npm run test:live` | Actual Supabase/PostgREST upserts and row access with anon/service roles |
| End-to-end | `npm run test:e2e` | Browser → Next app → Supabase → persisted solve, on desktop and mobile |
| Accessibility | Included in E2E | Serious/critical WCAG findings and horizontal overflow |
| Agent | `npm run test:agent` | Local SQLite validation, duplicate and source request protections |
| Release smoke | `npm run test:smoke` | Read-only page, readiness, environment identity and public API contract |

## Fast feedback

Use Node 22 (`.node-version`), then `npm ci` in `app/`. `npm test` runs fast suites
without cloud credentials or Docker. `npm run test:coverage` enforces floors on
selected domain modules; this is **not** a whole-application coverage percentage.

API integration tests mock external service boundaries; PGlite runs actual
PostgreSQL SQL but models `auth.jwt()`. Neither replaces the live-database and
browser suites, which use Supabase itself.

## Full local stack

Install Docker Desktop, enable Linux containers, and start it. Then:

```powershell
cd app
npm ci
npm run db:start
npm run db:env
npm run test:live
npm run build
npx playwright install chromium
npm run test:e2e
npm run db:stop
```

`db:env` writes `.env.local` once, refuses to overwrite it, and never prints keys.
The browser runner starts a production build on loopback port 3100; it does not
reuse an unrelated server. Every browser test verifies `/api/health` reports the
expected environment before writing. Tests use unique solve IDs and clean up only
their own rows. Run mutating suites serially against shared QA.

For QA, populate ignored `.env.qa.local` from `config/qa.env.example`, then:

```powershell
node scripts/with-env.mjs qa node_modules/vitest/vitest.mjs run --config vitest.live.config.mts
node scripts/with-env.mjs qa node_modules/next/dist/bin/next build
node scripts/with-env.mjs qa node_modules/@playwright/test/cli.js test
```

Set `E2E_BASE_URL` only to a QA deployment when testing an already-deployed app.
The service key stays in the runner's Node process, never in browser context.
Never promote a QA-built bundle to production: `NEXT_PUBLIC_*` values are compiled
into it. Build production using production variables.

## CI and release controls

`CI / quality-gate` joins fast tests/coverage/audit and a disposable Supabase stack
with a production build and browser tests. No cloud secrets are needed on PRs.
Artifacts include coverage and failure traces, not `.env`. Configure the GitHub
main ruleset to require this check and PR review, blocking direct/force pushes.
The workflow alone cannot enforce a ruleset.

Create GitHub environments `qa` and `prod`, set `APP_URL`, and require a reviewer
for prod. The manual smoke workflow needs no database credentials.

OAuth and embedded Discord Activity still require manual QA with separate provider
applications and a stable callback URL. Load/stress tests, visual pixel baselines
and full external-provider contracts remain future extensions. No production
write or load tests are configured.

## Release checklist

1. Pass CI and deploy the candidate to QA.
2. Apply forward-compatible migrations to QA and validate there.
3. Apply reviewed production migrations before deploying dependent code. Do not
   use remote `supabase db push` until historical migrations are reconciled.
4. Build/deploy the same reviewed commit with production environment values.
5. Run read-only production smoke. Roll back the application on regression; use
   forward database fixes rather than automatic destructive down migrations.

This establishes every pyramid layer and covers the core puzzle journey. It does
not mean every existing feature has exhaustive coverage. Add regressions when
changing auth, admin, submissions, settings or Discord.
