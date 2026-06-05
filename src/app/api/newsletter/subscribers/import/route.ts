import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { userHasAddon } from '@/lib/kennel/addons-server'

/**
 * POST /api/newsletter/subscribers/import
 * Bulk-insert emails al newsletter. Ignora duplicados silenciosamente.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'newsletter'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Newsletter' }, { status: 403 })
  }

  const body = await request.json()
  const { kennel_id, emails } = body
  if (!kennel_id || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: 'kennel_id y emails (array) son obligatorios' }, { status: 400 })
  }
  if (emails.length > 5000) {
    return NextResponse.json({ error: 'Máximo 5000 emails por import' }, { status: 400 })
  }

  // Validar y normalizar
  const valid = Array.from(new Set(
    emails
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  ))

  // Obtener emails ya existentes para skip
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .eq('kennel_id', kennel_id)
    .in('email', valid)
  const existingSet = new Set((existing || []).map(r => r.email))
  const toInsert = valid.filter(e => !existingSet.has(e))

  if (toInsert.length === 0) {
    return NextResponse.json({ created: [], skipped: valid.length })
  }

  const rows = toInsert.map(email => ({
    kennel_id, email, source: 'import', is_active: true,
  }))

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert(rows)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    created: data || [],
    skipped: valid.length - (data?.length || 0),
    invalid_count: emails.length - valid.length,
  })
}
