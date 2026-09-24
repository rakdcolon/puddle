// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PuzzleApp from '@/components/puzzle/PuzzleApp'
import { publicPuzzle } from '../fixtures/puzzle'
vi.mock('@/lib/discord/sdk',()=>({setPuddlePresence:vi.fn()}))
afterEach(()=>{cleanup();localStorage.clear()})
const renderPuzzle = () => render(<PuzzleApp puzzle={publicPuzzle} settings={{sound:false,show_streak:false,hint_pacing:'instant'}} />)
test('requires an answer, accepts a correct response and records daily progress', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({correct:true})))
  vi.stubGlobal('fetch',fetcher)
  renderPuzzle();const user=userEvent.setup()
  expect(screen.getByRole('button',{name:'Check answer'})).toBeDisabled()
  await user.type(screen.getByPlaceholderText('Type your answer…'),'5')
  await user.click(screen.getByRole('button',{name:'Check answer'}))
  expect(await screen.findByRole('button',{name:'✓ Done'})).toBeDisabled()
  expect(JSON.parse(localStorage.getItem('puddle.daily')!)).toMatchObject({state:'solved',puzzleId:publicPuzzle.id})
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({answer:'5',attempts:1})
})
test('reveals hints progressively without giving away future hints', async () => {
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}')))
  renderPuzzle();const user=userEvent.setup()
  expect(screen.queryByText(publicPuzzle.hints[0])).not.toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:/Hint 0\/3/}))
  expect(screen.getByText(publicPuzzle.hints[0])).toBeInTheDocument()
  expect(screen.queryByText(publicPuzzle.hints[1])).not.toBeInTheDocument()
})
test('a server failure leaves the puzzle retryable and does not record a solve', async () => {
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}',{status:503})))
  renderPuzzle();const user=userEvent.setup()
  await user.type(screen.getByPlaceholderText('Type your answer…'),'5')
  await user.click(screen.getByRole('button',{name:'Check answer'}))
  await waitFor(()=>expect(screen.getByRole('button',{name:'Check answer'})).toBeEnabled())
  expect(localStorage.getItem('puddle.daily')).toBeNull()
})
