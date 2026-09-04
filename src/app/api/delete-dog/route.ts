import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/delete-dog  { dogId }
 *
 * Elimina un perro SOLO si NO tiene descendencia (ningún perro lo referencia
 * como father_id/mother_id, ni ninguna camada como padre/madre). Borrar un perro
 * con hijos rompería el árbol genealógico, así que se bloquea con un mensaje
 * claro.
 *
 * AUTORIZACIÓN (igual que /api/update-dog): DUEÑO del perro (owner_id) o CRIADOR
 * (dueño del criadero que lo crió, dogs.kennel_id → kennels.owner_id).
 *
 * Escrituras con service-role: RLS de `dogs` solo deja borrar al dueño, pero un
 * perro criado por tu criadero puede no tener owner_id. La auth se valida arriba.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const dogId = body?.dogId
    if (!dogId || typeof dogId !== 'string') {
      return NextResponse.json({ error: 'dogId requerido' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: dog } = await admin.from('dogs').select('id, name, owner_id, kennel_id').eq('id', dogId).maybeSingle()
    if (!dog) return NextResponse.json({ error: 'Perro no encontrado' }, { status: 404 })

    // Autorización: dueño o criador (dueño del criadero que lo crió).
    let authorized = dog.owner_id === user.id
    if (!authorized && dog.kennel_id) {
      const { data: k } = await admin.from('kennels').select('owner_id').eq('id', dog.kennel_id).maybeSingle()
      authorized = !!k && k.owner_id === user.id
    }
    if (!authorized) {
      return NextResponse.json({ error: 'Solo el dueño o el criadero que lo crió puede eliminar este perro' }, { status: 403 })
    }

    // ─── Bloqueo por DESCENDENCIA ───────────────────────────────────────────
    const [{ count: asFather }, { count: asMother }] = await Promise.all([
      admin.from('dogs').select('id', { count: 'exact', head: true }).eq('father_id', dogId),
      admin.from('dogs').select('id', { count: 'exact', head: true }).eq('mother_id', dogId),
    ])
    let litterRefs = 0
    try {
      const { count } = await admin.from('litters').select('id', { count: 'exact', head: true })
        .or(`father_id.eq.${dogId},mother_id.eq.${dogId}`)
      litterRefs = count || 0
    } catch { /* tabla litters puede no aplicar */ }

    const descendants = (asFather || 0) + (asMother || 0) + litterRefs
    if (descendants > 0) {
      return NextResponse.json({
        error: 'No se puede eliminar: este perro tiene descendencia registrada. Solo puedes eliminar perros sin hijos en el árbol.',
        code: 'has_descendants',
      }, { status: 409 })
    }

    // ─── Limpieza de dependencias (best-effort) antes de borrar ─────────────
    // Datos que cuelgan del perro y no bloquean el árbol. Cada uno aislado para
    // que una tabla ausente/opcional no impida el borrado.
    for (const table of ['dog_photos', 'vet_records', 'awards', 'dog_measurements']) {
      try { await admin.from(table).delete().eq('dog_id', dogId) } catch { /* opcional */ }
    }
    try { await admin.from('kennel_breed_hero').delete().eq('dog_id', dogId) } catch { /* opcional */ }
    // Reservas con este perro asignado → desvincular (no borrar la reserva).
    try { await admin.from('puppy_reservations').update({ dog_id: null }).eq('dog_id', dogId) } catch { /* opcional */ }

    const { error } = await admin.from('dogs').delete().eq('id', dogId)
    if (error) {
      // FK inesperada u otra restricción → mensaje legible en vez de 500 opaco.
      return NextResponse.json({
        error: 'No se pudo eliminar el perro porque está referenciado en otros datos. ' + error.message,
      }, { status: 409 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 500 })
  }
}
