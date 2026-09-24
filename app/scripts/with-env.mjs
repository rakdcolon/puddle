import { loadEnvFile } from 'node:process';
import { spawnSync } from 'node:child_process';
import { assertEnvironment } from '../src/lib/environment.mjs';
const [environment, script, ...args] = process.argv.slice(2);
if (!['dev','qa'].includes(environment) || !script) throw new Error('Usage: node scripts/with-env.mjs dev|qa <node-script> [args]');
loadEnvFile(environment === 'dev' ? '.env.local' : '.env.qa.local');
if (assertEnvironment() !== environment) throw new Error('Selected file does not match the requested environment');
// Spawn without --env-file in execArgv: Next worker threads reject that flag.
const result=spawnSync(process.execPath,[script,...args],{stdio:'inherit',env:process.env});
if(result.error) throw result.error;
process.exit(result.status ?? 1);
