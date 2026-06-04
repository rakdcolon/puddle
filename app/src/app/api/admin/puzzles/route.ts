import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'

async function checkAdmin() {
  const user = await getCurrentUser()
  return user?.is_admin ? user : null
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('puzzles')
    .insert({
      issue_no: body.issue_no,
      vol: body.vol,
      date_active: body.date_active,
      title: body.title,
      genre: body.genre,
      difficulty: body.difficulty,
      prompt: body.prompt,
      answer: body.answer,
      answer_display: body.answer_display,
      hints: body.hints,
      solution_lede: body.solution_lede,
      solution_steps: body.solution_steps,
      input_type: body.input_type,
      input_config: body.input_config,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
