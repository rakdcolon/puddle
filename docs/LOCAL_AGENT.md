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
Production publication and unattended scheduling have not been enabled.

For unattended publication, add a separate publisher with repository-scoped
credentials and an enforced path/operation policy (new puzzle and provenance files
only, no deletion or workflow changes). It should validate against the latest
remote archive, reserve issue/date atomically, report sync results and verify the
live issue. Keep those credentials outside the model runtime. Decide explicitly
whether review is required before enabling that publisher or a Windows scheduled
task. Do not give the curator a service-role key or generic Git/shell access.

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
