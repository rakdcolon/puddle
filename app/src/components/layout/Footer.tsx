import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Footer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.email === process.env.ADMIN_EMAIL

  return (
    <footer className="mt-auto">
      <div className="border-t border-hair" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-14 py-5 flex flex-row items-center justify-between gap-3">
        <cite className="not-italic text-[14px] italic text-ink-muted">
          Established 2026.
        </cite>
        <nav className="flex flex-row items-center gap-4 sm:gap-6">
          <Link href="/about" className="text-[14px] text-ink hover:text-accent transition-colors duration-[180ms]">
            About
          </Link>
          <Link href="/submit" className="text-[14px] text-ink hover:text-accent transition-colors duration-[180ms]">
            Submit a puzzle
          </Link>
          <Link href="/terms" className="text-[14px] text-ink hover:text-accent transition-colors duration-[180ms]">
            Terms
          </Link>
          <Link href="/privacy" className="text-[14px] text-ink hover:text-accent transition-colors duration-[180ms]">
            Privacy
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-[14px] text-ink-muted hover:text-accent transition-colors duration-[180ms] italic">
              Admin
            </Link>
          )}
        </nav>
      </div>
    </footer>
  )
}
