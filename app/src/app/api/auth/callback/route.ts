import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/db/users'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const returnTo = searchParams.get('returnTo') ?? '/puzzle'

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`)
  }

  const response = NextResponse.redirect(`${origin}${returnTo}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (!error) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await getOrCreateUser(user)
    return response
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`)
}
