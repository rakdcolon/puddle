# Changelog

All notable changes to Puddle are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR** — incompatible or user-visible breaking changes.
- **MINOR** — new functionality, backwards compatible. Most releases.
- **PATCH** — backwards-compatible bug fixes. Hotfixes bump patch.

Keep an `## [Unreleased]` section at the top and add entries under it as PRs
merge. At release time it is renamed to the new version with a date. See
[docs/RELEASING.md](docs/RELEASING.md).

## [Unreleased]

_Nothing yet._

## [1.0.1] - 2026-05-30

### Fixed
- Signing in through the Discord Activity now works end to end. Previously the
  Activity recognized you in the masthead but not elsewhere, so opening Profile
  or Settings bounced you to a sign-in screen, that screen could white-screen,
  and your solve history, hints, and solutions didn't load. The Activity's
  Discord session is now honored across the whole app, and the sign-in/sign-out
  controls that can't work inside Discord are hidden.
- The browser-tab icon now shows the Puddle mark instead of the placeholder
  framework default.

## [1.0.0] - 2026-05-30

Baseline of the production application at `solvepuddle.com`.

### Added
- Daily puzzle across six genres (logic, deduction, quant, sequences, lateral,
  wordplay) with streaks, XP/levels, and a profile calendar heatmap.
- Google sign-in via Supabase Auth, with per-account solve history.
- Anonymous solve tracking (distinct-browser counts) folded into public puzzle stats.
- Post-solve share card with logo squares and a streak line.
- Discord integration: web Discord login with account merge by verified email,
  Discord Activity (embedded app) authentication, and rich presence.
- Terms of Service and Privacy Policy pages.
- Production development workflow: trunk-based branching, pull requests, three
  environments, and SemVer releases ([CONTRIBUTING.md](CONTRIBUTING.md),
  [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md), [docs/RELEASING.md](docs/RELEASING.md)).
- GitHub Actions CI: typecheck + build on every pull request.
- `app/.env.local.example` documenting required environment variables.

### Fixed
- Masthead dateline showed "Vol. I · No. 1" on pages other than the puzzle
  view; it now reflects the current issue.
- Recognize users whose Discord login was linked onto an existing Google
  account (matched by verified email), so the nav and profile work after
  signing in with Discord.

[Unreleased]: https://github.com/rakdcolon/puddle/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/rakdcolon/puddle/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/rakdcolon/puddle/releases/tag/v1.0.0
