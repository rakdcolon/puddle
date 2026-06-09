import { NextResponse, type NextRequest } from 'next/server'
import {
  verifyInteractionSignature,
  InteractionType,
  InteractionResponseType,
  MessageFlags,
  PUDDLE_ACCENT,
} from '@/lib/discord/interactions'
import { getUserByDiscordSub, getUserProfile, getLeaderboard } from '@/lib/db/users'
import { getPuzzleForDate } from '@/lib/db/puzzles'
import { getTodayNY } from '@/lib/utils/dates'
import { dailyPuzzleEmbed, SITE } from '@/lib/discord/embeds'
import { addMemberRole, removeMemberRole } from '@/lib/discord/rest'

// Ed25519 verification + getUserProfile need Node APIs and the service client,
// so pin the Node runtime (never Edge) and never cache.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// custom_id of the opt-in button posted by scripts/setup-daily-optin.mjs —
// keep this string in sync with that script.
const DAILY_PING_BUTTON = 'toggle-daily-ping'

// The bot's HTTP interactions endpoint. Discord POSTs every slash command (and
// a PING handshake when you save the endpoint URL) here. We verify the
// signature against the raw body, then dispatch by command name. No gateway /
// always-on process required — this is a plain serverless route.
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (
    !verifyInteractionSignature(
      rawBody,
      request.headers.get('x-signature-ed25519'),
      request.headers.get('x-signature-timestamp'),
    )
  ) {
    return new NextResponse('invalid request signature', { status: 401 })
  }

  const interaction = JSON.parse(rawBody)

  // Endpoint-verification handshake.
  if (interaction.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG })
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const name = interaction.data?.name
    if (name === 'stats') return handleStats(interaction)
    if (name === 'leaderboard') return handleLeaderboard()
    if (name === 'today') return handleToday()
  }

  if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
    if (interaction.data?.custom_id === DAILY_PING_BUTTON) {
      return handleToggleDailyPing(interaction)
    }
  }

  // Unknown interaction — acknowledge without a visible message.
  return reply('Unknown command.', true)
}

function reply(content: string, ephemeral = false) {
  return NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: ephemeral ? { content, flags: MessageFlags.EPHEMERAL } : { content },
  })
}

// /stats [user] — show a player's level, streak, and solve record. Defaults to
// the invoker; an optional `user` option targets someone else.
async function handleStats(interaction: any) {
  const invoker = interaction.member?.user ?? interaction.user
  const opt = interaction.data?.options?.find((o: any) => o.name === 'user')
  const targetId: string = opt?.value ?? invoker.id
  const isSelf = targetId === invoker.id

  const resolved = interaction.data?.resolved?.users?.[targetId]
  const targetName: string =
    resolved?.global_name ?? resolved?.username ?? invoker.global_name ?? invoker.username ?? 'this player'

  const user = await getUserByDiscordSub(targetId)
  if (!user) {
    return reply(
      isSelf
        ? `You haven't linked a Puddle account yet — sign in with Discord once at https://${SITE} and your solves will show up here.`
        : `**${targetName}** hasn't played puddle yet.`,
      true,
    )
  }

  const { stats } = await getUserProfile(user.id)

  return NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: `${user.display_name} · puddle`,
          url: `https://${SITE}`,
          color: PUDDLE_ACCENT,
          fields: [
            { name: 'Level', value: `${stats.level}`, inline: true },
            {
              name: 'Streak',
              value: `${stats.current_streak} day${stats.current_streak === 1 ? '' : 's'}`,
              inline: true,
            },
            { name: 'Solved', value: `${stats.total_solved}`, inline: true },
            { name: 'Win rate', value: `${stats.win_pct}%`, inline: true },
            { name: 'XP', value: `${stats.xp}`, inline: true },
          ],
          footer: { text: SITE },
        },
      ],
    },
  })
}

// /leaderboard — top solvers this week, ranked by puzzles solved (not time).
async function handleLeaderboard() {
  const rows = await getLeaderboard(7, 10)
  if (rows.length === 0) {
    return reply(`No solves yet this week — be the first to put a name up. https://${SITE}`)
  }
  const medals = ['🥇', '🥈', '🥉']
  const lines = rows.map(
    (r, i) => `${medals[i] ?? `\`${i + 1}.\``} **${r.display_name}** — ${r.solved} solved`,
  )
  return NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: 'Puddle · this week',
          description: lines.join('\n'),
          color: PUDDLE_ACCENT,
          footer: { text: `Puzzles solved in the last 7 days · ${SITE}` },
        },
      ],
    },
  })
}

// /today — the current puzzle's title, genre, and difficulty, with a play link.
// No answer is exposed (same public info as the website's puzzle page).
async function handleToday() {
  const puzzle = await getPuzzleForDate(getTodayNY())
  if (!puzzle) return reply('No puzzle is live right now — check back soon.', true)

  return NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { embeds: [dailyPuzzleEmbed(puzzle)] },
  })
}

// The opt-in button on the pinned reminder message. Toggles a self-assignable
// role: members who hold it get @-mentioned in the daily auto-post. No role is
// the default, so reminders are strictly opt-in. We reply privately (ephemeral)
// so the channel isn't spammed with confirmations.
async function handleToggleDailyPing(interaction: any) {
  const roleId = process.env.DISCORD_DAILY_ROLE_ID
  const guildId = interaction.guild_id
  const member = interaction.member
  const userId = member?.user?.id

  if (!roleId || !guildId || !userId) {
    return reply("Daily reminders aren't set up yet — check back soon.", true)
  }

  const hasRole = Array.isArray(member.roles) && member.roles.includes(roleId)
  try {
    if (hasRole) {
      await removeMemberRole(guildId, userId, roleId)
      return reply("Done — you're off the list and won't be pinged when the next puddle drops.", true)
    }
    await addMemberRole(guildId, userId, roleId)
    return reply("You're on the list — I'll ping you here each morning when the new puddle goes live. Tap again any time to stop.", true)
  } catch {
    return reply("Couldn't update your reminder just now — give it another tap in a moment.", true)
  }
}
