import Link from 'next/link'
import LogoMark from './LogoMark'
import { createClient } from '@/lib/supabase/server'

interface MastheadProps {
  currentPage?: 'about' | 'profile' | 'settings' | 'sign-in'
  issueNo?: number
  vol?: number
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`text-[15px] transition-colors duration-[180ms] ${
        active
          ? 'text-accent italic underline decoration-accent underline-offset-[3px]'
          : 'text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </Link>
  )
}

export default async function Masthead({ currentPage, issueNo = 1, vol = 1 }: MastheadProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header>
      <div
        className="max-w-[1440px] mx-auto px-4 py-3 sm:px-14 sm:py-4"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Left: dateline */}
        <div>
          <span className="text-[13px] italic text-ink-muted tracking-[0.1px]">
            Vol. {toRoman(vol)}{' '}
            <span className="text-accent">·</span>{' '}
            No. {issueNo}
          </span>
        </div>

        {/* Center: logo */}
        <Link href="/" aria-label="puddle — back to today's puzzle">
          <LogoMark />
        </Link>

        {/* Right: nav */}
        <nav className="flex items-center justify-end gap-4 sm:gap-6 flex-wrap">
          <NavLink href="/about" active={currentPage === 'about'}>
            About
          </NavLink>
          {user && (
            <NavLink href="/settings" active={currentPage === 'settings'}>
              Settings
            </NavLink>
          )}
          {user?.email === process.env.ADMIN_EMAIL && (
            <NavLink href="/admin">
              Admin
            </NavLink>
          )}
          {user ? (
            <>
              <NavLink href="/profile" active={currentPage === 'profile'}>
                Profile
              </NavLink>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-[15px] text-ink-muted hover:text-ink transition-colors duration-[180ms]"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <NavLink href="/sign-in" active={currentPage === 'sign-in'}>
              Sign in
            </NavLink>
          )}
        </nav>
      </div>

      {/* Hairline rule */}
      <div className="border-b border-hair" />
    </header>
  )
}

function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1]
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I']
  let result = ''
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i] }
  }
  return result
}
