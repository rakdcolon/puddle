import { NextResponse, type NextRequest } from 'next/server'
import { getPuzzleForDate } from '@/lib/db/puzzles'
import { getTodayNY } from '@/lib/utils/dates'
import { dailyPuzzleEmbed } from '@/lib/discord/embeds'
import { postChannelMessage } from '@/lib/discord/rest'
import { checkRunwayAndAlert } from '@/lib/puzzles/runway'

// Posting via the bot REST client needs the Node runtime; never cache.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Daily auto-post. A Vercel Cron (see vercel.json) hits this once each morning;
// it fetches today's puzzle and posts the public card to the announce channel,
// @-mentioning the opt-in reminder role so only members who asked get pinged.
//
// Vercel signs cron invocations with `Authorization: Bearer ${CRON_SECRET}`
// when CRON_SECRET is set — we reject anything that doesn't match, so the route
// can't be triggered by the public.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Forward-looking runway tripwire: warns the ops channel before the schedule
  // runs dry (the site never errors when it does — it just serves the last
  // issue forever). Runs every day regardless of today's post, and is wrapped
  // so a check failure can never break the daily post.
  let runway = null
  try {
    runway = await checkRunwayAndAlert()
  } catch (err) {
    console.error('runway check failed:', err)
  }

  const channelId = process.env.DISCORD_ANNOUNCE_CHANNEL_ID
  if (!channelId) {
    return NextResponse.json(
      { ok: false, error: 'DISCORD_ANNOUNCE_CHANNEL_ID is not set', runway },
      { status: 500 },
    )
  }

  const puzzle = await getPuzzleForDate(getTodayNY())
  if (!puzzle) {
    // No puzzle scheduled for today — skip quietly rather than post a broken card.
    return NextResponse.json({ ok: true, skipped: 'no puzzle for today', runway })
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
      { ok: false, error: err instanceof Error ? err.message : 'post failed', runway },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, issue_no: puzzle.issue_no, runway })
}
