import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createClient } from '@supabase/supabase-js'
import { assertTestEnvironment } from '../../src/lib/environment.mjs'
assertTestEnvironment()
if(!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Nonproduction service key required')
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}})
test.beforeEach(async({request})=>{
  const response=await request.get('/api/health')
  expect(response.ok()).toBe(true)
  expect((await response.json()).environment).toBe(process.env.PUDDLE_ENV || 'dev')
})
test('visitor opens puzzle, uses a hint, solves, and persists one anonymous solve',async({page,request})=>{
  const response=await request.get('/api/puzzle/today');expect(response.ok()).toBe(true)
  const {puzzle}=await response.json()
  expect(puzzle).not.toHaveProperty('answer');expect(puzzle).not.toHaveProperty('solution_lede')
  const {data:answer,error}=await db.from('puzzles').select('answer,input_type,input_config').eq('id',puzzle.id).single()
  expect(error).toBeNull()
  await page.goto('/');await page.getByRole('link',{name:/Begin today's puzzle/}).click()
  await expect(page.getByRole('heading',{name:puzzle.title,exact:true})).toBeVisible()
  await page.getByRole('button',{name:/Hint 0\//}).click()
  await expect(page.getByText(puzzle.hints[0])).toBeVisible()
  if(answer!.input_type==='choice') {
    const options=answer!.input_config.options as string[]
    const option=options.find(v=>v.trim().toLowerCase()===answer!.answer)!
    await page.getByRole('button').filter({hasText:option}).click()
  } else await page.getByRole('textbox',{name:'Your answer'}).fill(answer!.answer)
  try {
    await page.getByRole('button',{name:'Check answer'}).click()
    await expect(page.getByRole('button',{name:'✓ Done'})).toBeDisabled()
    const clientId=await page.evaluate(()=>localStorage.getItem('puddle.cid'))
    expect(clientId).toBeTruthy()
    await expect.poll(async()=>{
      const {data}=await db.from('anon_solves').select('status,hints_used').eq('client_id',clientId!).eq('puzzle_id',puzzle.id)
      return data
    }).toEqual([{status:'solved',hints_used:1}])
  } finally {
    const clientId=await page.evaluate(()=>localStorage.getItem('puddle.cid'))
    if(clientId) expect((await db.from('anon_solves').delete().eq('client_id',clientId).eq('puzzle_id',puzzle.id)).error).toBeNull()
  }
})
test('protected pages and admin APIs reject anonymous visitors',async({page,request})=>{
  await page.goto('/settings');await expect(page).toHaveURL(/\/sign-in\?returnTo=/)
  expect((await request.post('/api/admin/puzzles',{data:{title:'Unauthorized'}})).status()).toBe(403)
  expect((await request.get('/api/cron/sync-puzzles')).status()).toBe(404)
})
test('puzzle has no serious accessibility violations or horizontal overflow',async({page})=>{
  await page.goto('/puzzle')
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
  expect(results.violations.filter(v=>['critical','serious'].includes(v.impact ?? ''))).toEqual([])
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})
