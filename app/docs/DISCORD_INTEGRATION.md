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
