-- Publication date remains the unique sync key. Preserve puzzle UUIDs and solves.
ALTER TABLE public.puzzles DROP CONSTRAINT puzzles_issue_no_key;
UPDATE public.puzzles
SET vol = EXTRACT(YEAR FROM date_active)::int % 100,
    issue_no = EXTRACT(DOY FROM date_active)::int;
ALTER TABLE public.puzzles ADD CONSTRAINT puzzles_calendar_edition_check CHECK (
  vol = EXTRACT(YEAR FROM date_active)::int % 100
  AND issue_no = EXTRACT(DOY FROM date_active)::int
);
