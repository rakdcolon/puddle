#!/usr/bin/env node
/**
 * Register Puddle's Discord slash commands with the application.
 *
 * Usage (from app/):
 *   node scripts/register-commands.mjs            # register globally (~1h to propagate)
 *   DISCORD_GUILD_ID=... node scripts/register-commands.mjs   # one guild, instant
 *   npm run register-commands
 *
 * Set DISCORD_GUILD_ID to your test server's ID while iterating — guild
 * commands appear immediately; global commands can take up to an hour.
 *
 * Reads DISCORD_BOT_TOKEN + NEXT_PUBLIC_DISCORD_CLIENT_ID from .env.local.
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
const appId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
const guildId = process.env.DISCORD_GUILD_ID

if (!token || !appId) {
  console.error('Missing DISCORD_BOT_TOKEN or NEXT_PUBLIC_DISCORD_CLIENT_ID')
  process.exit(1)
}

// ─── Command definitions (option type 6 = USER) ───────────────────────────────
const commands = [
  {
    name: 'stats',
    description: "Show a player's puddle stats — level, streak, and solve record",
    type: 1,
    options: [
      {
        name: 'user',
        description: 'Whose stats to show (defaults to you)',
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: 'leaderboard',
    description: 'This week’s top solvers',
    type: 1,
  },
  {
    name: 'today',
    description: "Today's puzzle — title, genre, and a link to play",
    type: 1,
  },
]

const base = `https://discord.com/api/v10/applications/${appId}`
const endpoint = guildId ? `${base}/guilds/${guildId}/commands` : `${base}/commands`

const res = await fetch(endpoint, {
  method: 'PUT',
  headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(commands),
})

if (!res.ok) {
  console.error(`Registration failed (${res.status}):`, await res.text())
  process.exit(1)
}

console.log(
  `Registered ${commands.length} command(s) ${guildId ? `to guild ${guildId}` : 'globally'}.`,
)
