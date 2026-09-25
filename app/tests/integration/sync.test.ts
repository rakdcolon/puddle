import { expect, test, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { applyPuzzleSync } from '@/lib/puzzles/sync'
function client(readError: unknown = null, writeError: unknown = null) {
  const select=vi.fn().mockResolvedValue({data:[{issue_no:1,deleted_at:null},{issue_no:2,deleted_at:'old'},{issue_no:3,deleted_at:null}],error:readError})
  const upsert=vi.fn().mockResolvedValue({error:writeError})
  const inFilter=vi.fn().mockResolvedValue({error:writeError})
  const update=vi.fn(()=>({in:inFilter}))
  return {db:{from:vi.fn(()=>({select,upsert,update}))} as unknown as SupabaseClient,select,upsert,update,inFilter}
}
test('dry run reports create/update/restore/delete without writes', async () => {
  const c=client()
  expect(await applyPuzzleSync(c.db,[{issue_no:1},{issue_no:2},{issue_no:4}],{dryRun:true})).toEqual({total:3,created:1,updated:1,restored:1,softDeleted:1})
  expect(c.upsert).not.toHaveBeenCalled();expect(c.update).not.toHaveBeenCalled()
})
test('upserts before reconciling missing issues and stops on upsert failure', async () => {
  const c=client();await applyPuzzleSync(c.db,[{issue_no:1}])
  expect(c.upsert).toHaveBeenCalledWith([{issue_no:1}],{onConflict:'issue_no'})
  expect(c.inFilter).toHaveBeenCalledWith('issue_no',[3])
  const failed=client(null,{message:'write unavailable'})
  await expect(applyPuzzleSync(failed.db,[{issue_no:1}])).rejects.toThrow(/upsert/)
  expect(failed.update).not.toHaveBeenCalled()
})
test('empty archives and database read failures cannot initiate writes', async () => {
  const c=client({message:'offline'})
  await expect(applyPuzzleSync(c.db,[])).rejects.toThrow(/empty/)
  await expect(applyPuzzleSync(c.db,[{issue_no:1}])).rejects.toThrow(/read puzzles/)
  expect(c.upsert).not.toHaveBeenCalled()
})
test('reports soft-delete errors', async () => {
  const c=client();c.inFilter.mockResolvedValue({error:{message:'blocked'}})
  await expect(applyPuzzleSync(c.db,[{issue_no:1}])).rejects.toThrow(/soft-delete/)
})
