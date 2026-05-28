export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: '404 — An issue we never printed — puddle',
}

export default function NotFound() {
  return (
    <>
      <Masthead />
      <main className="flex-1 flex flex-col items-center justify-center px-5 text-center py-16 relative overflow-hidden">
        {/* Giant 404 watermark */}
        <span
          aria-hidden="true"
          className="absolute select-none font-medium italic leading-none pointer-events-none"
          style={{
            fontSize: 'clamp(180px, 30vw, 340px)',
            color: 'var(--color-paper-deep)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
            letterSpacing: '-4px',
          }}
        >
          404
        </span>

        <div className="relative z-10 max-w-[480px]">
          <p className="text-[13px] italic text-accent tracking-[0.15px] mb-4">
            An issue we never printed
          </p>
          <h1 className="text-[42px] font-medium leading-[1.04] tracking-[-0.8px] mb-5">
            This page doesn't appear in our archive.
          </h1>
          <p className="text-[17px] italic text-ink-muted leading-[1.65] mb-10">
            It may have been an old link, a puzzle we edited out, or a future issue we haven't gotten to yet.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/puzzle"
              className="px-6 py-3 rounded-btn text-[17px] font-medium text-paper transition-all duration-[180ms] hover:-translate-y-px"
              style={{ background: 'var(--color-ink)', boxShadow: 'var(--shadow-btn)' }}
            >
              Read today's puzzle →
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-btn text-[17px] font-medium text-ink border border-hair-strong transition-all duration-[180ms] hover:-translate-y-px"
              style={{ background: 'var(--color-paper)' }}
            >
              Back to the column
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
