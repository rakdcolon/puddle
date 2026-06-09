import { NextResponse, type NextRequest } from 'next/server'
import { verifyGithubSignature } from '@/lib/github/webhook'
import { postChannelMessage } from '@/lib/discord/rest'
import { PUDDLE_ACCENT } from '@/lib/discord/interactions'

// HMAC verification + the bot REST client need Node APIs; never cache.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Discord embed descriptions cap at 4096 chars — leave room for the truncation
// footer link.
const MAX_DESC = 3900

// Receives GitHub's `release` webhook and posts the notes to #patch-notes, so a
// published GitHub Release shows up in Discord automatically (no more hand-
// copying patch notes). Configure the webhook in repo Settings → Webhooks:
// payload URL = /api/github/release, content type application/json, secret =
// GITHUB_WEBHOOK_SECRET, events = "Releases" only.
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!verifyGithubSignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    return new NextResponse('invalid signature', { status: 401 })
  }

  if (request.headers.get('x-github-event') !== 'release') {
    return NextResponse.json({ ok: true, ignored: 'not a release event' })
  }

  const payload = JSON.parse(rawBody)
  const release = payload.release

  // Only announce real, published releases — skip drafts, prereleases, edits,
  // and deletions.
  if (payload.action !== 'published' || release?.draft || release?.prerelease) {
    return NextResponse.json({ ok: true, ignored: `action=${payload.action}` })
  }

  const channelId = process.env.DISCORD_PATCHNOTES_CHANNEL_ID
  if (!channelId) {
    return NextResponse.json(
      { ok: false, error: 'DISCORD_PATCHNOTES_CHANNEL_ID is not set' },
      { status: 500 },
    )
  }

  const name: string = release.name || release.tag_name || 'New release'
  const body: string = (release.body || '').trim()
  const description =
    body.length > MAX_DESC
      ? `${body.slice(0, MAX_DESC)}…\n\n[Full notes on GitHub →](${release.html_url})`
      : body || `[View on GitHub →](${release.html_url})`

  try {
    await postChannelMessage(channelId, {
      embeds: [
        {
          title: `📝 ${name}`,
          url: release.html_url,
          description,
          color: PUDDLE_ACCENT,
          footer: { text: 'solvepuddle.com' },
        },
      ],
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'post failed' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, posted: release.tag_name })
}
