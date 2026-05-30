export const dynamic = 'force-dynamic'

import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Privacy Policy — puddle',
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

export default function PrivacyPage() {
  return (
    <>
      <Masthead />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 py-8 sm:px-14 sm:py-16">
        <article className="max-w-[620px] mx-auto">
          <p className="text-[13px] italic text-accent tracking-[0.15px] mb-3">
            What we keep, and why
          </p>
          <h1 className="text-[46px] font-medium leading-[1.0] tracking-[-1px] mb-4">
            Privacy Policy
          </h1>
          <p className="text-[14px] italic text-ink-muted mb-8">
            Last updated {LAST_UPDATED}
          </p>

          <div
            className="text-[17px] leading-[1.65] text-ink space-y-4"
            style={{ borderTop: '1px solid var(--color-hair)', paddingTop: '28px' }}
          >
            <p>
              <strong>puddle</strong> is a daily puzzle at solvepuddle.com and a Discord activity. This
              policy explains what we collect, how we use it, and the choices you have. We collect as
              little as we can to run the puzzle and keep your streak.
            </p>
          </div>

          <Section title="What we collect">
            <ul className="space-y-3 list-disc pl-5">
              <li>
                <strong>Account information.</strong> When you sign in with Google or Discord, we receive
                your email address, a display name, and a provider account identifier. We use the verified
                email to link a Google and a Discord login into one account when they match.
              </li>
              <li>
                <strong>Gameplay data.</strong> Which puzzles you&rsquo;ve solved, your answers and
                attempts, hints used, solve times, streaks, and experience points.
              </li>
              <li>
                <strong>Anonymous solve counts.</strong> If you&rsquo;re not signed in, we store a random
                identifier in your browser&rsquo;s local storage so we can count distinct browsers solving a
                puzzle. This is not tied to your name or email.
              </li>
              <li>
                <strong>Cookies.</strong> A session cookie keeps you signed in on the website; inside the
                Discord activity, a signed session cookie maps your Discord identity to your puddle account.
                We don&rsquo;t use advertising or cross-site tracking cookies.
              </li>
              <li>
                <strong>Usage analytics.</strong> We use Vercel Analytics and Speed Insights, which collect
                aggregated, privacy-focused metrics about page views and performance without tracking you
                across other sites.
              </li>
            </ul>
          </Section>

          <Section title="How we use it">
            <ul className="space-y-2 list-disc pl-5">
              <li>To run the daily puzzle, record solves, and maintain streaks, XP, and your profile.</li>
              <li>To authenticate you and link your Google and Discord logins by verified email.</li>
              <li>To show aggregate, anonymized stats such as how many people solved a puzzle.</li>
              <li>To keep the service secure, debug problems, and improve it.</li>
            </ul>
            <p>We do not sell your personal information.</p>
          </Section>

          <Section title="Who we share it with">
            <p>
              We rely on a few trusted service providers to operate puddle, and your data may be processed
              by them on our behalf:
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li><strong>Supabase</strong> — database, authentication, and hosting of your account and gameplay data.</li>
              <li><strong>Vercel</strong> — application hosting and analytics.</li>
              <li><strong>Google</strong> and <strong>Discord</strong> — only when you choose to sign in with them.</li>
            </ul>
            <p>
              We may also disclose information if required by law. We don&rsquo;t otherwise share your
              personal data with third parties.
            </p>
          </Section>

          <Section title="Data retention">
            <p>
              We keep your account and gameplay data for as long as your account exists. If you ask us to
              delete your account, we remove your personal data, though anonymized, aggregate solve counts
              may remain.
            </p>
          </Section>

          <Section title="Your choices">
            <ul className="space-y-2 list-disc pl-5">
              <li>You can sign out at any time, which clears your session.</li>
              <li>You can clear your browser&rsquo;s local storage to reset the anonymous solve identifier.</li>
              <li>
                You can request access to or deletion of your account data by emailing us at the address
                below.
              </li>
            </ul>
          </Section>

          <Section title="Children">
            <p>
              puddle is not directed to children under 13, and we don&rsquo;t knowingly collect personal
              information from them. If you believe a child has provided us information, contact us and
              we&rsquo;ll delete it.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy as puddle evolves. We&rsquo;ll revise the &ldquo;last updated&rdquo;
              date above when we do.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions or requests about your data? Email us at{' '}
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
