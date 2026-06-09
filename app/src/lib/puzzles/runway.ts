import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { postChannelMessage } from '@/lib/discord/rest'
import { getTodayNY } from '@/lib/utils/dates'

// Content-runway tripwire.
//
// The site never errors when it runs out of puzzles: getPuzzleForDate and
// getCurrentIssue both do a "latest on-or-before today" lookup, so once the
// schedule is exhausted they silently keep serving the last issue forever, with
// no 404 and no cron failure. This module looks forward instead, so we get a
// warning before the well runs dry (and a louder one if it already has).

export interface Runway {
  latestDate: string | null // 'YYYY-MM-DD' of the furthest scheduled puzzle
  latestIssueNo: number | null
  daysLeft: number | null // days from today (NY) to latestDate; negative once exhausted
}

// Whole calendar days from `fromYMD` to `toYMD` (both 'YYYY-MM-DD'), treating
// each as a UTC midnight so the difference is a clean day count with no tz drift.
function daysBetween(fromYMD: string, toYMD: string): number {
  const from = Date.parse(`${fromYMD}T00:00:00Z`)
  const to = Date.parse(`${toYMD}T00:00:00Z`)
  return Math.round((to - from) / 86_400_000)
}

// How far out the furthest scheduled (non-deleted) puzzle is from today (NY).
export async function getRunway(db: SupabaseClient): Promise<Runway> {
  const { data, error } = await db
    .from('puzzles')
    .select('issue_no, date_active')
    .is('deleted_at', null)
    .order('date_active', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`runway query: ${error.message}`)
  if (!data) return { latestDate: null, latestIssueNo: null, daysLeft: null }

  return {
    latestDate: data.date_active,
    latestIssueNo: data.issue_no,
    daysLeft: daysBetween(getTodayNY(), data.date_active),
  }
}

export function runwayAlertMessage(r: Runway): string {
  if (r.latestDate === null) {
    return '🚨 **Puddle runway: no puzzles are scheduled at all.** The daily puzzle has nothing to serve.'
  }
  if (r.daysLeft !== null && r.daysLeft < 0) {
    const ago = -r.daysLeft
    return `🚨 **Puddle runway exhausted.** The last puzzle is No. ${r.latestIssueNo} (${r.latestDate}), ${ago} day${ago === 1 ? '' : 's'} ago. The site is silently serving that stale puzzle every day. Add new puzzles now.`
  }
  const d = r.daysLeft ?? 0
  return `⚠️ **Puddle runway low: ${d} day${d === 1 ? '' : 's'} left.** The last scheduled puzzle is No. ${r.latestIssueNo} (${r.latestDate}). Schedule more before then or the site will freeze on it.`
}

// Checks the runway and, when it is at or below the alert threshold, posts a
// warning to the private ops channel. No-op (and no error) when the ops channel
// is unset. Returns a small summary for the caller's response/observability.
export async function checkRunwayAndAlert(): Promise<{
  checked: boolean
  daysLeft: number | null
  alerted: boolean
}> {
  const opsChannel = process.env.DISCORD_OPS_CHANNEL_ID
  if (!opsChannel) return { checked: false, daysLeft: null, alerted: false }

  const runway = await getRunway(createServiceClient())

  const rawThreshold = process.env.RUNWAY_ALERT_DAYS?.trim()
  const parsed = rawThreshold ? Number(rawThreshold) : NaN
  const threshold = Number.isFinite(parsed) && parsed >= 0 ? parsed : 5
  const low = runway.daysLeft === null || runway.daysLeft <= threshold

  if (low) {
    await postChannelMessage(opsChannel, { content: runwayAlertMessage(runway) })
  }
  return { checked: true, daysLeft: runway.daysLeft, alerted: low }
}
