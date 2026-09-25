import { beforeAll, afterAll, expect, test } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { assertTestEnvironment } from '@/lib/environment.mjs'
let service: SupabaseClient, anon: SupabaseClient
const clientId=randomUUID()
let puzzleId:string
beforeAll(async()=>{
  assertTestEnvironment()
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Service key required for nonproduction live tests')
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!
  service=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}})
  anon=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  const {data,error}=await service.from('puzzles').select('id').is('deleted_at',null).limit(1).single()
  expect(error).toBeNull();puzzleId=data!.id
})
afterAll(async()=>{
  if(service && puzzleId) {
    const {error}=await service.from('anon_solves').delete().eq('client_id',clientId).eq('puzzle_id',puzzleId)
    expect(error).toBeNull()
  }
})
test('real PostgREST upserts are idempotent and anon RLS hides solve rows',async()=>{
  const row={client_id:clientId,puzzle_id:puzzleId,status:'solved',attempts:1,hints_used:0}
  for(let i=0;i<2;i++) expect((await service.from('anon_solves').upsert(row,{onConflict:'client_id,puzzle_id'})).error).toBeNull()
  const persisted=await service.from('anon_solves').select('*').eq('client_id',clientId)
  expect(persisted.error).toBeNull();expect(persisted.data).toHaveLength(1)
  const hidden=await anon.from('anon_solves').select('*').eq('client_id',clientId)
  expect(hidden.error).toBeNull();expect(hidden.data).toEqual([])
})
test('anon cannot bypass the submissions API or write puzzle content',async()=>{
  expect((await anon.from('submissions').insert({submitter_email:'test@example.invalid',submitter_name:'CI',payload:{}})).error).not.toBeNull()
  const update=await anon.from('puzzles').update({title:'Forbidden'}).eq('id',puzzleId).select('id')
  expect(update.data ?? []).toEqual([])
})
