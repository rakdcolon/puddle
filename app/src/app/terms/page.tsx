export const dynamic = 'force-dynamic'

import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Terms of Service — puddle',
}

const LAST_UPDATED = 'May 30, 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{ borderTop: '1px solid var(--color-hair)', margin: '40px 0' }} />
      <h2 className="text-[22px] font-medium italic text-accent leading-[1.0] tracking-[-0.2px] mb-5">
        {title}
      </h2>
      <div className="text-[17px] leading-[1.65] text-ink space-y-4">{children}</div>
    </>
  )
}

export default function TermsPage() {
  return (
    <>
      <Masthead />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 py-8 sm:px-14 sm:py-16">
        <article className="max-w-[620px] mx-auto">
          <p className="text-[13px] italic text-accent tracking-[0.15px] mb-3">
            The fine print
          </p>
          <h1 className="text-[46px] font-medium leading-[1.0] tracking-[-1px] mb-4">
            Terms of Service
          </h1>
          <p className="text-[14px] italic text-ink-muted mb-8">
            Last updated {LAST_UPDATED}
          </p>

          <div
            className="text-[17px] leading-[1.65] text-ink space-y-4"
            style={{ borderTop: '1px solid var(--color-hair)', paddingTop: '28px' }}
          >
            <p>
              Welcome to <strong>puddle</strong> (&ldquo;puddle,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), a daily
              puzzle available at solvepuddle.com and as an activity inside Discord. By using puddle you
              agree to these Terms of Service. If you don&rsquo;t agree, please don&rsquo;t use the service.
            </p>
          </div>

          <Section title="The service">
            <p>
              puddle publishes one puzzle each day, with optional accounts that track your streaks,
              experience points, and solve history. The service is provided free of charge. We may add,
              change, or remove features at any time.
            </p>
          </Section>

          <Section title="Your account">
            <p>
              You can sign in with Google or Discord. You&rsquo;re responsible for activity under your
              account and for keeping access to your linked Google or Discord account secure. If you sign
              in with both providers using the same verified email address, we link them to a single
              puddle account.
            </p>
            <p>
              You must be at least 13 years old to create an account. If you&rsquo;re using puddle inside
              Discord, you must also comply with Discord&rsquo;s own Terms of Service.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>Use bots, scrapers, or automated tools to solve puzzles or inflate stats.</li>
              <li>Attempt to disrupt, overload, reverse-engineer, or gain unauthorized access to the service.</li>
              <li>Publicly post puzzle answers in a way intended to spoil the day&rsquo;s puzzle for others.</li>
              <li>Use puddle for any unlawful purpose or to harass other users.</li>
            </ul>
            <p>
              We may suspend or remove accounts that violate these terms, with or without notice.
            </p>
          </Section>

          <Section title="Puzzles and content">
            <p>
              The puzzles, solutions, text, and design of puddle are our intellectual property and are
              provided for your personal, non-commercial enjoyment. You may share your own results and
              link to puddle, but you may not republish the puzzles or solutions as your own.
            </p>
          </Section>

          <Section title="Puzzle submissions">
            <p>
              If you submit a puzzle through our submission form, you confirm it is your own work or that
              you have the right to share it, and you grant puddle a non-exclusive, royalty-free,
              worldwide license to edit, publish, and use it. You are not entitled to payment, and we are
              not obligated to publish any submission.
            </p>
          </Section>

          <Section title="Disclaimer and liability">
            <p>
              puddle is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of
              any kind. We don&rsquo;t guarantee that the service will be uninterrupted, error-free, or that
              your data will always be preserved. To the fullest extent permitted by law, puddle is not
              liable for any indirect, incidental, or consequential damages arising from your use of the
              service.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these terms from time to time. When we do, we&rsquo;ll revise the &ldquo;last
              updated&rdquo; date above. Continued use of puddle after changes take effect means you accept
              the revised terms.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about these terms? Email us at{' '}
              <a
                href="mailto:rohan.karamel@gmail.com"
                className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                rohan.karamel@gmail.com
              </a>
              .
            </p>
          </Section>
        </article>
      </main>
      <Footer />
    </>
  )
}
