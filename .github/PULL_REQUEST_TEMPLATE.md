<!--
  Keep the PR title a clean Conventional Commit (e.g. "feat: add streak freeze").
  We squash-merge, so the title becomes the commit on main.
-->

## Summary

<!-- What does this change and why? -->

## Type of change

- [ ] `feat` — new functionality
- [ ] `fix` — bug fix
- [ ] `chore` — tooling, deps, config
- [ ] `docs` — documentation only
- [ ] `refactor` — internal change, no behavior change

## Screenshots / preview

<!-- For UI changes, add before/after screenshots or a preview link. -->

## Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] Verified on the Vercel preview deployment
- [ ] If this adds a DB migration: it's in `app/supabase/migrations/`, applied to **staging**, and queued for **production** before this serves traffic
- [ ] No secrets, credentials, or `.env` values committed
