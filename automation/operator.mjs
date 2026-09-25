// Operator-only commands. This module is never registered as an agent tool.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, archive, openStore, validatePuzzle } from './core.mjs';
import { assertCalendarEdition } from '../app/src/lib/puzzles/numbering.mjs';

const [command, id] = process.argv.slice(2);
const db = openStore();
try {
  if (command === 'list') {
    console.log(JSON.stringify(db.prepare('SELECT id,issue_no,date_active,source_id,created_at FROM drafts ORDER BY date_active').all(),null,2));
  } else if (['show','export'].includes(command)) {
    if (!/^[a-f0-9]{24}$/.test(id ?? '')) throw new Error('Provide a draft ID from list');
    const row = db.prepare('SELECT * FROM drafts WHERE id = ?').get(id);
    if (!row) throw new Error('Draft not found');
    const source = JSON.parse(db.prepare('SELECT payload FROM sources WHERE id = ?').get(row.source_id).payload);
    const puzzle = validatePuzzle(JSON.parse(row.puzzle));
    const review = JSON.parse(row.review);
    if (command === 'show') console.log(JSON.stringify({id,puzzle,review,source},null,2));
    else {
      assertCalendarEdition(puzzle);
      if (process.argv[4] !== '--reviewed') throw new Error('Review with show first; export requires --reviewed');
      const target = join(ROOT,'puzzles',`${puzzle.date_active}-agent.json`);
      const content = JSON.stringify(puzzle,null,2)+'\n';
      // Exact retries are harmless; never overwrite a different file or collide with an issue/date.
      if (existsSync(target)) {
        if (readFileSync(target,'utf8') !== content) throw new Error('Export destination already exists with different content');
      } else {
        if (archive().some(p => p.date_active === puzzle.date_active)) throw new Error('Date now conflicts with archive');
        const today = new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
        if (puzzle.date_active <= today) throw new Error('Draft date has passed; prepare a newly scheduled draft');
        // Preserve provenance in the repository, not just the ignored local database.
        const provenanceDir = join(ROOT,'puzzles','provenance');
        mkdirSync(provenanceDir,{recursive:true});
        const provenance = join(provenanceDir,`${puzzle.date_active}.json`);
        const metadata = JSON.stringify({draft_id:id,review,source},null,2)+'\n';
        if (existsSync(provenance) && readFileSync(provenance,'utf8') !== metadata) throw new Error('Provenance already exists with different content');
        if (!existsSync(provenance)) writeFileSync(provenance,metadata,{flag:'wx'});
        writeFileSync(target,content,{flag:'wx'});
      }
      console.log(`Exported ${target}. Review the diff, commit on a branch, and open a PR. Nothing was pushed or synced.`);
    }
  } else {
    throw new Error('Usage: node automation/operator.mjs list | show <id> | export <id> --reviewed');
  }
} catch (error) {
  console.error(error.message); process.exitCode = 1;
} finally { db.close(); }
