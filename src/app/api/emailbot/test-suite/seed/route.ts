/**
 * POST /api/emailbot/test-suite/seed
 *
 * Body: { kennel_id }
 *
 * Si el kennel NO tiene perfiles todavía, siembra los 16 perfiles default.
 * Si ya tiene perfiles, no-op (devuelve count actual).
 *
 * Si force=true en query, borra los existentes y resiembra (reset a defaults).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { TEST_PROFILES_SEED } from '@/lib/ai/test-profiles-seed'
import { userHasAddon } from '@/lib/kennel/addons-server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'emailbot'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Emailbot' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { kennel_id } = body
  if (!kennel_id) return NextResponse.json({ error: 'kennel_id requerido' }, { status: 400 })

  const force = new URL(request.url).searchParams.get('force') === 'true'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: kennel } = await admin
    .from('kennels').select('id, owner_id').eq('id', kennel_id).maybeSingle()
  if (!kennel) return NextResponse.json({ error: 'kennel_not_found' }, { status: 404 })
  if (kennel.owner_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  if (force) {
    await admin.from('emailbot_test_profiles').delete().eq('kennel_id', kennel_id)
  }

  const { count } = await admin
    .from('emailbot_test_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('kennel_id', kennel_id)

  if ((count || 0) > 0) {
    return NextResponse.json({ ok: true, seeded: 0, total: count, action: 'no_op' })
  }

  const rows = TEST_PROFILES_SEED.map((p) => ({
    kennel_id,
    name: p.name,
    persona_description: p.persona_description,
    goal: p.goal,
    opening_message: p.opening_message,
    expected_outcome: p.expected_outcome,
    category: p.category,
    initial_scenario: p.initial_scenario,
    is_active: true,
  }))

  const { error } = await admin.from('emailbot_test_profiles').insert(rows)
  if (error) {
    return NextResponse.json({ error: `seed_failed: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    seeded: rows.length,
    total: rows.length,
    action: 'seeded',
  })
}
