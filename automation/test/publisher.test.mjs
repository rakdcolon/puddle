import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { publicationFiles, publishDraft } from '../publisher.mjs';

const puzzle = {...JSON.parse(readFileSync(new URL('../../puzzles/025-the-line-of-frogs.json',import.meta.url),'utf8')),issue_no:1000,date_active:'2099-01-01',title:'New puzzle'};
const draft = {id:createHash('sha256').update(JSON.stringify(puzzle)).digest('hex').slice(0,24),puzzle,source:{id:123},review:{solution_check:'Independently checked',adaptation_notes:'Attribution reviewed'}};
const blob = content => ({type:'file',encoding:'base64',size:Buffer.byteLength(content),content:Buffer.from(content).toString('base64')});
function github({ collision=false, existing=false, extraFile=false, failRef=false }={}) {
  const calls=[]; const plan=publicationFiles(draft);
  const fetcher=async(url, options)=>{
    assert.ok(url.startsWith('https://api.github.com/repos/rakdcolon/puddle/'));
    assert.equal(options.redirect,'error');
    const path=url.slice('https://api.github.com/repos/rakdcolon/puddle'.length);
    const body=options.body?JSON.parse(options.body):undefined;
    calls.push({method:options.method,path,body});
    let status=200,data;
    if(path==='/git/ref/heads/main')data={object:{sha:'base'}};
    else if(path==='/git/commits/base')data={tree:{sha:'base-tree'}};
    else if(path==='/contents/puzzles?ref=base')data=[{type:'file',name:'001.json'}];
    else if(path==='/contents/puzzles/001.json?ref=base')data=blob(JSON.stringify({issue_no:collision?1000:1,date_active:'2020-01-01',title:'Old puzzle'}));
    else if(path.startsWith('/git/ref/heads/puzzle/')){status=existing?200:404;data={object:{sha:'reserved'}};}
    else if(path.startsWith('/contents/')){
      const file=plan.files.find(f=>path===`/contents/${f.path}?ref=reserved`);
      if(file)data=blob(file.content);else{status=404;data={};}
    }
    else if(path.startsWith('/compare/'))data={files:[...plan.files.map(f=>({filename:f.path,status:'added'})),...(extraFile?[{filename:'.github/workflows/pwn.yml',status:'added'}]:[])]};
    else if(path==='/git/trees')data={sha:'tree'};
    else if(path==='/git/commits')data={sha:'commit'};
    else if(path==='/git/refs'){status=failRef?422:201;data={};}
    else if(path.startsWith('/pulls?'))data=[];
    else if(path==='/pulls')data={html_url:'https://github.com/rakdcolon/puddle/pull/999'};
    else throw new Error('Unexpected request '+path);
    return new Response(JSON.stringify(data),{status});
  };
  return {fetcher,calls};
}
test('dry run checks remote archive without writing anything',async()=>{
  const g=github();const result=await publishDraft(draft,{fetcher:g.fetcher});
  assert.equal(result.status,'dry_run');assert.ok(g.calls.every(c=>c.method==='GET'));
});
test('publishing requires explicit review and credentials before network activity',async()=>{
  const g=github();await assert.rejects(publishDraft(draft,{apply:true,token:'test',fetcher:g.fetcher}),/reviewed/);assert.equal(g.calls.length,0);
});
test('publisher only adds two fixed files on a date branch and opens a draft PR',async()=>{
  const g=github();await publishDraft(draft,{apply:true,reviewed:true,token:'test',fetcher:g.fetcher});
  const writes=g.calls.filter(c=>c.method!=='GET');assert.deepEqual(writes.map(c=>c.path),['/git/trees','/git/commits','/git/refs','/pulls']);
  assert.equal(writes[0].body.base_tree,'base-tree');assert.deepEqual(writes[0].body.tree.map(f=>f.path),['puzzles/1000-agent.json','puzzles/provenance/1000.json']);
  assert.ok(writes[0].body.tree.every(f=>f.type==='blob'&&f.mode==='100644'&&typeof f.content==='string'));
  assert.equal(writes[2].body.ref,'refs/heads/puzzle/2099-01-01');assert.equal(writes[3].body.draft,true);
});
test('archive collisions stop before any write',async()=>{
  const g=github({collision:true});await assert.rejects(publishDraft(draft,{apply:true,reviewed:true,token:'test',fetcher:g.fetcher}),/conflicts/);assert.ok(g.calls.every(c=>c.method==='GET'));
});
test('ref race never overwrites another branch or opens a PR',async()=>{
  const g=github({failRef:true});await assert.rejects(publishDraft(draft,{apply:true,reviewed:true,token:'test',fetcher:g.fetcher}),/422/);assert.ok(!g.calls.some(c=>c.path==='/pulls'||c.method==='PATCH'));
});
test('resume validates branch scope and reuses an identical branch without rewriting it',async()=>{
  const g=github({existing:true});await publishDraft(draft,{apply:true,reviewed:true,token:'test',fetcher:g.fetcher});assert.deepEqual(g.calls.filter(c=>c.method!=='GET').map(c=>c.path),['/pulls']);
  const bad=github({existing:true,extraFile:true});await assert.rejects(publishDraft(draft,{apply:true,reviewed:true,token:'test',fetcher:bad.fetcher}),/outside/);assert.ok(bad.calls.every(c=>c.method==='GET'));
});
test('tampered and past-dated drafts fail before publication',()=>{
  assert.throws(()=>publicationFiles({...draft,puzzle:{...puzzle,title:'Tampered'}}),/match/);
  assert.throws(()=>publicationFiles(draft,'2099-01-01'),/future date/);
});
