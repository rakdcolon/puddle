import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { ACTIVITY_COOKIE } from '@/lib/auth/session'

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { error } = await db.from('users').delete().eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Tear down whichever auth surface the request used: the website Supabase
  // session and/or the Discord Activity cookie.
  const supabase = await createClient()
  await supabase.auth.signOut()

  const res = NextResponse.json({ deleted: true })
  res.headers.append(
    'Set-Cookie',
    `${ACTIVITY_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0`,
  )
  return res
}
