import { createPublicKey, verify, type KeyObject } from 'node:crypto'

// Discord signs every interaction webhook with Ed25519. Before trusting a
// request we must verify `timestamp + rawBody` against the application's public
// key (the hex value from Developer Portal → General Information → Public Key).
// https://discord.com/developers/docs/interactions/overview#setting-up-an-endpoint
//
// Node's crypto can't ingest a bare 32-byte Ed25519 key, so we wrap it in the
// fixed SPKI/DER prefix for Ed25519 public keys and import that.
const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

let cachedKey: KeyObject | null = null

function publicKey(): KeyObject | null {
  if (cachedKey) return cachedKey
  const hex = process.env.DISCORD_PUBLIC_KEY
  if (!hex) return null
  cachedKey = createPublicKey({
    key: Buffer.concat([SPKI_ED25519_PREFIX, Buffer.from(hex, 'hex')]),
    format: 'der',
    type: 'spki',
  })
  return cachedKey
}

export function verifyInteractionSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): boolean {
  const key = publicKey()
  if (!key || !signature || !timestamp) return false
  try {
    return verify(
      null,
      Buffer.from(timestamp + rawBody),
      key,
      Buffer.from(signature, 'hex'),
    )
  } catch {
    return false
  }
}

// Subsets of Discord's interaction enums that we actually use.
export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
} as const

export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
} as const

export const MessageFlags = {
  EPHEMERAL: 1 << 6, // 64 — only the invoking user sees the reply
} as const

// Puddle accent (#b85a3e) for embed sidebars.
export const PUDDLE_ACCENT = 0xb85a3e
