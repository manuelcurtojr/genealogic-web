import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/update-dog  { dogId, updates }
 *
 * Actualiza un perro con SERVICE-ROLE. Necesario porque RLS de `dogs` solo deja
 * actualizar al dueño (auth.uid() = owner_id): editar un perro sin dueño o de otro
 * (un ancestro/perro criado por TU criadero) devolvía 0 filas SIN error →
 * "Actualizar no actualizaba".
 *
 * AUTORIZACIÓN: el usuario puede editar el perro si es su DUEÑO (owner_id) o su
 * CRIADOR — el dueño del criadero que lo crió (dogs.kennel_id → kennels.owner_id).
 * Así un criador siempre puede mantener los perfiles de los perros que ha criado,
 * aunque ahora pertenezcan a otro o no tengan dueño. Campos en whitelist.
 */
const ALLOWED = [
  'name', 'sex', 'birth_date', 'registration', 'microchip', 'weight', 'height',
  'breed_id', 'color_id', 'kennel_id', 'father_id', 'mother_id', 'is_public',
  'is_reproductive', 'show_in_kennel', // toggles reproductor/visibilidad (corazón + panel)
  'thumbnail_url', // portada — la galería la cambia al reordenar/borrar fotos
] as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const dogId = body?.dogId
    const updates = body?.updates
    if (!dogId || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'dogId y updates requeridos' }, { status: 400 })
    }

    const admin = createKennelAdminClient()
    const { data: dog } = await admin.from('dogs').select('owner_id, kennel_id').eq('id', dogId).maybeSingle()
    if (!dog) return NextResponse.json({ error: 'Perro no encontrado' }, { status: 404 })

    // Autorización: DUEÑO del perro, o CRIADOR (dueño del criadero que lo crió).
    let authorized = dog.owner_id === user.id
    if (!authorized && dog.kennel_id) {
      const { data: k } = await admin.from('kennels').select('owner_id').eq('id', dog.kennel_id).maybeSingle()
      authorized = !!k && k.owner_id === user.id
    }
    if (!authorized) {
      return NextResponse.json({ error: 'Solo el dueño o el criadero que lo crió puede editar este perro' }, { status: 403 })
    }

    // Whitelist: nunca dejamos tocar owner_id, contributor_id, flags admin, etc.
    const clean: Record<string, unknown> = {}
    for (const k of ALLOWED) if (k in updates) clean[k] = updates[k]
    if (Object.keys(clean).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    const { error } = await admin.from('dogs').update(clean).eq('id', dogId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error al actualizar' }, { status: 500 })
  }
}
