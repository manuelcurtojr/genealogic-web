import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ImportDog {
  name: string; sex: string; registration: string | null; breed: string | null
  color: string | null; birth_date: string | null; health: string | null
  photo_url: string | null; father_name: string | null; mother_name: string | null
  generation?: number
}

export const maxDuration = 60

/**
 * Normaliza una fecha extraída a un DATE válido de Postgres (YYYY-MM-DD) o null.
 * El INSERT falla si llega "1995" o "1995-03" o basura ("circa 1990"), así que
 * lo saneamos: año→01-01, año-mes→día 01, ISO completo se valida, y DD/MM/YYYY
 * (por si la IA no respetó el formato) se reordena. Cualquier otra cosa → null.
 */
function toPgDate(s: string | null | undefined): string | null {
  if (!s || typeof s !== 'string') return null
  const v = s.trim()
  let y: number, mo: number, d: number
  if (/^\d{4}$/.test(v)) { y = +v; mo = 1; d = 1 }
  else if (/^\d{4}[-./]\d{2}$/.test(v)) { y = +v.slice(0, 4); mo = +v.slice(5, 7); d = 1 }
  else if (/^\d{4}[-./]\d{2}[-./]\d{2}$/.test(v)) { y = +v.slice(0, 4); mo = +v.slice(5, 7); d = +v.slice(8, 10) }
  else {
    // Fallback DD/MM/YYYY (por si la IA no respetó el ISO; fuentes ES/EU = día primero).
    const m = v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/)
    if (!m) return null
    d = +m[1]; mo = +m[2]; y = +m[3]
  }
  // Validación de CALENDARIO real (días por mes + bisiesto). `new Date()` no sirve:
  // redondea (2023-02-30 → marzo) en vez de fallar, y Postgres rechazaría la fecha
  // rota tirando el INSERT entero. Lo que no sea válido → null (campo vacío, no error).
  if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) return null
  if (y < 1 || y > 9999 || mo < 1 || mo > 12 || d < 1) return null
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)
  const dim = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (d > dim[mo - 1]) return null
  return `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// POST: Confirm import
export async function POST(request: NextRequest) {
  const createdIds: string[] = [] // declarado fuera del try para poder limpiar en catch
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    // Las escrituras van con SERVICE-ROLE: la importación crea ancestros PÚBLICOS
    // sin dueño (owner_id null) y RLS solo deja a un usuario crear/borrar perros
    // con owner_id = él mismo. La auth ya está verificada arriba y todo se sigue
    // scopeando a `user.id` (safeUserId), así que es seguro.
    const admin = createKennelAdminClient()

    const { mainDog, ancestors, userId, kennelId, swaps, importPhotos, isAdmin, overrideBreed } = await request.json()
    if (!mainDog) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    // Ensure userId matches authenticated user
    const safeUserId = user.id
    const [breedsRes, colorsRes] = await Promise.all([
      admin.from('breeds').select('id, name'),
      admin.from('colors').select('id, name'),
    ])
    const breeds = breedsRes.data || []
    const colors = colorsRes.data || []
    const findBreed = (name: string | null) => { if (!name) return null; return breeds.find(b => b.name.toLowerCase() === name.toLowerCase())?.id || null }
    const findColor = (name: string | null) => { if (!name) return null; return colors.find(c => c.name.toLowerCase() === name.toLowerCase())?.id || null }

    const lowerWords = new Set(['de', 'del', 'of', 'von', 'du', 'vom', 'y', 'the', 'and', 'las', 'los', 'la', 'el'])
    function titleCase(name: string): string {
      return name.split(' ').map((w, i) => {
        const lower = w.toLowerCase()
        if (i > 0 && lowerWords.has(lower)) return lower
        if (w.includes("'")) return w.split("'").map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("'")
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      }).join(' ')
    }
    const formatName = (name: string) => name === name.toUpperCase() && name.length > 3 ? titleCase(name) : name

    // Merge swaps
    const swapMap = new Map<string, string>()
    if (swaps) { for (const [name, data] of Object.entries(swaps)) { if ((data as any)?.id) swapMap.set(name, (data as any).id) } }

    // All dogs sorted by generation desc
    const allDogs: ImportDog[] = [
      ...(ancestors || []).sort((a: any, b: any) => (b.generation || 0) - (a.generation || 0)),
      { ...mainDog, generation: 0 },
    ]

    const nameToId = new Map<string, string>()
    for (const [name, id] of swapMap) nameToId.set(name, id)

    // Dedup: enlaza con perros que el usuario ya posee (mismo nombre) o por nº de
    // registro. (Había un check por contributor_id pero esa columna se eliminó con
    // el sistema de contribuciones —migración 20260430— y rompía esta query.)
    for (const dog of allDogs) {
      if (nameToId.has(dog.name)) continue
      const { data: owned } = await admin.from('dogs').select('id').eq('owner_id', safeUserId).ilike('name', dog.name).limit(1)
      if (owned?.length) { nameToId.set(dog.name, owned[0].id); continue }
      if (dog.registration) {
        // Solo enlaza con perros PÚBLICOS por registro (admin ve todos; no queremos
        // enlazar con un perro privado de otro usuario que coincida en nº de registro).
        const { data: regMatch } = await admin.from('dogs').select('id').eq('registration', dog.registration).eq('is_public', true).limit(1)
        if (regMatch?.length) nameToId.set(dog.name, regMatch[0].id)
      }
    }

    // Create bottom-up (createdIds declarado al inicio de POST para limpiar en catch)
    for (const dog of allDogs) {
      if (nameToId.has(dog.name)) continue
      const fatherId = dog.father_name ? nameToId.get(dog.father_name) || null : null
      const motherId = dog.mother_name ? nameToId.get(dog.mother_name) || null : null
      const parsedDate = toPgDate(dog.birth_date)

      const isMainDog = dog.generation === 0
      // El override del usuario MANDA para el perro principal (lo eligió a mano
      // para corregir la raza); el resto usa su propia raza y, si no tiene,
      // hereda el override o la raza del principal.
      const breedName = (isMainDog && overrideBreed) ? overrideBreed : (dog.breed || overrideBreed || mainDog.breed)
      // NOTA: ya NO insertamos contributor_id — esa columna se eliminó (migración
      // 20260430, sistema de contribuciones retirado) y al mandarla PostgREST
      // rechazaba el INSERT de CADA ancestro → se importaba solo el perro
      // principal y se perdía toda la genealogía. Los ancestros quedan como perros
      // públicos sin dueño (owner_id null, is_public true).
      const { data: created, error: createErr } = await admin.from('dogs').insert({
        name: formatName(dog.name), sex: dog.sex === 'Female' ? 'female' : 'male',
        registration: dog.registration || null, breed_id: findBreed(breedName), color_id: findColor(dog.color),
        birth_date: parsedDate, father_id: fatherId, mother_id: motherId,
        kennel_id: (isMainDog && !isAdmin) ? (kennelId || null) : null,
        owner_id: (isMainDog && !isAdmin) ? safeUserId : null,
        is_public: true,
        thumbnail_url: importPhotos !== false ? (dog.photo_url || null) : null,
      }).select('id').single()
      // Log si un INSERT falla (antes era silencioso → perros perdidos sin rastro).
      if (createErr) console.error('[confirm-import] no se pudo crear el perro', dog.name, '—', createErr.message)

      if (created) { nameToId.set(dog.name, created.id); createdIds.push(created.id) }
    }

    // Enrich existing dogs — only fill empty fields, never overwrite
    for (const dog of allDogs) {
      const dogId = nameToId.get(dog.name)
      if (!dogId || createdIds.includes(dogId)) continue
      const { data: existing } = await admin.from('dogs').select('father_id, mother_id, registration, breed_id, color_id, birth_date').eq('id', dogId).single()
      if (!existing) continue
      const updates: any = {}
      if (!existing.father_id && dog.father_name && nameToId.has(dog.father_name)) updates.father_id = nameToId.get(dog.father_name)
      if (!existing.mother_id && dog.mother_name && nameToId.has(dog.mother_name)) updates.mother_id = nameToId.get(dog.mother_name)
      if (!existing.registration && dog.registration) updates.registration = dog.registration
      if (!existing.breed_id && dog.breed) updates.breed_id = findBreed(dog.breed)
      if (!existing.color_id && dog.color) updates.color_id = findColor(dog.color)
      if (!existing.birth_date) {
        const pd = toPgDate(dog.birth_date)
        if (pd) updates.birth_date = pd
      }
      if (Object.keys(updates).length > 0) await admin.from('dogs').update(updates).eq('id', dogId)
    }

    const mainDogId = nameToId.get(mainDog.name)
    // El perro principal SIEMPRE debe existir. Si no se creó (dato inválido,
    // constraint…), limpiamos los ancestros ya creados para no dejar huérfanos
    // y avisamos, en vez de devolver un "éxito" sin perro principal.
    if (!mainDogId) {
      if (createdIds.length) { try { await admin.from('dogs').delete().in('id', createdIds) } catch {} }
      return NextResponse.json({ error: 'No se pudo crear el perro principal. Revisa que los datos sean válidos e inténtalo de nuevo.' }, { status: 500 })
    }
    const importId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Registro de import + push: NO deben tumbar un import ya exitoso. Si fallan,
    // el import sigue siendo válido (solo se pierde la red de "deshacer"/aviso).
    try {
      const notifTitle = `Genealogía importada: ${mainDog.name}`
      await admin.from('notifications').insert({
        user_id: safeUserId, type: 'import',
        title: notifTitle,
        message: JSON.stringify({ importId, createdIds, mainDogId }),
        is_read: false,
      })
      const { sendPushToUser } = await import('@/lib/push')
      await sendPushToUser(safeUserId, notifTitle, `Se han importado ${createdIds.length} perros`, { link: `/dogs/${mainDogId}` })
    } catch (notifErr) {
      console.error('[confirm-import] notificación/push falló (el import sí se completó):', notifErr)
    }

    return NextResponse.json({ success: true, mainDogId, totalCreated: createdIds.length, totalLinked: nameToId.size - createdIds.length, importId })
  } catch (err: any) {
    // Limpieza: si algo lanzó a mitad de la creación, borra los perros ya creados
    // para no dejar huérfanos sin registro de import (no se podrían deshacer).
    if (createdIds.length) {
      try { await createKennelAdminClient().from('dogs').delete().in('id', createdIds) } catch {}
    }
    return NextResponse.json({ error: err.message || 'Error al importar' }, { status: 500 })
  }
}

// DELETE: Undo import (with safety checks)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    // Service-role para borrar: los ancestros importados son públicos sin dueño y
    // RLS solo deja borrar perros con owner_id = el usuario. Todo se sigue
    // validando contra safeUserId + las comprobaciones de seguridad de abajo.
    const admin = createKennelAdminClient()

    const { importId } = await request.json()
    if (!importId) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    const safeUserId = authUser.id
    const { data: notifs } = await admin.from('notifications').select('id, message, created_at').eq('user_id', safeUserId).eq('type', 'import').order('created_at', { ascending: false }).limit(50)

    let createdIds: string[] = []
    let notifId: string | null = null
    let createdAt: string | null = null
    for (const n of (notifs || [])) {
      try {
        const p = JSON.parse(n.message)
        if (p.importId === importId) { createdIds = p.createdIds || []; notifId = n.id; createdAt = n.created_at; break }
      } catch {}
    }

    if (createdIds.length === 0) return NextResponse.json({ error: 'Importacion no encontrada' }, { status: 404 })

    // Sanitize: los ids vienen de un blob JSON de notifications, así que validamos
    // estricto a UUID antes de interpolar en .not('id','in', `(${ids.join(',')})`)
    // y `.or('father_id.eq.${id},mother_id.eq.${id}')`. Si alguien ha logrado meter
    // basura en el blob, lo descartamos en vez de romper la query.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    createdIds = createdIds.filter(x => typeof x === 'string' && UUID_RE.test(x))
    if (createdIds.length === 0) return NextResponse.json({ error: 'Importacion sin ids válidos' }, { status: 400 })

    // Safety: 24h window
    if (createdAt) {
      const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
      if (hoursAgo > 24) return NextResponse.json({ error: 'Solo se puede deshacer en las primeras 24 horas' }, { status: 400 })
    }

    const createdSet = new Set(createdIds)
    const deletable: string[] = []
    const skippedNames: string[] = []

    // Safety: check each dog for external references before deleting
    for (const id of createdIds) {
      let blocked = false
      const { data: dog } = await admin.from('dogs').select('name').eq('id', id).single()
      const dogName = dog?.name || id

      // Check if other users' dogs reference this as parent
      const { count: extFather } = await admin.from('dogs').select('id', { count: 'exact', head: true })
        .eq('father_id', id).not('owner_id', 'eq', safeUserId)
        .not('id', 'in', `(${createdIds.join(',')})`)
      if (extFather && extFather > 0) blocked = true

      if (!blocked) {
        const { count: extMother } = await admin.from('dogs').select('id', { count: 'exact', head: true })
          .eq('mother_id', id).not('owner_id', 'eq', safeUserId)
          .not('id', 'in', `(${createdIds.join(',')})`)
        if (extMother && extMother > 0) blocked = true
      }

      // Check litter references
      if (!blocked) {
        const { count: litterRef } = await admin.from('litters').select('id', { count: 'exact', head: true })
          .or(`father_id.eq.${id},mother_id.eq.${id}`)
        if (litterRef && litterRef > 0) blocked = true
      }

      if (blocked) { skippedNames.push(dogName) }
      else { deletable.push(id) }
    }

    // Unlink parent refs within this import batch for deletable dogs
    for (const id of deletable) {
      await admin.from('dogs').update({ father_id: null }).eq('father_id', id).not('id', 'in', `(${deletable.join(',')})`)
      await admin.from('dogs').update({ mother_id: null }).eq('mother_id', id).not('id', 'in', `(${deletable.join(',')})`)
    }

    // Delete related data and dogs
    for (const id of deletable) {
      await admin.from('dog_photos').delete().eq('dog_id', id)
      await admin.from('vet_records').delete().eq('dog_id', id)
      await admin.from('awards').delete().eq('dog_id', id)
      await admin.from('dogs').delete().eq('id', id)
    }

    // Update or delete notification
    if (skippedNames.length === 0 && notifId) {
      await admin.from('notifications').delete().eq('id', notifId)
    } else if (notifId) {
      // Update notification to reflect remaining dogs
      const remaining = createdIds.filter(id => !deletable.includes(id))
      await admin.from('notifications').update({
        message: JSON.stringify({ importId, createdIds: remaining, mainDogId: remaining[0] || null }),
      }).eq('id', notifId)
    }

    return NextResponse.json({ success: true, deletedCount: deletable.length, skippedCount: skippedNames.length, skippedNames })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al deshacer' }, { status: 500 })
  }
}
