# Releasing

Puddle ships continuously — every squash-merge to `main` deploys to production.
A **release** is the act of drawing a versioned line under a batch of those
merges: tagging it, naming it, and publishing notes. Most releases bundle
several changes; a hotfix may contain just one.

We use [Semantic Versioning](https://semver.org): `vMAJOR.MINOR.PATCH`.

## Versioning rules

| Bump | When |
|------|------|
| **MAJOR** | A breaking or significant user-visible change. |
| **MINOR** | New features, backwards compatible. The common case. |
| **PATCH** | Bug fixes only. Hotfixes are always patches. |

The current production baseline is **1.0.0**.

## Cutting a release

1. Make sure `main` is green (CI passing) and the production deploy is healthy.
2. In [CHANGELOG.md](../CHANGELOG.md), rename `## [Unreleased]` to the new
   version with today's date, e.g. `## [1.1.0] - 2026-06-14`, and start a fresh
   empty `## [Unreleased]` above it. Update the compare/links at the bottom.
3. Bump `"version"` in `app/package.json` to match.
4. Commit on a `chore/release-x.y.z` branch, PR, and merge.
5. Tag the merge commit and push the tag:
   ```bash
   git switch main && git pull
   git tag -a v1.1.0 -m "v1.1.0"
   git push origin v1.1.0
   ```
6. **Create a GitHub Release** from the tag, pasting that version's changelog
   section as the notes. This is the user-facing patch note. Publishing it
   also auto-posts the notes to Discord `#patch-notes` (see the patch-notes
   webhook in [app/docs/DISCORD_INTEGRATION.md](../app/docs/DISCORD_INTEGRATION.md)) —
   no manual copy needed.

## Writing the notes

Write for a reader, not a commit log. Group by **Added / Changed / Fixed /
Removed**, lead with what the user notices, and keep each line one idea. The
Conventional Commit prefixes on merged PRs (`feat:`, `fix:`) tell you which
heading each belongs under.

## Hotfixes

For an urgent production bug:

1. Branch `hotfix/<thing>` off `main`.
2. Fix, with a `fix:` commit. Add a `Fixed` line to `[Unreleased]`.
3. PR, get CI green, verify on the preview, squash-merge (auto-deploys).
4. Immediately cut a **patch** release (e.g. `1.1.0` → `1.1.1`) following the
   steps above, so the running version always maps to a tag.

A hotfix release legitimately contains a single change — that's the one time a
release isn't a bundle.
