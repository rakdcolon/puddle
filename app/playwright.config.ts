import { defineConfig, devices } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import { assertTestEnvironment } from './src/lib/environment.mjs'
loadEnvConfig(process.cwd())
assertTestEnvironment()
const baseURL=process.env.E2E_BASE_URL || 'http://127.0.0.1:3100'
const url=new URL(baseURL)
if (['solvepuddle.com','www.solvepuddle.com'].includes(url.hostname)) throw new Error('E2E writes cannot target the production site')
if (process.env.E2E_BASE_URL && process.env.PUDDLE_ENV !== 'qa') throw new Error('Remote E2E requires QA configuration')
export default defineConfig({
  testDir:'tests/e2e',fullyParallel:false,workers:1,forbidOnly:!!process.env.CI,
  retries:process.env.CI?1:0,timeout:45000,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL,trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure'},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['Pixel 7']}}],
  webServer:process.env.E2E_BASE_URL?undefined:{command:'npm run start -- --hostname 127.0.0.1 --port 3100',url:`${baseURL}/api/health`,reuseExistingServer:false,timeout:120000},
})
