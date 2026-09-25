import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { environmentName } from '@/lib/environment.mjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error } = await createServiceClient().from('puzzles').select('id').limit(1)
    if (error) throw error
    return NextResponse.json({ status: 'ok', environment: environmentName() }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
