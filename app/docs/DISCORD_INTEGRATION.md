# Discord integration

Two surfaces, two auth paths, one canonical account.

| Surface | Where | Auth mechanism |
| --- | --- | --- |
| **Website login** | `solvepuddle.com` in a browser | Supabase Discord provider (OAuth redirect) → Supabase session cookie |
| **Activity** | Embedded iframe inside Discord | Embedded App SDK `authorize()` → `/api/discord/token` → signed `puddle.activity` cookie |

Both resolve to the same `users` row via `getOrCreateUserFromIdentity`, so a person's
solves, streak, and XP follow them across Google, Discord-web, and Discord-activity.

## Account model & merging

The canonical identity is the app's `users` row, not the Supabase auth user. A single
row can hold both `google_sub` and `discord_sub`. When an identity signs in:

1. **Match `discord_sub`/`google_sub`** → that user.
2. **Else match by `email`, but only if the email is verified** → attach the new
   provider's sub to that row (the merge). Verification is mandatory: an unverified
   provider email must never inherit an existing account.
3. **Else** create a new row.

Implemented in `src/lib/db/users.ts` (`getOrCreateUserFromIdentity`). Migration:
`supabase/migrations/006_discord_identity.sql` (adds `discord_sub`, relaxes
`google_sub` NOT NULL, indexes `email`, widens the RLS policies).

## Environment variables

See `.env.local.example`. New keys:

- `NEXT_PUBLIC_DISCORD_CLIENT_ID` — Discord application (client) ID.
- `DISCORD_CLIENT_SECRET` — OAuth2 client secret (server only).
- `DISCORD_ACTIVITY_SESSION_SECRET` — HMAC key for the activity cookie (`openssl rand -base64 32`).

## One-time setup (outside the code)

### A. Supabase — website Discord login
1. Dashboard → **Authentication → Providers → Discord** → enable.
2. Paste the Discord app's Client ID + Secret.
3. Add the Supabase callback URL (shown there) to the Discord app's **OAuth2 → Redirects**.
4. Optionally enable "link accounts with the same email" — harmless; our app-level merge
   is the real linking layer.

### B. Discord Developer Portal — the Activity
1. https://discord.com/developers/applications → your app.
2. **OAuth2**: add redirect `https://127.0.0.1` (placeholder the SDK requires); copy
   Client ID/Secret into env.
3. **Activities → Settings**: enable Activities.
4. **Activities → URL Mappings**, add:
   - `/` → your deployment host (e.g. `solvepuddle.com`)
   - `/supabase` → `<your-ref>.supabase.co`  ← required; `patchSupabaseForActivity()`
     rewrites supabase-js calls to this prefix so the sandbox CSP doesn't block them.
5. Run it from a Discord voice channel's Activity launcher (App Directory) once approved,
   or via the developer "Launch Activity" flow.

## Daily auto-post & opt-in reminders

Each morning a [Vercel Cron](https://vercel.com/docs/cron-jobs) (`vercel.json`,
`0 13 * * *` UTC ≈ 8–9am ET) hits `/api/cron/daily-post`. The route posts the
day's puzzle card to a channel as the bot and `@`-mentions a **self-assignable
reminder role**, so only members who asked get pinged — reminders are strictly
opt-in (no role = no ping). The card is identical to the `/today` command; both
render `dailyPuzzleEmbed()` from `src/lib/discord/embeds.ts`.

Members opt in/out by tapping a button on a pinned message (posted once with
`npm run setup-daily-optin`). The button is a `MESSAGE_COMPONENT` interaction
handled in `src/app/api/discord/interactions/route.ts` (`toggle-daily-ping`),
which grants or revokes the role via `addMemberRole`/`removeMemberRole` in
`src/lib/discord/rest.ts` and replies privately (ephemeral).

### One-time setup

1. **Create the reminder role** (e.g. "Daily Puddle") in the server. No
   permissions needed — it's just a ping target.
2. **Bot permissions**: give the bot **Manage Roles**, and in
   Server Settings → Roles drag the **bot's** role *above* the reminder role
   (a bot can only assign roles beneath its own). To pin the opt-in message it
   also needs **Manage Messages** in that channel.
3. **Env** (local `.env.local` *and* Vercel project):
   `DISCORD_ANNOUNCE_CHANNEL_ID`, `DISCORD_DAILY_ROLE_ID`, and `CRON_SECRET`
   (any random string; Vercel sends it as the cron's bearer token — set the
   same value in Vercel so the route accepts the call).
4. From `app/`, run `npm run setup-daily-optin` once to post + pin the opt-in
   button. The cron starts posting on the next deploy with `vercel.json`.

> **Note:** `vercel.json` must sit at the Vercel project's **root directory**.
> If the project root is `app/` (where `package.json` lives), it belongs there.
> The Hobby plan runs crons once daily and may fire up to ~1h late — fine for a
> morning post.

## Patch notes auto-post

When a **GitHub Release** is published, GitHub fires a `release` webhook at
`/api/github/release`. The route verifies the HMAC signature
(`X-Hub-Signature-256` vs `GITHUB_WEBHOOK_SECRET`,
`src/lib/github/webhook.ts`), and on `action: "published"` (skipping drafts and
prereleases) posts the release notes as an embed to `#patch-notes` via the bot.
No more hand-copying changelog entries into the channel.

This uses a **repo webhook**, not a GitHub Action — so it needs no workflow
file (our token can't push `.github/workflows/*`).

### One-time setup

1. **GitHub** → repo **Settings → Webhooks → Add webhook**:
   - Payload URL: `https://solvepuddle.com/api/github/release`
   - Content type: `application/json`
   - Secret: a random string (`openssl rand -hex 32`)
   - "Which events?" → **Let me select** → **Releases** only.
2. **Env** (local + Vercel): `GITHUB_WEBHOOK_SECRET` (same as the webhook
   secret) and `DISCORD_PATCHNOTES_CHANNEL_ID`.
3. **Bot perms** in `#patch-notes`: View Channel, Send Messages, Embed Links.

After that, the GitHub Release step in [RELEASING.md](../../docs/RELEASING.md)
is all it takes — the notes land in Discord on their own.

## How the pieces connect (code)

- `src/lib/discord/sdk.ts` — `isInDiscordActivity()`, lazy SDK init, `patchSupabaseForActivity()`,
  and `authenticateDiscordActivity()` (authorize → token exchange → SDK authenticate).
- `src/components/discord/DiscordActivityProvider.tsx` — wraps the app in `layout.tsx`; runs
  the handshake before revealing UI when inside Discord, no-ops otherwise.
- `src/app/api/discord/token/route.ts` — exchanges the code, fetches the Discord user,
  merges the account, sets the `SameSite=None; Partitioned; Secure` activity cookie.
- `src/lib/auth/session.ts` — HMAC sign/verify for that cookie.
- `src/lib/auth/current-user.ts` — `getCurrentUser()` accepts either auth surface; use it in
  route handlers instead of `supabase.auth.getUser()`. Already wired into the submit route.

## Still TODO (not in this scaffold)

- Sign-out for the activity session (clear `puddle.activity`); website sign-out already exists.
- `/api/auth/signout` and the masthead account UI assume a Supabase session — make them
  branch on `getCurrentUser()` / the activity context.
- Discord rich presence / `setActivity` (show "Solving puddle No. 42" in the member list).
- Decide whether `/admin` (currently gated on `ADMIN_EMAIL` Google) should ever be reachable
  in the activity — almost certainly not; leave it website-only.
- Local activity testing needs an HTTPS tunnel (cloudflared/ngrok) pointed at `next dev`,
  with the tunnel host set as the `/` URL mapping.
