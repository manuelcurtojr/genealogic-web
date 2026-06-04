import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/update-dog  { dogId, updates }
 *
 * Actualiza un perro con SERVICE-ROLE. Necesario porque RLS de `dogs` solo deja
 * actualizar al dueño (auth.uid() = owner_id): editar un ANCESTRO importado
 * (owner_id null) desde el panel devolvía 0 filas SIN error → "Actualizar no
 * actualizaba". Autorización: el usuario puede editar SUS perros o perros PÚBLICOS
 * sin dueño (ancestros/contribuciones del grafo público). Campos en whitelist.
 */
const ALLOWED = [
  'name', 'sex', 'birth_date', 'registration', 'microchip', 'weight', 'height',
  'breed_id', 'color_id', 'kennel_id', 'father_id', 'mother_id', 'is_public',
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
    const { data: dog } = await admin.from('dogs').select('owner_id').eq('id', dogId).maybeSingle()
    if (!dog) return NextResponse.json({ error: 'Perro no encontrado' }, { status: 404 })

    // Autorización: dueño, o perro público sin dueño (ancestro del grafo).
    if (dog.owner_id && dog.owner_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para editar este perro' }, { status: 403 })
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
