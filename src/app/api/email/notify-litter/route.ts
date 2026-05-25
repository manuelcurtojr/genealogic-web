/**
 * POST /api/email/notify-litter
 * Body: { litterId: string }
 *
 * Llamado desde el cliente cuando se crea una camada o cambia su status
 * a 'born'. Notifica a la lista de espera del kennel.
 *
 * Solo el owner del kennel (vía RLS check manual) puede dispararlo.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyWaitlistOfNewLitter } from '@/lib/email/notify-litter'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { litterId } = (await req.json().catch(() => ({}))) as { litterId?: string }
  if (!litterId) return NextResponse.json({ error: 'litterId_required' }, { status: 400 })

  // Verificar que el user es owner de la camada
  const { data: litter } = await supabase
    .from('litters')
    .select('owner_id')
    .eq('id', litterId)
    .single()
  if (!litter || litter.owner_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Disparar async (no esperamos a que termine — pueden ser muchos emails)
  notifyWaitlistOfNewLitter(litterId).catch((err) =>
    console.error('[notify-litter]', err),
  )

  return NextResponse.json({ ok: true })
}
