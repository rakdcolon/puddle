# Puddle editorial rules

The puzzle should be the hard part, not its wording. Use familiar words, short
sentences and explicit rules. Remove decorative backstory and needless characters.
Water imagery is optional and subtle; do not force frogs, swamps, ponds or animal
substitutions into an otherwise clear problem. Historical puzzles are examples of
the data format, not a style guide for new writing.

Adapt the source in original language. Keep the essential logic intact, or explain
which rules changed and solve the revised problem independently. Record the source,
author, license and changes; visible attribution belongs in the published solution.
Do not claim to have inspected an image that the source adapter cannot read.
Hints should progressively reveal the method without stating the final answer.

## Calendar editions

Use the publication date in America/New_York. `vol` is the year's last two digits;
`issue_no` is the day of year. Display Arabic numerals: **Vol. 26 · No. 271** for
2026-09-28. January 1 is No. 1, and December 31 is No. 365 or No. 366 in a leap year.
Missing publication days leave gaps; do not compress numbering to count published
puzzles. Historical puzzles use their original publication dates under this rule.

The curator derives these labels when saving, and the admin form derives them
from its date field. Full publication dates identify files, drafts and sync rows;
day numbers alone are not unique across years. Existing archive filenames stay
unchanged to preserve references; their metadata has been renumbered. New agent
files use `YYYY-MM-DD-agent.json` with `provenance/YYYY-MM-DD.json`.

## Calendar migration rollout

The `calendar_editions` migration drops global issue-number uniqueness, relabels
existing rows in place and enforces agreement between date, year and day number.
Puzzle UUIDs, solve records and source text remain unchanged. Sync/import now use
the existing unique publication date, and soft deletion targets UUIDs.

Apply the migration before the new sync code runs. Coordinate migration and merge
away from the 05:00 UTC archive sync: old sync code requires the removed issue-only
constraint, while new code requires the updated calendar metadata. During this
short transition reads remain available, but old sync/import writes will fail.
Do not merge new-format puzzle PRs before this release. A code-only rollback is
insufficient after the constraint change; use a forward fix or a reviewed database
rollback together with the corresponding code and archive version.
