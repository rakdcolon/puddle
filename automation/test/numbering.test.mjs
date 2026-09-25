import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarEdition, assertCalendarEdition } from '../../app/src/lib/puzzles/numbering.mjs';

test('calendar editions handle year rollover, leap day and year 00', () => {
  for (const [date, vol, issue_no] of [['2026-09-28',26,271],['2026-01-01',26,1],['2026-12-31',26,365],['2027-01-01',27,1],['2028-02-29',28,60],['2028-12-31',28,366],['2000-01-01',0,1]]) {
    assert.deepEqual(calendarEdition(date), {vol, issue_no});
  }
  for (const invalid of ['2026-02-29','2026-04-31','2026-1-1','2026-01-01T23:00:00Z',null]) assert.throws(()=>calendarEdition(invalid));
  assert.throws(()=>assertCalendarEdition({date_active:'2026-09-28',vol:2,issue_no:26}), /Vol. 26 No. 271/);
});
