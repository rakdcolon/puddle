import { NextResponse, type NextRequest } from 'next/server'
import {
  verifyInteractionSignature,
  InteractionType,
  InteractionResponseType,
  MessageFlags,
  PUDDLE_ACCENT,
} from '@/lib/discord/interactions'
import { getUserByDiscordSub, getUserProfile } from '@/lib/db/users'
import { formatElapsed } from '@/lib/utils/dates'

// Ed25519 verification + getUserProfile need Node APIs and the service client,
// so pin the Node runtime (never Edge) and never cache.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE = 'solvepuddle.com'

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
    if (interaction.data?.name === 'stats') return handleStats(interaction)
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
            {
              name: 'Avg solve',
              value: stats.avg_time_seconds ? formatElapsed(stats.avg_time_seconds) : '—',
              inline: true,
            },
            { name: 'XP', value: `${stats.xp}`, inline: true },
          ],
          footer: { text: SITE },
        },
      ],
    },
  })
}
