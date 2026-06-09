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

### Added
- **Volume II: The Mire.** Fourteen new puzzles sharing a single swamp world
  and a recurring cast, each a beautiful classic re-skinned into the mire. Runs
  daily from June 28 to July 11 (Vol. II, No. 26 to 39). Release notes:
  [docs/volumes/volume-2-the-mire.md](docs/volumes/volume-2-the-mire.md).

## [1.3.0] - 2026-06-08

A polish-and-reach release: the day's puzzle now goes out to Discord on its
own, the site is far more legible to search engines and social cards, and
there are new accessibility controls.

### Added
- **Daily puzzle in Discord.** Each morning the bot posts the day's puzzle —
  prompt, genre, and a play link — to the community server automatically.
  Members can opt in to a gentle morning ping by tapping a button (the
  "puddler" role); it's off by default and one more tap turns it back off.
- **Accessibility settings.** New Settings → Accessibility controls: high
  contrast, cleaner text, and reduce motion. Each is per-device and applies
  instantly.
- **Search-engine & social metadata.** Real page titles and descriptions,
  Open Graph / Twitter cards for nicer link previews, a robots file, a sitemap,
  and JSON-LD — so Puddle shows up properly when shared or searched.

### Fixed
- The browser-tab icon now reliably shows the Puddle mark, and the site's
  shared/social metadata reads cleanly.

## [1.2.0] - 2026-06-04

### Changed
- Admin access is now gated by an `is_admin` database column instead of an
  email set in an environment variable — cleaner to grant and revoke.

### Fixed
- Hardened error handling across the auth, puzzle, and settings flows, so
  transient failures surface gracefully instead of breaking the page.

## [1.1.0] - 2026-05-31

A feature release: dark mode, a Discord bot, a read-only way to revisit puzzles,
and a deliberate move away from timing pressure.

### Added
- **Dark mode.** A warm, lamplit dark theme that keeps Puddle's editorial feel.
  Choose **Automatic** (follows your device), **Light**, or **Dark** under
  Settings → Appearance. Applies instantly with no flash; Automatic tracks your
  OS in real time.
- **Discord bot.** Slash commands in the community server: `/stats` (a player's
  level, streak, and solve record), `/leaderboard` (this week's top solvers),
  and `/today` (the current puzzle with a link to play). Runs as a lightweight
  HTTP-interactions endpoint.
- **Revisit a puzzle.** After solving or giving up you can reopen a puzzle —
  prompt and answer choices, read-only — from a new "View the puzzle" link on
  the home cards and the solution page.
- The landing page now shows **how many people have solved today's puzzle**.

### Changed
- **Timing is gone from the interface.** No in-puzzle timer, post-solve times,
  fastest/average-time stats, or times in shared results. Solve duration is
  still recorded, just never shown — Puddle isn't a race.
- **XP no longer rewards speed.** Every solve earns the same base, adjusted only
  by hints and wrong attempts.

### Fixed
- A day with no scheduled puzzle no longer takes the whole site down — the most
  recent issue stays live until the next one is published.

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

[Unreleased]: https://github.com/rakdcolon/puddle/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/rakdcolon/puddle/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/rakdcolon/puddle/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/rakdcolon/puddle/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/rakdcolon/puddle/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/rakdcolon/puddle/releases/tag/v1.0.0
