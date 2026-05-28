import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserBySupabaseId, getUserProfile } from '@/lib/db/users'

export async function GET() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await getUserBySupabaseId(authUser.id)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const profile = await getUserProfile(user.id)
  return NextResponse.json(profile)
}
