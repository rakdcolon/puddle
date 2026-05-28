export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Masthead from '@/components/layout/Masthead'
import Footer from '@/components/layout/Footer'
import PuzzleForm from '../../PuzzleForm'
import { getPuzzleById } from '@/lib/db/puzzles'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Edit puzzle — admin' }

export default async function EditPuzzlePage({ params }: Props) {
  const { id } = await params
  const puzzle = await getPuzzleById(id)
  if (!puzzle) notFound()

  return (
    <>
      <Masthead />
      <main className="flex-1 max-w-[860px] mx-auto w-full px-4 py-8 sm:px-14">
        <p className="italic text-accent mb-1" style={{ fontSize: 13 }}>Admin</p>
        <h1 className="font-medium mb-8" style={{ fontSize: 36, letterSpacing: -0.7 }}>
          Edit — {puzzle.title}
        </h1>
        <PuzzleForm initialData={puzzle} />
      </main>
      <Footer />
    </>
  )
}
