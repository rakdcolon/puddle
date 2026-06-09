import { NextResponse, type NextRequest } from 'next/server'
import { getPuzzleForDate } from '@/lib/db/puzzles'
import { getTodayNY } from '@/lib/utils/dates'
import { dailyPuzzleEmbed } from '@/lib/discord/embeds'
import { postChannelMessage } from '@/lib/discord/rest'

// Posting via the bot REST client needs the Node runtime; never cache.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Daily auto-post. A Vercel Cron (see vercel.json) hits this once each morning;
// it fetches today's puzzle and posts the public card to the announce channel,
// @-mentioning the opt-in reminder role so only members who asked get pinged.
//
// Vercel signs cron invocations with `Authorization: Bearer ${CRON_SECRET}`
// when CRON_SECRET is set — we reject anything that doesn't match, so the route
/**
 * Endpoint handler for the daily cron that posts the day's puzzle to a Discord channel.
 *
 * Validates the request using `Authorization: Bearer ${CRON_SECRET}`, looks up the announce
 * channel from `DISCORD_ANNOUNCE_CHANNEL_ID`, fetches today's puzzle, and posts an embed
 * (optionally mentioning `DISCORD_DAILY_ROLE_ID`). Returns a JSON response describing the outcome.
 *
 * @param request - Incoming Next.js request; must include `Authorization: Bearer ${CRON_SECRET}` header.
 * @returns A NextResponse whose JSON body indicates the result:
 * - 401 response with plain "Unauthorized" when the cron secret is missing or invalid.
 * - 500 JSON `{ ok: false, error }` when `DISCORD_ANNOUNCE_CHANNEL_ID` is not set.
 * - 200 JSON `{ ok: true, skipped: 'no puzzle for today' }` when no puzzle exists for today.
 * - 502 JSON `{ ok: false, error }` when posting to Discord fails (error message included if available).
 * - 200 JSON `{ ok: true, issue_no }` on successful post (contains the puzzle's `issue_no`).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const channelId = process.env.DISCORD_ANNOUNCE_CHANNEL_ID
  if (!channelId) {
    return NextResponse.json(
      { ok: false, error: 'DISCORD_ANNOUNCE_CHANNEL_ID is not set' },
      { status: 500 },
    )
  }

  const puzzle = await getPuzzleForDate(getTodayNY())
  if (!puzzle) {
    // No puzzle scheduled for today — skip quietly rather than post a broken card.
    return NextResponse.json({ ok: true, skipped: 'no puzzle for today' })
  }

  const roleId = process.env.DISCORD_DAILY_ROLE_ID
  const content = roleId
    ? `<@&${roleId}> Today's puddle is live.`
    : "Today's puddle is live."

  try {
    await postChannelMessage(channelId, {
      content,
      embeds: [dailyPuzzleEmbed(puzzle)],
      // Only allow the reminder role to actually ping — never @everyone/@here.
      allowed_mentions: roleId ? { roles: [roleId] } : { parse: [] },
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'post failed' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, issue_no: puzzle.issue_no })
}
