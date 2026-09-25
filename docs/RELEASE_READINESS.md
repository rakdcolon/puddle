# Production release review

Candidate: [PR #51](https://github.com/rakdcolon/puddle/pull/51).
QA branch: [Preview](https://puddle-git-feat-local-puzzle-agent-rohan-karamel-s-projects.vercel.app).
The preview requires Vercel authorization. Production remains on its existing release.

## Verified

- Local Supabase on Docker, historical migrations and the new security migration.
- Hosted `puddle-qa` is separate from production; no production user data copied.
- Separate Vercel Production/Preview public and server database credentials.
- Unit/component/API/Postgres tests, local and QA live database checks, hosted
  desktop/mobile solve persistence, route authorization and accessibility checks.
- GitHub CI full-stack run and its required `quality-gate` passed.
- Main protection requires a PR, current checks and resolved conversations;
  applies to admins, with force pushes/deletion disabled.
- Publisher policy tests cover review/credential requirements, fixed paths,
  remote collisions, branch races and safe retry. No live puzzle was published.

## Approval boundary

Merging main automatically deploys production. Keep the PR unmerged until the
owner approves the release. Build production independently with production
variables; never promote the QA bundle (its public database URL is compiled in).

Before merge, review and apply only
`app/supabase/migrations/20260922041843_harden_admin_role_guard.sql` to the existing
production project `cfluksodliqrdymhnvbc`. It changes the admin-role trigger to
reject INSERT escalation and pins its search path. It has passed real PostgreSQL
tests and is applied on QA. Confirm the existing trigger/function definitions
and record the migration in the production migration history. Do not use remote
`supabase db push`: historical migration histories differ.

After approval: apply the migration, merge the passing reviewed commit, wait for
the production build, and run read-only smoke against https://solvepuddle.com
with `SMOKE_ENV=prod`. Confirm `/api/health` identifies prod and puzzle responses
contain no answer. Use the previous production deployment for application
rollback; retain the security fix and use reviewed forward fixes for the database.

## Remaining integrations

Google/Discord login in QA requires separate provider credentials and callback
allowlists. Anonymous puzzle flows are verified; provider sign-in is not.
The publisher is tested but not provisioned with a persistent write credential.
Curator/publisher daily scheduling is disabled. Human approval remains required
for publication; review adaptation rights, attribution and the mathematical answer.
