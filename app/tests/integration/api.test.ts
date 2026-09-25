import { beforeEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { puzzle } from '../fixtures/puzzle'
const mocks=vi.hoisted(()=>({getPuzzleById:vi.fn(),getCurrentUser:vi.fn(),upsertAnonSolve:vi.fn(),markAnonRevealed:vi.fn(),upsertSolve:vi.fn(),markRevealed:vi.fn()}))
vi.mock('@/lib/db/puzzles',()=>({getPuzzleById:mocks.getPuzzleById}))
vi.mock('@/lib/auth/current-user',()=>({getCurrentUser:mocks.getCurrentUser}))
vi.mock('@/lib/db/anon-solves',()=>({upsertAnonSolve:mocks.upsertAnonSolve,markAnonRevealed:mocks.markAnonRevealed}))
vi.mock('@/lib/db/solves',()=>({upsertSolve:mocks.upsertSolve,markRevealed:mocks.markRevealed}))
import { POST } from '@/app/api/puzzle/[id]/submit/route'
const clientId='20000000-0000-4000-8000-000000000001'
const submit=(body:unknown)=>POST(new NextRequest('http://localhost/api/puzzle/test/submit',{method:'POST',headers:{'x-forwarded-for':crypto.randomUUID()},body:JSON.stringify(body)}),{params:Promise.resolve({id:puzzle.id})})
beforeEach(()=>{vi.clearAllMocks();mocks.getPuzzleById.mockResolvedValue(puzzle);mocks.getCurrentUser.mockResolvedValue(null);mocks.upsertAnonSolve.mockResolvedValue(undefined)})
test('correct anonymous answer persists with normalized/clamped fields and never leaks solution',async()=>{
  const res=await submit({answer:' 5 ',client_id:clientId,hints_used:-10,attempts:999999,elapsed_seconds:-1})
  expect(await res.json()).toEqual({correct:true})
  expect(mocks.upsertAnonSolve).toHaveBeenCalledWith(clientId,puzzle.id,'solved',null,0,32767)
})
test('wrong answers and invalid client IDs do not persist solves',async()=>{
  expect(await (await submit({answer:'6',client_id:clientId})).json()).toEqual({correct:false})
  await submit({answer:'5',client_id:'invalid'})
  expect(mocks.upsertAnonSolve).not.toHaveBeenCalled()
})
test('correctness survives persistence failure; unknown puzzle and empty requests fail',async()=>{
  mocks.upsertAnonSolve.mockRejectedValue(new Error('offline'))
  expect(await (await submit({answer:'5',client_id:clientId})).json()).toEqual({correct:true})
  expect((await submit(null)).status).toBe(400)
  expect((await submit({})).status).toBe(400)
  mocks.getPuzzleById.mockResolvedValue(null);expect((await submit({answer:'5'})).status).toBe(404)
})
