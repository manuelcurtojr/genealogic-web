import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/push'

/**
 * POST /api/push/send
 *
 * Envía un push. Autorización:
 *  - `x-service-key = SUPABASE_SERVICE_ROLE_KEY` → puede enviar a cualquiera.
 *  - User autenticado → puede enviarse a SÍ MISMO sin restricción. Para
 *    enviar a otro user, requiere relación verificada (admin platform, o
 *    owner de un kennel donde el destinatario es cliente / dueño de un perro).
 *
 * Antes este endpoint permitía a cualquier user autenticado mandar push
 * arbitrarios a cualquier user_id → spam vector.
 */
export async function POST(request: NextRequest) {
  try {
    const serviceKey = request.headers.get('x-service-key')
    const isServiceCall = serviceKey === process.env.SUPABASE_SERVICE_ROLE_KEY

    let callerId: string | null = null
    if (!isServiceCall) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      callerId = user.id
    }

    const { userId, title, body, data } = await request.json()
    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing userId, title, or body' }, { status: 400 })
    }

    if (!isServiceCall && callerId && callerId !== userId) {
      const admin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const allowed = await callerCanPushTo(admin, callerId, userId)
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden: no relationship to recipient' }, { status: 403 })
      }
    }

    const result = await sendPushToUser(userId, title, body, data)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Push send error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function callerCanPushTo(admin: any, callerId: string, recipientId: string): Promise<boolean> {
  // Caller es admin platform → permitido
  const { data: callerProfile } = await admin
    .from('profiles').select('role').eq('id', callerId).single()
  if (callerProfile?.role === 'admin') return true

  // Caller debe ser dueño de algún kennel
  const { data: kennels } = await admin
    .from('kennels').select('id').eq('owner_id', callerId)
  const kennelIds = (kennels || []).map((k: any) => k.id)
  if (kennelIds.length === 0) return false

  // ¿Destinatario es dueño/contributor de un perro en alguno de esos kennels?
  const { data: dogRel } = await admin
    .from('dogs').select('id').in('kennel_id', kennelIds)
    .or(`owner_id.eq.${recipientId},contributor_id.eq.${recipientId}`)
    .limit(1)
  if (dogRel && dogRel.length > 0) return true

  // ¿Destinatario es owner registrado en alguno de esos kennels (vía email)?
  const { data: recipientProfile } = await admin
    .from('profiles').select('email').eq('id', recipientId).single()
  if (recipientProfile?.email) {
    const { data: ownerRel } = await admin
      .from('owners').select('id').in('kennel_id', kennelIds)
      .eq('email', recipientProfile.email).limit(1)
    if (ownerRel && ownerRel.length > 0) return true
  }

  return false
}
