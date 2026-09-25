# Local Puddle curator

This checkout includes a first-stage, review-only curator for the installed Windows
Pi + Ollama setup. Run its launcher in a Herdr terminal pane; Herdr remains the
terminal/session manager. No global Pi or Herdr settings are changed.

## Run

Requires PowerShell 7, Node 22.13+ (built-in SQLite), the managed Pi installation,
and Ollama serving `qwen3.8:27b` on `127.0.0.1:11434`. No npm installation is needed
for the automation folder. The installed Pi runtime supplies its extension imports.

```powershell
cd C:\Users\rohan\Documents\puddle
pwsh -File automation/start.ps1
# Or one assignment, then exit:
pwsh -File automation/start.ps1 -Once
```

One-shot runs stop the launched process tree after five minutes by default; use
`-MaxSeconds 600` to allow ten minutes. Inspect the queue after a timeout before
retrying, since a save may have succeeded before the model's final response.

The profile uses a 32K context budget and an 8K response cap to start. These are Pi
budgets, not a change to Ollama's server-side context allocation. Benchmark before
increasing them. Existing global model settings are untouched.

## Model-facing tools

| Tool | Capability |
|---|---|
| `puddle_archive` | Existing issue summaries, three examples, template, pending queue |
| `puddle_search` | Search answered questions on Puzzling Stack Exchange |
| `puddle_read` | Fetch a question, answers and author/license metadata |
| `puddle_save_draft` | Validate and insert into local SQLite; no overwrite or publication |

The initial source is deliberately a structured API. General search, arbitrary
URLs, browser sessions, shell, file editing, Git, SQL, Supabase admin and deployment
tools are absent. Add future sources as reviewed adapters with fixed hosts and
bounded responses. Source text is untrusted and never interpreted as instructions.
Requests have timeouts, reject redirects, cap responses at 1 MB, cache for one hour,
respect API backoff, and have an 80-request UTC-day budget. Five search results and
five answers bound the model's reading load. Each profile invocation allows six
search attempts, four retrieval attempts and one successful draft save. These
limits, database uniqueness and a 100-draft queue limit are enforced by code.
Question bodies are capped at 8,000 characters and answers at 4,000 each, with
truncation flagged for the curator.

The launcher strips inherited service credentials, uses an isolated Pi config and
session directory, disables resource discovery, and explicitly allowlists four
tools. This is an application capability boundary, **not an OS sandbox**: the Pi
runtime and reviewed extension still run as your Windows user. A separate Windows
account/VM and firewall policy are the next boundary if protection against a
compromised runtime is required. Do not install extra extensions into this profile.

## Local database and review

`.puddle-agent/drafts.sqlite` holds fetched source snapshots, candidate puzzles,
review notes, cache and rate-limit state. The directory is ignored by Git. Back it
up if you want to retain rejected candidates and session history.

```powershell
node automation/operator.mjs list
node automation/operator.mjs show <draft-id>
node automation/operator.mjs export <draft-id> --reviewed
```

`export` is an operator command, not an agent tool. It revalidates and writes one
new puzzle JSON plus a provenance sidecar in `puzzles/provenance/`. It never pushes,
updates an existing issue, or contacts Supabase. Before exporting, review factual
correctness, uniqueness, difficulty, solution/answer compatibility, attribution,
reuse terms and the proposed date. The model's claimed solution check is not proof.
The existing template has no dedicated source fields, so visible credit belongs in
`solution_lede`; provenance sidecars alone are not reader-visible attribution.

## Existing live publishing path

`local draft DB -> operator review/export -> puzzle JSON PR -> merge to main ->
existing sync cron -> existing Supabase puzzles table -> live page by date_active`

The repository already configures `/api/cron/sync-puzzles` at `0 5 * * *` UTC. It
reads `puzzles/*.json` from `main`. The home page is dynamic and queries Supabase
for the latest active puzzle using the New York date, so daily content does not
need a separate deployment action. Schedule ahead of time to avoid a morning gap
between midnight New York and the daily sync. Merging may trigger the existing
Vercel deployment integration, but the curator does not need deployment access.

The existing sync reconciles the *whole* archive and can soft-delete missing
issues. Never sync the draft queue or a one-file directory through that script.
The curator intentionally cannot invoke it. An operator can use the existing
authenticated cron endpoint with `?dry-run=1`, review its summary, and then invoke
the sync when required. Keep `CRON_SECRET` and Supabase service credentials in the
operator/hosting environment, outside the curator profile.

## Connection status and next stage

The production target remains the **existing Puddle database**. Supabase access
now works, and a separate `puddle-qa` project has been provisioned for testing.
Its schema and sample puzzles are installed; credentials stay in ignored operator
configuration, outside the curator runtime. See [environments](ENVIRONMENTS.md).
Production publication remains review-driven. Windows scheduling can be installed
with the steps below; it runs only the draft curator.

## Review-based publisher

`publisher.mjs` is an operator command, never a curator tool. It validates the
draft's content hash, future NY date, source/review record and current GitHub main
archive. It can add exactly two files: the puzzle JSON and its provenance JSON.
It cannot update main, overwrite existing files, merge, call Supabase or deploy.

```powershell
node automation/operator.mjs show <draft-id>
node automation/publisher.mjs <draft-id>                  # read-only remote dry run
node automation/publisher.mjs <draft-id> --apply --reviewed
```

