import { expect, test } from 'vitest'
import { assertEnvironment, assertTestEnvironment, environmentName, scheduledJobsEnabled } from '@/lib/environment.mjs'
const local = { NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'test' }
test('defaults local dev and recognizes Vercel environments', () => {
  expect(assertEnvironment(local)).toBe('dev')
  expect(assertTestEnvironment(local)).toBe('dev')
  expect(assertEnvironment({...local,NEXT_PUBLIC_SUPABASE_URL:'http://localhost:54321'})).toBe('dev')
  expect(environmentName({VERCEL_ENV:'preview'})).toBe('qa')
  expect(environmentName({VERCEL_ENV:'production'})).toBe('prod')
  expect(scheduledJobsEnabled({PUDDLE_ENV:'qa'})).toBe(false)
  expect(scheduledJobsEnabled({PUDDLE_ENV:'prod'})).toBe(true)
})
test('rejects production credentials in dev or QA and all production fixture writes', () => {
  const prod = {...local,NEXT_PUBLIC_SUPABASE_URL:'https://cfluksodliqrdymhnvbc.supabase.co'}
  expect(()=>assertEnvironment(prod)).toThrow(/registered dev/)
  expect(()=>assertEnvironment({...prod,PUDDLE_ENV:'qa'})).toThrow(/registered qa/)
  expect(assertEnvironment({...prod,PUDDLE_ENV:'prod'})).toBe('prod')
  expect(()=>assertTestEnvironment({...prod,PUDDLE_ENV:'prod'})).toThrow(/production/)
})
test('QA writes require opt-in and registry match', () => {
  const qa = {...local,PUDDLE_ENV:'qa',NEXT_PUBLIC_SUPABASE_URL:'https://mzwzcdyteyrlnrwcetxq.supabase.co'}
  expect(()=>assertTestEnvironment(qa)).toThrow(/PUDDLE_ALLOW_QA_TESTS/)
  expect(assertTestEnvironment({...qa,PUDDLE_ALLOW_QA_TESTS:'1'})).toBe('qa')
})
test('rejects invalid environments, Vercel mismatches, credentials and URL tricks', () => {
  expect(()=>environmentName({PUDDLE_ENV:'test'})).toThrow()
  expect(()=>environmentName({PUDDLE_ENV:'qa',VERCEL_ENV:'production'})).toThrow()
  expect(()=>environmentName({PUDDLE_ENV:'prod',VERCEL_ENV:'preview'})).toThrow()
  expect(()=>assertEnvironment({})).toThrow()
  expect(()=>assertEnvironment({...local,NEXT_PUBLIC_SUPABASE_ANON_KEY:''})).toThrow(/required/)
  for (const url of ['http://127.0.0.1:54321/other','https://127.0.0.1:54321','http://user:pass@127.0.0.1:54321','http://127.0.0.1:54321/?x=1','http://127.0.0.1:54321/#x']) expect(()=>assertEnvironment({...local,NEXT_PUBLIC_SUPABASE_URL:url})).toThrow()
})
