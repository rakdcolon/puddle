// Thin wrappers over Discord's REST API authenticated as the bot. Used by the
// daily auto-post (post a message to a channel) and the opt-in button (grant or
// revoke the self-assignable reminder role). No gateway connection required —
// these are plain HTTPS calls, same as the slash-command handlers.

const API = 'https://discord.com/api/v10'

/**
 * Builds HTTP headers required for Discord bot-authenticated REST requests.
 *
 * @returns A header record containing `Authorization: Bot <token>` and `Content-Type: application/json`.
 * @throws Error if the `DISCORD_BOT_TOKEN` environment variable is not set.
 */
function botHeaders(): Record<string, string> {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) throw new Error('DISCORD_BOT_TOKEN is not set')
  return { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' }
}

/**
 * Validates an HTTP Response and throws an Error if the response status is not successful.
 *
 * @param res - The fetch `Response` to validate.
 * @param what - Short label describing the operation; included in the thrown error message.
 * @throws Error containing the `what` label, the HTTP status code, and the response body text when `res.ok` is false.
 */
async function ensureOk(res: Response, what: string) {
  if (!res.ok) {
    throw new Error(`Discord ${what} failed (${res.status}): ${await res.text()}`)
  }
}

/**
 * Create a message in a Discord channel.
 *
 * @param channelId - ID of the target channel
 * @param payload - Payload for the message create request (e.g. `content`, `embeds`, `components`, etc.)
 * @returns The created message object as returned by Discord's API
 * @throws Error if the HTTP response is not successful; the error message includes the operation label, status code, and response body
 */
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
/**
 * Grants the specified role to a member of the given guild.
 *
 * @param guildId - ID of the guild containing the member
 * @param userId - ID of the member to modify
 * @param roleId - ID of the role to add to the member
 * @throws Error if the API request fails (non-2xx response)
 */
export async function addMemberRole(guildId: string, userId: string, roleId: string) {
  const res = await fetch(`${API}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: 'PUT',
    headers: botHeaders(),
  })
  await ensureOk(res, 'addMemberRole')
}

/**
 * Remove a role from a member in a guild.
 *
 * @param guildId - Discord guild (server) ID
 * @param userId - Discord user ID of the member
 * @param roleId - Discord role ID to remove
 */
export async function removeMemberRole(guildId: string, userId: string, roleId: string) {
  const res = await fetch(`${API}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: 'DELETE',
    headers: botHeaders(),
  })
  await ensureOk(res, 'removeMemberRole')
}
