// Thin wrappers over Discord's REST API authenticated as the bot. Used by the
// daily auto-post (post a message to a channel) and the opt-in button (grant or
// revoke the self-assignable reminder role). No gateway connection required —
// these are plain HTTPS calls, same as the slash-command handlers.

const API = 'https://discord.com/api/v10'

function botHeaders(): Record<string, string> {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) throw new Error('DISCORD_BOT_TOKEN is not set')
  return { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' }
}

async function ensureOk(res: Response, what: string) {
  if (!res.ok) {
    throw new Error(`Discord ${what} failed (${res.status}): ${await res.text()}`)
  }
}

export async function postChannelMessage(channelId: string, payload: unknown) {
  const res = await fetch(`${API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: botHeaders(),
    body: JSON.stringify(payload),
  })
  await ensureOk(res, 'postChannelMessage')
  return res.json()
}

// Grant/revoke a role on a guild member. The bot needs the Manage Roles
// permission and must sit ABOVE the target role in the guild's role hierarchy.
export async function addMemberRole(guildId: string, userId: string, roleId: string) {
  const res = await fetch(`${API}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: 'PUT',
    headers: botHeaders(),
  })
  await ensureOk(res, 'addMemberRole')
}

export async function removeMemberRole(guildId: string, userId: string, roleId: string) {
  const res = await fetch(`${API}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: 'DELETE',
    headers: botHeaders(),
  })
  await ensureOk(res, 'removeMemberRole')
}
