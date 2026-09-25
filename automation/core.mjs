import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const STATE = join(ROOT, '.puddle-agent');
export const GENRES = ['logic', 'quant', 'pattern', 'lateral', 'wordplay', 'deduction'];
const fields = ['issue_no','vol','date_active','title','genre','difficulty','prompt','answer','answer_display','hints','solution_lede','solution_steps','input_type','input_config'];
function requireValue(ok, message) { if (!ok) throw new Error(message); }
function text(value, label, max = 6000) {
  requireValue(typeof value === 'string' && value.trim().length > 0 && value.length <= max, `${label}: expected nonempty text, at most ${max} characters`);
}
export function validatePuzzle(p) {
  requireValue(p && typeof p === 'object' && !Array.isArray(p), 'Expected puzzle object');
  requireValue(Object.keys(p).every(k => fields.includes(k)), 'Unknown puzzle fields');
  requireValue(fields.every(k => Object.hasOwn(p, k)), 'Missing puzzle fields; use the archive template');
  for (const k of ['issue_no','vol']) requireValue(Number.isSafeInteger(p[k]) && p[k] > 0, `${k}: expected positive integer`);
  requireValue(/^\d{4}-\d{2}-\d{2}$/.test(p.date_active) && Number.isFinite(Date.parse(p.date_active)) && new Date(p.date_active).toISOString().slice(0,10) === p.date_active, 'Invalid date_active');
  requireValue(GENRES.includes(p.genre), 'Invalid genre');
  requireValue(Number.isInteger(p.difficulty) && p.difficulty >= 1 && p.difficulty <= 5, 'difficulty must be 1–5');
  for (const k of ['title','answer','answer_display','solution_lede']) text(p[k], k, k === 'title' ? 150 : 6000);
  for (const k of ['prompt','hints']) {
    requireValue(Array.isArray(p[k]) && p[k].length >= 1 && p[k].length <= 8, `${k}: expected 1–8 paragraphs`);
    p[k].forEach(v => text(v, k));
  }
  requireValue(p.hints.length === 3, 'Provide exactly three progressive hints');
  requireValue(Array.isArray(p.solution_steps) && p.solution_steps.length >= 1 && p.solution_steps.length <= 12, 'Expected 1–12 solution steps');
  for (const step of p.solution_steps) {
    requireValue(step && Object.keys(step).length === 1 && Object.hasOwn(step, 'body'), 'Each solution step must contain only body');
    text(step.body, 'solution step');
  }
  requireValue(['freetext','numeric','choice'].includes(p.input_type), 'Invalid input_type');
  const c = p.input_config;
  if (p.input_type === 'freetext') requireValue(c === null, 'freetext requires null input_config');
  if (p.input_type === 'numeric') {
    requireValue(c && Object.keys(c).sort().join(',') === 'max,min' && Number.isFinite(c.min) && Number.isFinite(c.max) && c.min <= c.max, 'numeric requires min/max bounds');
    requireValue(Number.isFinite(Number(p.answer)) && Number(p.answer) >= c.min && Number(p.answer) <= c.max, 'Numeric answer outside bounds');
  }
  if (p.input_type === 'choice') {
    requireValue(c && Object.keys(c).join(',') === 'options' && Array.isArray(c.options) && c.options.length >= 2 && c.options.length <= 8, 'choice requires 2–8 options');
    c.options.forEach(v => text(v, 'option', 300));
    requireValue(new Set(c.options.map(v => v.trim().toLowerCase())).size === c.options.length, 'Duplicate choices');
    requireValue(c.options.some(v => v.trim().toLowerCase() === p.answer.trim().toLowerCase()), 'Answer must match a choice');
  }
  return { ...p, answer: p.answer.trim().toLowerCase() };
}
export function archive(root = ROOT) {
  return readdirSync(join(root,'puzzles')).filter(f => f.endsWith('.json') && f !== 'template.json')
    .map(f => JSON.parse(readFileSync(join(root,'puzzles',f), 'utf8'))).sort((a,b) => a.issue_no - b.issue_no);
}
export function openStore(path = join(STATE,'drafts.sqlite')) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS sources (id INTEGER PRIMARY KEY, payload TEXT NOT NULL, fetched_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS drafts (id TEXT PRIMARY KEY, issue_no INTEGER UNIQUE NOT NULL, date_active TEXT UNIQUE NOT NULL,
      source_id INTEGER UNIQUE NOT NULL, puzzle TEXT NOT NULL, review TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS api_cache (key TEXT PRIMARY KEY, payload TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, value INTEGER NOT NULL);`);
  return db;
}
export function saveDraft(db, { puzzle, source_id, solution_check, adaptation_notes }, existing = archive()) {
  const p = validatePuzzle(puzzle);
  requireValue(Number.isSafeInteger(source_id) && source_id > 0, 'Invalid source_id');
  requireValue(db.prepare('SELECT id FROM sources WHERE id = ?').get(source_id), 'Retrieve source with puddle_read before saving');
  text(solution_check, 'solution_check'); text(adaptation_notes, 'adaptation_notes');
  requireValue(!existing.some(x => x.issue_no === p.issue_no || x.date_active === p.date_active || x.title.toLowerCase() === p.title.toLowerCase()), 'Issue, date or title already exists in archive');
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  requireValue(p.date_active > today, 'Schedule drafts after today (America/New_York)');
  const json = JSON.stringify(p);
  const id = createHash('sha256').update(json).digest('hex').slice(0,24);
  if (db.prepare('SELECT id FROM drafts WHERE id = ?').get(id)) return { id, status:'pending_review', already_saved:true };
  requireValue(db.prepare('SELECT count(*) AS n FROM drafts').get().n < 100, 'Queue full: operator must archive reviewed drafts');
  db.prepare('INSERT INTO drafts VALUES (?, ?, ?, ?, ?, ?, ?)').run(id,p.issue_no,p.date_active,source_id,json,JSON.stringify({solution_check,adaptation_notes}),new Date().toISOString());
  return { id, status:'pending_review' };
}

// The model supplies search text or a numeric ID, never a host, path, headers or credentials.
export async function sourceRequest(db, route, params = {}, fetcher = fetch) {
  requireValue(route === 'search/advanced' || /^questions\/\d+(\/answers)?$/.test(route), 'Unsupported source route');
  const url = new URL(`https://api.stackexchange.com/2.3/${route}`);
  url.search = new URLSearchParams({site:'puzzling', pagesize:'5', filter:'withbody', ...params}).toString();
  const key = url.href;
  const cached = db.prepare('SELECT payload FROM api_cache WHERE key = ? AND expires > ?').get(key,Date.now());
  if (cached) return JSON.parse(cached.payload);
  const backoff = db.prepare("SELECT value FROM limits WHERE key = 'backoff'").get()?.value ?? 0;
  requireValue(Date.now() >= backoff, `Source requested backoff; retry after ${new Date(backoff).toISOString()}`);
  const day = new Date().toISOString().slice(0,10);
  const count = db.prepare('SELECT value FROM limits WHERE key = ?').get(day)?.value ?? 0;
  requireValue(count < 80, 'Daily source request budget reached (80)');
  db.prepare('INSERT INTO limits VALUES (?,1) ON CONFLICT(key) DO UPDATE SET value=value+1').run(day);
  const response = await fetcher(url, {redirect:'error', signal:AbortSignal.timeout(15000), headers:{Accept:'application/json'}});
  requireValue(response.ok, `Source HTTP ${response.status}`);
  const reader = response.body.getReader(); const chunks = []; let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read(); if (done) break;
      size += value.byteLength; requireValue(size <= 1024 * 1024, 'Source response too large'); chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (data.backoff) db.prepare("INSERT INTO limits VALUES ('backoff',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(Date.now()+data.backoff*1000);
  requireValue(!data.error_id && Array.isArray(data.items), `Source error: ${data.error_name ?? 'invalid response'}`);
  db.prepare('INSERT OR REPLACE INTO api_cache VALUES (?, ?, ?)').run(key,JSON.stringify(data),Date.now()+3600000);
  return data;
}
export function summarizePost(p) {
  const bodyLimit = p.answer_id ? 4000 : 8000;
  return {id:p.answer_id ?? p.question_id, answer_id:p.answer_id, title:p.title,
    url:p.link ?? (p.answer_id ? `https://puzzling.stackexchange.com/a/${p.answer_id}` : `https://puzzling.stackexchange.com/questions/${p.question_id}`),
    author:p.owner?.display_name, author_url:p.owner?.link, license:p.content_license,
    score:p.score, accepted:p.is_accepted, tags:p.tags, body_html:p.body?.slice(0,bodyLimit), truncated:(p.body?.length ?? 0) > bodyLimit};
}
export async function search(db, query) {
  text(query,'query',160);
  const data = await sourceRequest(db,'search/advanced',{q:query,accepted:'true',closed:'false',sort:'relevance'});
  return {untrusted_source_content:true, quota_remaining:data.quota_remaining, results:data.items.map(p => ({...summarizePost(p),body_html:undefined}))};
}
export async function readSource(db, id) {
  requireValue(Number.isSafeInteger(id) && id > 0, 'Expected positive question ID');
  const question = (await sourceRequest(db,`questions/${id}`)).items[0];
  requireValue(question, 'Question not found');
  const answers = (await sourceRequest(db,`questions/${id}/answers`,{sort:'votes',order:'desc'})).items;
  const payload = {untrusted_source_content:true, question:summarizePost(question), answers:answers.map(summarizePost)};
  db.prepare('INSERT OR REPLACE INTO sources VALUES (?, ?, ?)').run(id,JSON.stringify(payload),new Date().toISOString());
  return payload;
}
