import nextEnv from '@next/env';
import { assertEnvironment } from '../src/lib/environment.mjs';
nextEnv.loadEnvConfig(process.cwd());
console.log(`Environment verified: ${assertEnvironment()}`);
