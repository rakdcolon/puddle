import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, openStore, saveDraft, validatePuzzle, sourceRequest, archive } from '../core.mjs';

const base = JSON.parse(readFileSync(join(ROOT,'puzzles/025-the-line-of-frogs.json'),'utf8'));
const candidate = () => ({...structuredClone(base),issue_no:1,vol:99,date_active:'2099-01-01',title:'Test candidate'});
function store(t) {
  const directory = mkdtempSync(join(tmpdir(),'puddle-test-'));
  const db = openStore(join(directory,'queue.sqlite'));
  t.after(()=>{db.close();rmSync(directory,{recursive:true,force:true});});
  db.prepare('INSERT INTO sources VALUES (1,?,?)').run('{}',new Date().toISOString());
  return db;
}
const draft = () => ({puzzle:candidate(),source_id:1,solution_check:'Checked all cases independently.',adaptation_notes:'Original wording; credit needs review.'});

test('validates current archive numeric example',()=>assert.equal(validatePuzzle(base).answer,'9'));
test('rejects schema injection, invalid date, bounds and malformed structures',()=>{
  for (const change of [{deleted_at:null},{issue_no:'26'},{date_active:'2099-02-30'},{answer:'99'},{solution_steps:[null]},{hints:[]},{input_config:{min:0,max:10,sql:'drop'}}]) {
    assert.throws(()=>validatePuzzle({...candidate(),...change}));
  }
});
test('insert is persistent and exact retries are idempotent',t=>{
  const db = store(t); const d = draft();
  const result = saveDraft(db,d,[]);
  assert.equal(result.status,'pending_review');
  assert.equal(saveDraft(db,d,[]).already_saved,true);
  assert.equal(db.prepare('SELECT count(*) AS n FROM drafts').get().n,1);
  assert.equal(JSON.parse(db.prepare('SELECT puzzle FROM drafts').get().puzzle).issue_no,1);
});
test('cannot overwrite drafts or existing issue/date/title, or save unfetched sources',t=>{
  const db = store(t); const d = draft();
  assert.throws(()=>saveDraft(db,{...d,source_id:42},[]),/Retrieve source/);
  for (const collision of [{date_active:base.date_active},{title:base.title}]) {
    assert.throws(()=>saveDraft(db,{...d,puzzle:{...d.puzzle,...collision}},archive()),/already exists/);
  }
  saveDraft(db,d,[]);
  assert.throws(()=>saveDraft(db,{...d,puzzle:{...d.puzzle,title:'Overwrite attempt'}},[]),/UNIQUE/);
  assert.equal(JSON.parse(db.prepare('SELECT puzzle FROM drafts').get().puzzle).title,'Test candidate');
});
test('source gateway refuses arbitrary paths, caches results and obeys backoff',async t=>{
  const db = store(t); let requests = 0;
  const fetcher = async (url,options)=>{
    requests++;
    assert.equal(url.origin,'https://api.stackexchange.com');
    assert.equal(options.redirect,'error');
    return new Response(JSON.stringify({items:[],backoff:60}));
  };
  await assert.rejects(sourceRequest(db,'https://localhost/private',{},fetcher),/Unsupported/);
  await sourceRequest(db,'search/advanced',{q:'frogs'},fetcher);
  await sourceRequest(db,'search/advanced',{q:'frogs'},fetcher);
  await assert.rejects(sourceRequest(db,'search/advanced',{q:'other'},fetcher),/backoff/);
  assert.equal(requests,1);
});

test('derives edition from date and permits the same day number in different years',t=>{
  const db=store(t);
  db.prepare('INSERT INTO sources VALUES (2,?,?)').run('{}',new Date().toISOString());
  const first=saveDraft(db,{...draft(),puzzle:{...candidate(),vol:2,issue_no:1000}},[]);
  const second=saveDraft(db,{...draft(),source_id:2,puzzle:{...candidate(),date_active:'2098-01-01',title:'Another year'}},[]);
  const saved=db.prepare('SELECT puzzle FROM drafts WHERE id=?').get(first.id);
  assert.equal(JSON.parse(saved.puzzle).vol,99);
  assert.equal(JSON.parse(saved.puzzle).issue_no,1);
  assert.notEqual(first.id,second.id);
  assert.equal(db.prepare('SELECT count(*) AS n FROM drafts WHERE issue_no=1').get().n,2);
});
test('source gateway limits response size and daily request count',async t=>{
  const db = store(t);
  await assert.rejects(sourceRequest(db,'search/advanced',{},async()=>new Response('x'.repeat(1024*1024+1))),/too large/);
  db.prepare('INSERT OR REPLACE INTO limits VALUES (?,80)').run(new Date().toISOString().slice(0,10));
  await assert.rejects(sourceRequest(db,'questions/1',{},async()=>{throw new Error('Must not fetch');}),/budget/);
});
