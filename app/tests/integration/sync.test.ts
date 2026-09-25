import { expect, test, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { applyPuzzleSync } from '@/lib/puzzles/sync'
function client(readError: unknown = null, writeError: unknown = null) {
  const select=vi.fn().mockResolvedValue({data:[{id:'a',date_active:'2026-01-01',deleted_at:null},{id:'b',date_active:'2026-01-02',deleted_at:'old'},{id:'c',date_active:'2026-01-03',deleted_at:null}],error:readError})
  const upsert=vi.fn().mockResolvedValue({error:writeError})
  const inFilter=vi.fn().mockResolvedValue({error:writeError})
  const update=vi.fn(()=>({in:inFilter}))
  return {db:{from:vi.fn(()=>({select,upsert,update}))} as unknown as SupabaseClient,select,upsert,update,inFilter}
}
test('dry run reports create/update/restore/delete without writes', async () => {
  const c=client()
  expect(await applyPuzzleSync(c.db,[{date_active:'2026-01-01'},{date_active:'2026-01-02'},{date_active:'2026-01-04'}],{dryRun:true})).toEqual({total:3,created:1,updated:1,restored:1,softDeleted:1})
  expect(c.upsert).not.toHaveBeenCalled();expect(c.update).not.toHaveBeenCalled()
})
test('upserts before reconciling missing issues and stops on upsert failure', async () => {
  const c=client();await applyPuzzleSync(c.db,[{date_active:'2026-01-01'}])
  expect(c.upsert).toHaveBeenCalledWith([{date_active:'2026-01-01'}],{onConflict:'date_active'})
  expect(c.inFilter).toHaveBeenCalledWith('id',['c'])
  const failed=client(null,{message:'write unavailable'})
  await expect(applyPuzzleSync(failed.db,[{date_active:'2026-01-01'}])).rejects.toThrow(/upsert/)
  expect(failed.update).not.toHaveBeenCalled()
})
test('empty archives and database read failures cannot initiate writes', async () => {
  const c=client({message:'offline'})
  await expect(applyPuzzleSync(c.db,[])).rejects.toThrow(/empty/)
  await expect(applyPuzzleSync(c.db,[{date_active:'2026-01-01'}])).rejects.toThrow(/read puzzles/)
  expect(c.upsert).not.toHaveBeenCalled()
})
test('reports soft-delete errors', async () => {
  const c=client();c.inFilter.mockResolvedValue({error:{message:'blocked'}})
  await expect(applyPuzzleSync(c.db,[{date_active:'2026-01-01'}])).rejects.toThrow(/soft-delete/)
})
