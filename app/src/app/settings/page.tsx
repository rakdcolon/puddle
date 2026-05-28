export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'
import SettingsClient from './SettingsClient'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserBySupabaseId } from '@/lib/db/users'

export const metadata = { title: 'Settings — puddle' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/sign-in?returnTo=/settings')

  const user = await getUserBySupabaseId(authUser)
  if (!user) redirect('/sign-in')

  const db = createServiceClient()
  const { data: settings } = await db
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <>
      <Masthead currentPage="settings" />
      <main className="flex-1 max-w-[720px] mx-auto w-full px-6 py-10">
        <h1 className="font-medium mb-8" style={{ fontSize: 38, letterSpacing: -0.8 }}>
          Settings
        </h1>
        <SettingsClient
          user={user}
          settings={settings ?? {
            user_id: user.id,
            sound: true,
            show_streak: true,
            hint_pacing: 'instant',
            display_name: null,
          }}
        />
      </main>
      <Footer />
    </>
  )
}
