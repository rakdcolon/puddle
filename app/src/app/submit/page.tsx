export const dynamic = 'force-dynamic'

import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'
import SubmitForm from './SubmitForm'

export const metadata = { title: 'Submit a puzzle — puddle' }

export default function SubmitPage() {
  return (
    <>
      <Masthead />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-14 py-10">
        <div className="max-w-[620px]">
          <p className="italic text-accent mb-2" style={{ fontSize: 13 }}>Submit a puzzle</p>
          <h1 className="font-medium mb-2" style={{ fontSize: 42, letterSpacing: -0.9, lineHeight: 1.02 }}>
            Share one with us.
          </h1>
          <p className="text-ink-muted italic mb-10" style={{ fontSize: 16, lineHeight: 1.6 }}>
            Every puzzle is read personally. If it runs, we'll reach out to you.
          </p>
          <SubmitForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
