import Link from 'next/link'

export default function Footer() {
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
        </nav>
      </div>
    </footer>
  )
}
