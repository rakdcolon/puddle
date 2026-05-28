import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserBySupabaseId } from '@/lib/db/users'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getUserBySupabaseId(authUser.id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const db = createServiceClient()
  const { error } = await db.from('users').delete().eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.auth.signOut()

  return NextResponse.json({ deleted: true })
}
