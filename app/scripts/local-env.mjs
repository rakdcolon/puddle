import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
// Only reads the local container status. Never links to a cloud project or prints keys.
const raw = execFileSync(process.execPath, ['node_modules/supabase/dist/supabase.js','status','-o','json'], {encoding:'utf8'});
const status = JSON.parse(raw);
const url = status.API_URL ?? status.api?.url;
const anon = status.ANON_KEY ?? status.api?.anon_key;
const service = status.SERVICE_ROLE_KEY ?? status.api?.service_role_key;
if (!url || !anon || !service) throw new Error('Local Supabase status did not include expected credentials');
if (!['localhost','127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Refusing nonlocal Supabase status');
const content = `PUDDLE_ENV=dev\nNEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}\nSUPABASE_SERVICE_ROLE_KEY=${service}\nNEXT_PUBLIC_APP_URL=http://127.0.0.1:3000\n`;
writeFileSync('.env.local',content,{flag:'wx',mode:0o600});
console.log('Created ignored .env.local from local Supabase status. Existing files are never overwritten.');
