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

// A hung GitHub request would otherwise stall the whole cron invocation. Bound
// every fetch so a slow/unresponsive upstream fails fast (AbortError) instead.
async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 10000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
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
  let listRes: Response
  try {
    listRes = await fetchWithTimeout(
      `https://api.github.com/repos/${REPO}/contents/puzzles?ref=${BRANCH}`,
      { headers: githubHeaders('application/vnd.github+json'), cache: 'no-store' },
    )
  } catch {
    return NextResponse.json({ ok: false, error: 'GitHub listing timed out' }, { status: 504 })
  }
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

  // 2. Fetch each file's raw contents in parallel (raw.githubusercontent.com —
  //    a CDN, not subject to the API rate limit). Promise.all rejects on the
  //    first failure, preserving the abort-on-any-error guarantee.
  let files: RawPuzzleFile[]
  try {
    files = await Promise.all(
      (jsonFiles as { name: string; download_url: string }[]).map(async f => {
        const res = await fetchWithTimeout(f.download_url, { cache: 'no-store' })
        if (!res.ok) throw new Error(`fetch ${f.name} failed (${res.status})`)
        return { name: f.name, content: await res.text() }
      }),
    )
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'fetch failed' },
      { status: 502 },
    )
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
