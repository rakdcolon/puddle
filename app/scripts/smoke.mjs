// Read-only release smoke; never submits answers, runs cron or seeds a database.
const target=process.env.SMOKE_URL;
if(!target) throw new Error('SMOKE_URL is required');
const base=new URL(target);
if(base.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(base.hostname)) throw new Error('HTTPS required');
for(const path of ['/','/api/health','/api/puzzle/today']) {
  const res=await fetch(new URL(path,base),{redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  if(path==='/api/health') {
    const data=await res.json();
    if(data.status!=='ok' || data.environment!==process.env.SMOKE_ENV) throw new Error('Unexpected environment or unhealthy database');
  }
  if(path==='/api/puzzle/today') {
    const data=await res.json();
    if(!data.puzzle?.id || Object.hasOwn(data.puzzle,'answer')) throw new Error('Invalid public puzzle contract');
  }
  console.log(`PASS ${path}`);
}
