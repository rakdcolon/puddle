import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { parseAndValidate, applyPuzzleSync, type RawPuzzleFile } from '@/lib/puzzles/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The puzzles/ directory lives at the repo root, outside the Next app, so it is
// not bundled into the deployment. Instead of relying on the filesystem, we
// pull the files straight from the (public) GitHub repo at request time.
const REPO = process.env.PUZZLES_REPO || 'rakdcolon/puddle'
const BRANCH = process.env.PUZZLES_BRANCH || 'main'

function githubHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = { 'User-Agent': 'puddle-sync', Accept: accept }
  // Optional — lifts the unauthenticated rate limit. Not needed for a public repo.
  const token = process.env.GITHUB_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

// Syncs puzzles/ → Supabase. Driven by a Vercel cron (see vercel.json) and also
// hittable on demand with the cron bearer token for an instant sync. Aborts
// before touching the DB if the listing is empty or any file fails to fetch or
// validate, so a partial read can never trigger mass soft-deletes.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get('dry-run') === '1'

  // 1. List puzzles/ — a single GitHub API call.
  const listRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/puzzles?ref=${BRANCH}`,
    { headers: githubHeaders('application/vnd.github+json'), cache: 'no-store' },
  )
  if (!listRes.ok) {
    return NextResponse.json(
      { ok: false, error: `GitHub listing failed (${listRes.status})` },
      { status: 502 },
    )
  }
  const entries = await listRes.json()
  if (!Array.isArray(entries)) {
    return NextResponse.json({ ok: false, error: 'unexpected listing shape' }, { status: 502 })
  }

  const jsonFiles = entries.filter(
    (e: { type?: string; name?: string }) =>
      e.type === 'file' && e.name?.endsWith('.json') && e.name !== 'template.json',
  )
  // Guard: never proceed with an empty set — it would soft-delete everything.
  if (jsonFiles.length === 0) {
    return NextResponse.json({ ok: false, error: 'no puzzle files found' }, { status: 502 })
  }

  // 2. Fetch each file's raw contents (raw.githubusercontent.com — a CDN, not
  //    subject to the API rate limit).
  const files: RawPuzzleFile[] = []
  for (const f of jsonFiles as { name: string; download_url: string }[]) {
    const res = await fetch(f.download_url, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `fetch ${f.name} failed (${res.status})` },
        { status: 502 },
      )
    }
    files.push({ name: f.name, content: await res.text() })
  }

  // 3. Validate — refuse to touch the DB if anything is malformed.
  const { puzzles, errors } = parseAndValidate(files)
  if (errors.length) {
    return NextResponse.json({ ok: false, errors }, { status: 422 })
  }

  // 4. Apply.
  try {
    const db = createServiceClient()
    const summary = await applyPuzzleSync(db, puzzles, { dryRun })
    return NextResponse.json({ ok: true, dryRun, ...summary })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'sync failed' },
      { status: 500 },
    )
  }
}
