export const dynamic = 'force-dynamic'

import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'About puddle',
  description:
    'puddle is a hand-edited daily puzzle column. Each morning a new logic, wordplay, lateral, pattern, or quant puzzle, with a worked solution.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <>
      <Masthead currentPage="about" />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 py-8 sm:px-14 sm:py-16">
        <article className="max-w-[620px] mx-auto">
          <p className="text-[13px] italic text-accent tracking-[0.15px] mb-3">
            About the column
          </p>
          <h1 className="text-[46px] font-medium leading-[1.0] tracking-[-1px] mb-8">
            One puzzle, every day.
          </h1>

          <div
            className="text-[18px] leading-[1.65] text-ink space-y-5"
            style={{ borderTop: '1px solid var(--color-hair)', paddingTop: '28px' }}
          >
            <p>
              <strong>puddle</strong> is a daily puzzle column. Each morning a new puzzle appears — drawn from
              logic, lateral thinking, pattern recognition, wordplay, or quantitative reasoning.
            </p>
            <p>
              The puzzles are chosen for the feeling at the end: that moment when the answer clicks and
              you wonder why you didn't see it sooner. They range from gentle to wicked, but they're
              never unfair. If you can't get there, the worked solution explains the path.
            </p>
            <p>
              puddle is edited by hand. Every puzzle is tested, every solution is written in full.
              If you have a puzzle worth running, the submission form is open.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--color-hair)', margin: '40px 0' }} />

          <h2 className="text-[22px] font-medium italic text-accent leading-[1.0] tracking-[-0.2px] mb-5">
            Different genres
          </h2>
          <ul className="text-[17px] leading-[1.65] space-y-2">
            {[
              ['Logic & Deduction', 'Constraint satisfaction, forced inference.'],
              ['Quant & Interview', 'Estimation, combinatorics, classic brainteasers.'],
              ['Pattern & Sequence', 'Find the rule; extend the series.'],
              ['Lateral Riddles', 'Break the obvious assumption.'],
              ['Wordplay', 'Anagrams, homophones, hidden words.'],
              ['Deduction', 'Elimination and ordering from partial information.'],
            ].map(([genre, desc]) => (
              <li key={genre}>
                <strong>{genre}</strong>
                <span className="italic text-ink-muted"> — {desc}</span>
              </li>
            ))}
          </ul>

          <div style={{ borderTop: '1px solid var(--color-hair)', margin: '40px 0' }} />

          <p className="text-[17px] leading-[1.65]">
            To submit a puzzle,{' '}
            <a href="/submit" className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity">
              use the form
            </a>
            .
          </p>
        </article>
      </main>
      <Footer />
    </>
  )
}
