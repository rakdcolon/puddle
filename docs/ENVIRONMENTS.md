# Dev, QA and production

| Environment | Application | Database | Side effects |
|---|---|---|---|
| dev | Local Next.js, 127.0.0.1:3000 | Local Supabase, 127.0.0.1:54321, project ID puddle-dev | No cron or Discord bot writes |
| qa | Vercel Preview / stable QA alias | puddle-qa, ref mzwzcdyteyrlnrwcetxq, us-east-1 | No cron or Discord bot writes |
| prod | Existing Vercel production, solvepuddle.com | Existing puddle, ref cfluksodliqrdymhnvbc, us-east-1 | Existing publication and Discord |

`PUDDLE_ENV` is dev, qa or prod; it is separate from `NODE_ENV` (Next builds
still use NODE_ENV=production in QA). Vercel Preview infers QA and Production
infers prod. A conflicting explicit value fails. The registered database host and
port must match the environment. Test runners refuse prod, and hosted QA writes
require `PUDDLE_ALLOW_QA_TESTS=1`. Search crawlers are blocked outside prod.

## Local dev

Use `app/config/dev.env.example`, or run `npm run db:start` and `npm run db:env`
in app/. Docker Desktop with Linux containers is required for local Supabase.
The fast suites use in-process PostgreSQL and work without Docker. Do not point
normal development at shared QA. QA credentials belong in an explicitly selected
QA runner configuration such as ignored `app/.env.qa.local`.

## Hosted QA

The puddle-qa Supabase project was created in the existing puddle organization
at the explicitly approved quote of $0/month. It has the repository schema and
synthetic seed puzzles; no production user records were copied.

Configure Vercel Preview using `app/config/qa.env.example`. Production must
retain its existing database and credentials. Do not copy production Discord bot
tokens, cron secrets or OAuth secrets into Preview. Give QA separate Google /
Discord applications and redirect allowlists when testing these integrations.

Use a stable QA hostname for OAuth tests. Per-PR previews may share the QA
database, so do not run mutating QA suites concurrently. CI's disposable database
remains isolated per job.

## Production and migrations

Production is the existing project, not a clone of QA. Never restore test dumps,
run fixtures or use write-capable tests against it. Service keys stay server-only.

Historical migrations 001–007 were applied manually in production. Local stacks
can replay them. QA was initialized with a recorded baseline of those migrations;
its history also differs from legacy production. **Do not run remote db push on
either project until histories are deliberately reconciled.** New schema changes
have versioned SQL files and are reviewed/applied QA first, then production as a
separate release step.

`20260922041843_harden_admin_role_guard.sql` closes the historical INSERT path
to admin escalation and pins the trigger search path. It is applied to QA;
production application is a release task, not part of local tests.

## Hosting and release boundary

Current setup status: the local Docker/Supabase stack and hosted QA database are
verified with database and desktop/mobile browser tests. Docker Desktop is
installed per-user on this PC. Both local credential files are ignored by Git.
Vercel now has separate Production and Preview service-role credentials, and
production bot/OAuth/session/cron/webhook secrets have been restricted to Production.
The three legacy public variables (Supabase URL, anon key and app URL) have been
recreated as Config entries with separate Production and Preview scopes. Production
uses the existing database and https://solvepuddle.com. Preview uses puddle-qa and
`NEXT_PUBLIC_APP_URL=/`; the updated sign-out route resolves this against the
current request hostname. Deploy this code with those Preview settings.
Existing deployments retain their settings until redeployed.
GitHub CI has passed on PR #51, including the disposable full-stack job. The
hosted Vercel Preview has passed all six desktop/mobile browser checks against QA.
Main requires the GitHub Actions `quality-gate` check and an up-to-date PR,
including for administrators; force pushes and branch deletion are blocked.
PRs are required without a second-person review count, so the sole maintainer
can approve releases without requiring another collaborator.

Production and Preview must build separately with their own public environment
values. Never promote a QA-built bundle to prod while it embeds QA credentials.
CI checks do not automatically protect Vercel's production auto-deploy: configure
required GitHub checks and PR review before treating main as a protected release
boundary. For explicit release approval, use a reviewed production deployment
workflow and disable its corresponding Git auto-deploy.

See [TESTING.md](TESTING.md) for commands, CI gates and rollback procedure.