The apply command requires `PUDDLE_PUBLISHER_TOKEN` in the **operator** process.
Use a short-lived fine-grained token restricted to `rakdcolon/puddle`, Contents
and Pull requests write permissions, with no Workflows or Administration access.
Never put it in the curator's Pi configuration or a committed file. The curator
launcher strips it from the child environment. The daily task never loads this
credential or invokes the publisher.

Publishing reserves `puzzle/YYYY-MM-DD` by creating a new ref. A conflicting
date branch is never overwritten. Identical retries can recover a partially
completed run and reuse a PR; additional branch changes are rejected. Different
years can share a day-of-year number: filenames and provenance are keyed by full
publication date. Main's required, up-to-date CI checks validate dates and edition
labels before merge. Review the source attribution,
solution and issue/date again on the PR. API/schema checks do not prove correctness.

The result is a **draft PR**, not a live puzzle. After explicit approval and merge,
the existing production sync process imports the archive. Production sync and
live verification remain release/operator responsibilities. Unattended publishing
is disabled; recurring draft preparation is a separate Windows task.

## Windows daily schedule

In PowerShell 7, from the repository root:

```powershell
pwsh -NoProfile -File automation/install-schedule.ps1
```

This installs or updates `Puddle Daily Draft` at 19:00 in the PC's local timezone
(Eastern on the configured PC). To change the time, rerun with `-At '18:30'`.
It uses your signed-in Windows session, without administrator rights or a saved
Windows password. The PC must be on and you must remain signed in; locking it is
fine. Missed starts run when available. It does not wake a sleeping PC. Concurrent
scheduled instances are skipped, and there are no automatic failure retries.

The installer records absolute runtime locations in ignored
`.puddle-agent/scheduler.json`; rerun it if the checkout or runtimes move. The runner
checks Ollama and starts its local server hidden if necessary, then runs the
curator with a five-minute limit. It requests a puzzle at least three days ahead.
Logs are in `.puddle-agent/logs/`; `.puddle-agent/last-run.json` records the latest
exit status and whether the draft count increased. Logs remain local and are not
automatically pruned. A successful
process exit does not guarantee a draft was saved: inspect the queue and log.

```powershell
Get-ScheduledTaskInfo -TaskName 'Puddle Daily Draft'
Start-ScheduledTask -TaskName 'Puddle Daily Draft' # generate one draft now
Disable-ScheduledTask -TaskName 'Puddle Daily Draft' # pause future runs
Enable-ScheduledTask -TaskName 'Puddle Daily Draft' # resume
node automation/operator.mjs list
```

## Set up the publisher credential

1. Open https://github.com/settings/personal-access-tokens/new (phone or PC).
2. Name it `Puddle publisher`, choose resource owner `rakdcolon`, and set a
   30-day expiration initially.
3. Choose **Only select repositories**, then **puddle**.
4. Under repository permissions, set **Contents: Read and write** and
   **Pull requests: Read and write**. Leave other permissions at their defaults;
   Metadata read access is automatic. Do not grant Workflows or Administration.
5. Generate the token and keep it in your password manager. Do not send it in chat.
6. On this Windows PC, double-click `automation/setup-publisher.cmd` in File
   Explorer (after installing the schedule). It opens the private token prompt
   using the installed PowerShell 7. Alternatively, run in PowerShell 7:

   ```powershell
   pwsh -NoProfile -File automation/publisher-credential.ps1 -Action Set
   ```

7. Paste the token into the hidden prompt and press Enter. The script saves a
   Windows DPAPI-encrypted credential at
   `%LOCALAPPDATA%\Puddle\publisher.credential.xml`, outside the repository. This
   ties decryption to your Windows account and PC, but is not isolation from other
   programs running as your Windows user. The script never prints the token.
8. Check the saved credential with:

   ```powershell
   pwsh -NoProfile -File automation/publisher-credential.ps1 -Action Status
   ```

This status checks local storage, not GitHub permissions. Validate GitHub access
using the dry run below once a real draft exists. The first apply verifies write
access by opening its reviewed draft PR. Rotate the token by repeating Set, then
revoke the old token on GitHub. `-Action Remove` deletes only the local copy.

## Review a draft and open its PR

Run these commands from the repository root, substituting the ID from `list`:

```powershell
node automation/operator.mjs list
node automation/operator.mjs show <draft-id>
pwsh -NoProfile -File automation/publish.ps1 -DraftId <draft-id>
# Only after reviewing the puzzle, solution, date and source attribution:
pwsh -NoProfile -File automation/publish.ps1 -DraftId <draft-id> -Apply -Reviewed
```

The wrapper loads the credential only into the publisher child process. The first
publisher command is a read-only dry run; the second opens a draft PR. Review the
PR on GitHub, mark it ready, wait for required checks and merge. The production
sync runs at 05:00 UTC daily, so merge future puzzles ahead of their active date.
The token's repository permissions are broader than the script's two-file policy;
branch protection and keeping the token outside the model's tools remain essential.

References: [GitHub fine-grained tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens),
[Windows encrypted credential storage](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/export-clixml).

## Verify

```powershell
node --test automation/test/*.test.mjs
pwsh -File automation/start.ps1 -Once -Prompt 'Call puddle_archive once and report the latest issue. Do not save a draft.'
```

Tests cover malformed payloads, protected fields, duplicate issues/dates, replay,
unfetched provenance, fixed-host requests, backoff, response size and request budget.
SQLite is experimental in the installed Node 22 runtime and emits a warning.

References: [Pi extensions](https://pi.dev/docs/latest/extensions),
[Pi usage](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/usage.md),
[Stack Exchange search](https://api.stackexchange.com/docs/advanced-search).
