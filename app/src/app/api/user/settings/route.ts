import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import type { UserSettings } from '@/types'

const DEFAULTS: Omit<UserSettings, 'user_id'> = {
  sound: true,
  show_streak: true,
  hint_pacing: 'instant',
  display_name: null,
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data } = await db.from('user_settings').select('*').eq('user_id', user.id).maybeSingle()

  return NextResponse.json(data ?? { user_id: user.id, ...DEFAULTS })
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const allowed = ['sound', 'show_streak', 'hint_pacing', 'display_name']
  const patch = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k)),
  )

  const db = createServiceClient()
  const { data, error } = await db
    .from('user_settings')
    .upsert({ user_id: user.id, ...DEFAULTS, ...patch }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
