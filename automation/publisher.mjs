// Operator-only GitHub publisher. Never registered in the curator's tool list.
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { openStore, validatePuzzle } from './core.mjs';

const REPO = 'rakdcolon/puddle';
const API = `https://api.github.com/repos/${REPO}`;
const json = value => JSON.stringify(value, null, 2) + '\n';
const todayNY = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function publicationFiles(draft, today = todayNY()) {
  if (!/^[a-f0-9]{24}$/.test(draft.id ?? '')) throw new Error('Invalid draft ID');
  const puzzle = validatePuzzle(structuredClone(draft.puzzle));
  const digest = createHash('sha256').update(JSON.stringify(puzzle)).digest('hex').slice(0, 24);
  if (digest !== draft.id) throw new Error('Draft content does not match its ID');
  if (puzzle.date_active <= today) throw new Error('Publication requires a future date');
  if (!draft.source || !draft.review?.solution_check || !draft.review?.adaptation_notes) throw new Error('Missing source or editorial review');
  const files = [
    { path: `puzzles/${String(puzzle.issue_no).padStart(3, '0')}-agent.json`, content: json(puzzle) },
    { path: `puzzles/provenance/${puzzle.issue_no}.json`, content: json({ draft_id: draft.id, review: draft.review, source: draft.source }) },
  ];
  if (files.some(file => Buffer.byteLength(file.content) > 256_000)) throw new Error('Publication payload too large');
  return { puzzle, files, branch: `puzzle/${puzzle.date_active}` };
}

export async function publishDraft(draft, { apply = false, reviewed = false, token, fetcher = fetch, today } = {}) {
  const plan = publicationFiles(draft, today);
  if (apply && (!reviewed || !token)) throw new Error('Publishing requires --reviewed and PUDDLE_PUBLISHER_TOKEN');
  // No arbitrary URL, repository, branch update, deletion, merge or database operation.
  const request = async (method, path, body, allow404 = false) => {
    const response = await fetcher(API + path, { method, redirect: 'error', signal: AbortSignal.timeout(20_000), headers: {
      Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (response.status === 404 && allow404) return null;
    if (!response.ok) throw new Error(`GitHub ${method} failed (${response.status}); inspect branch ${plan.branch} before retrying`);
    return response.json();
  };
  const readFile = async (path, ref) => {
    const blob = await request('GET', `/contents/${path}?ref=${encodeURIComponent(ref)}`);
    if (blob.type !== 'file' || blob.encoding !== 'base64' || blob.size > 256_000) throw new Error('Unexpected archive file');
    return Buffer.from(blob.content, 'base64').toString('utf8');
  };
  const ref = await request('GET', '/git/ref/heads/main');
  const base = ref.object.sha;
  const commit = await request('GET', `/git/commits/${base}`);
  const listing = await request('GET', `/contents/puzzles?ref=${base}`);
  if (!Array.isArray(listing) || listing.length >= 1000) throw new Error('Archive listing missing or potentially truncated');
  const puzzleFiles = listing.filter(file => file.type === 'file' && /^[^/]+\.json$/.test(file.name) && file.name !== 'template.json');
  if (!puzzleFiles.length) throw new Error('Refusing empty remote archive');
  for (const file of puzzleFiles) {
    const existing = JSON.parse(await readFile(`puzzles/${file.name}`, base));
    if (existing.issue_no === plan.puzzle.issue_no || existing.date_active === plan.puzzle.date_active || existing.title?.toLowerCase() === plan.puzzle.title.toLowerCase()) throw new Error('Issue, date or title conflicts with current main');
  }
  // A date-named branch is an atomic reservation: two operators cannot create it.
  // Retries resume only if both published files are byte-for-byte identical.
  const existingBranch = await request('GET', `/git/ref/heads/${plan.branch}`, undefined, true);
  if (existingBranch) {
    for (const file of plan.files) if (await readFile(file.path, existingBranch.object.sha) !== file.content) throw new Error('Reserved date branch contains different content');
    const diff = await request('GET', `/compare/${base}...${existingBranch.object.sha}`);
    if (diff.files?.length !== 2 || diff.files.some(file => file.status !== 'added' || !plan.files.some(f => f.path === file.filename))) throw new Error('Existing branch has changes outside the publication policy');
  } else {
    for (const file of plan.files) if (await request('GET', `/contents/${file.path}?ref=${base}`, undefined, true)) throw new Error('Publication path already exists');
  }
  if (!apply) return { status: 'dry_run', base, branch: plan.branch, paths: plan.files.map(f => f.path) };
  if (!existingBranch) {
    const tree = await request('POST', '/git/trees', { base_tree: commit.tree.sha, tree: plan.files.map(file => ({ ...file, mode: '100644', type: 'blob' })) });
    const created = await request('POST', '/git/commits', { message: `feat: add puzzle ${plan.puzzle.issue_no} for ${plan.puzzle.date_active}`, tree: tree.sha, parents: [base] });
    // Never updates an existing ref and never writes main.
    await request('POST', '/git/refs', { ref: `refs/heads/${plan.branch}`, sha: created.sha });
  }
  const prs = await request('GET', `/pulls?state=all&head=rakdcolon:${encodeURIComponent(plan.branch)}&base=main`);
  if (prs.length) return { status: prs[0].state, url: prs[0].html_url, branch: plan.branch };
  const pr = await request('POST', '/pulls', { base: 'main', head: plan.branch, draft: true,
    title: `feat: add puzzle ${plan.puzzle.issue_no} for ${plan.puzzle.date_active}`,
    body: `Reviewed local draft ${draft.id}. Adds only a puzzle and its source/review record.\n\nReview correctness, attribution and date/issue conflicts before merge. CI must pass against current main. This command does not merge, sync Supabase or deploy production.` });
  return { status: 'draft_pr', url: pr.html_url, branch: plan.branch };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [id, ...flags] = process.argv.slice(2);
  let db;
  try {
    if (!/^[a-f0-9]{24}$/.test(id ?? '') || flags.some(f => !['--apply','--reviewed'].includes(f))) throw new Error('Usage: node automation/publisher.mjs <draft-id> [--apply --reviewed]');
    db = openStore();
    const row = db.prepare('SELECT * FROM drafts WHERE id = ?').get(id);
    if (!row) throw new Error('Draft not found');
    const source = db.prepare('SELECT payload FROM sources WHERE id = ?').get(row.source_id);
    if (!source) throw new Error('Source record missing');
    const result = await publishDraft({ id, puzzle: JSON.parse(row.puzzle), review: JSON.parse(row.review), source: JSON.parse(source.payload) }, { apply: flags.includes('--apply'), reviewed: flags.includes('--reviewed'), token: process.env.PUDDLE_PUBLISHER_TOKEN });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { db?.close(); }
}
