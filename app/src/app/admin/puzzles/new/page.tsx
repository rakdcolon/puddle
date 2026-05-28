import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'
import PuzzleForm from '../../PuzzleForm'

export const metadata = { title: 'New puzzle — admin' }

export default function NewPuzzlePage() {
  return (
    <>
      <Masthead />
      <main className="flex-1 max-w-[860px] mx-auto w-full px-4 py-8 sm:px-14">
        <p className="italic text-accent mb-1" style={{ fontSize: 13 }}>Admin</p>
        <h1 className="font-medium mb-8" style={{ fontSize: 36, letterSpacing: -0.7 }}>
          New puzzle
        </h1>
        <PuzzleForm />
      </main>
      <Footer />
    </>
  )
}
