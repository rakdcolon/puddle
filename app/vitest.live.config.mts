import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import nextEnv from '@next/env'
nextEnv.loadEnvConfig(process.cwd())
export default defineConfig({
  resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},
  test:{include:['tests/live/**/*.test.ts'],testTimeout:30000,hookTimeout:30000,fileParallelism:false},
})
