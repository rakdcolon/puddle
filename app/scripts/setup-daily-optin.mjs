#!/usr/bin/env node
/**
 * Post (and pin) the one-time "Daily Puddle reminders" opt-in message.
 *
 * Members tap its button to add the self-assignable reminder role; the daily
 * auto-post (/api/cron/daily-post) @-mentions that role. No role = no ping, so
 * reminders are strictly opt-in. Run this once per server.
 *
 * Usage (from app/):
 *   node scripts/setup-daily-optin.mjs
 *   npm run setup-daily-optin
 *
 * Reads DISCORD_BOT_TOKEN + DISCORD_ANNOUNCE_CHANNEL_ID from .env.local.
 * The button's custom_id (toggle-daily-ping) must match DAILY_PING_BUTTON in
 * src/app/api/discord/interactions/route.ts.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// ─── Load .env.local ──────────────────────────────────────────────────────────
try {
  const content = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // rely on env vars already set in shell / CI
}

const token = process.env.DISCORD_BOT_TOKEN
const channelId = process.env.DISCORD_ANNOUNCE_CHANNEL_ID

if (!token || !channelId) {
  console.error('Missing DISCORD_BOT_TOKEN or DISCORD_ANNOUNCE_CHANNEL_ID')
  process.exit(1)
}

const PUDDLE_ACCENT = 0xb85a3e
const API = 'https://discord.com/api/v10'
const headers = { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' }

const message = {
  embeds: [
    {
      title: 'Daily puddle reminders',
      description:
        "Want a nudge when each day's puzzle goes live? Tap the button to get the **Daily Puddle** role and I'll ping you in this channel every morning. Tap again any time to stop — it's entirely opt-in.",
      color: PUDDLE_ACCENT,
      footer: { text: 'solvepuddle.com' },
    },
  ],
  components: [
    {
      type: 1, // action row
      components: [
        {
          type: 2, // button
          style: 1, // primary
          label: 'Notify me each morning',
          custom_id: 'toggle-daily-ping',
          emoji: { name: '🔔' },
        },
      ],
    },
  ],
}

const res = await fetch(`${API}/channels/${channelId}/messages`, {
  method: 'POST',
  headers,
  body: JSON.stringify(message),
})

if (!res.ok) {
  console.error(`Failed to post opt-in message (${res.status}):`, await res.text())
  process.exit(1)
}

const posted = await res.json()
console.log(`Posted opt-in message ${posted.id} to channel ${channelId}.`)

// Pin it so it stays discoverable. Non-fatal if the bot lacks Manage Messages.
const pin = await fetch(`${API}/channels/${channelId}/pins/${posted.id}`, {
  method: 'PUT',
  headers,
})
if (pin.ok) {
  console.log('Pinned it.')
} else {
  console.warn(`Could not pin (${pin.status}) — pin it manually if you want it stuck to the top.`)
}
