// Use the publication's date-only value, never the machine's local timezone.
export function calendarEdition(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid publication date');
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error('Invalid publication date');
  const year = Number(date.slice(0, 4));
  const start = new Date(`${date.slice(0, 4)}-01-01T00:00:00Z`);
  return { vol: year % 100, issue_no: 1 + Math.round((parsed - start) / 86400000) };
}

export function assertCalendarEdition(puzzle) {
  const expected = calendarEdition(puzzle.date_active);
  if (puzzle.vol !== expected.vol || puzzle.issue_no !== expected.issue_no) {
    throw new Error(`Publication date ${puzzle.date_active} requires Vol. ${String(expected.vol).padStart(2, '0')} No. ${expected.issue_no}`);
  }
}
