import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/dogs/mark-deceased  { dogId }
 *
 * Marca un perro como FALLECIDO (deceased_at = HOY, deceased_locked = true).
 *
 * Acción IRREVERSIBLE por diseño: este endpoint SOLO marca — nunca desmarca — y
 * la fecha la decide el SERVIDOR. Por eso no va por el whitelist general de
 * /api/update-dog (que aceptaría deceased_at arbitrario, incluido null = revertir).
 *
 * Service-role (igual que /api/update-dog) porque RLS de `dogs` solo deja
 * UPDATE al dueño (auth.uid() = owner_id): un perro criado por tu criadero pero
 * SIN dueño (ancestro importado) o de otra cuenta no se podía marcar — el update
 * afectaba 0 filas SIN error.
 *
 * AUTORIZACIÓN: DUEÑO del perro o CRIADOR (dueño del criadero que lo crió).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const dogId = body?.dogId
    if (!dogId) return NextResponse.json({ error: 'dogId requerido' }, { status: 400 })

    const admin = createKennelAdminClient()
    const { data: dog } = await admin
      .from('dogs')
      .select('owner_id, kennel_id, deceased_at')
      .eq('id', dogId)
      .maybeSingle()
    if (!dog) return NextResponse.json({ error: 'Perro no encontrado' }, { status: 404 })

    // Autorización: DUEÑO del perro o CRIADOR (dueño del criadero que lo crió).
    let authorized = dog.owner_id === user.id
    if (!authorized && dog.kennel_id) {
      const { data: k } = await admin.from('kennels').select('owner_id').eq('id', dog.kennel_id).maybeSingle()
      authorized = !!k && k.owner_id === user.id
    }
    if (!authorized) {
      return NextResponse.json({ error: 'Solo el dueño o el criadero que lo crió puede marcarlo como fallecido' }, { status: 403 })
    }

    // Idempotente: si ya está marcado, conservamos la fecha original.
    if (dog.deceased_at) {
      return NextResponse.json({ success: true, deceased_at: dog.deceased_at })
    }

    const today = new Date().toISOString().slice(0, 10)
    const { error } = await admin
      .from('dogs')
      .update({ deceased_at: today, deceased_locked: true })
      .eq('id', dogId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, deceased_at: today })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error al marcar como fallecido' }, { status: 500 })
  }
}
