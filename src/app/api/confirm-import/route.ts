import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ImportDog {
  name: string; sex: string; registration: string | null; breed: string | null
  color: string | null; birth_date: string | null; health: string | null
  photo_url: string | null; father_name: string | null; mother_name: string | null
  generation?: number
}

export const maxDuration = 60

// POST: Confirm import
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { mainDog, ancestors, userId, kennelId, swaps, importPhotos, isAdmin, overrideBreed } = await request.json()
    if (!mainDog) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    // Ensure userId matches authenticated user
    const safeUserId = user.id
    const [breedsRes, colorsRes] = await Promise.all([
      supabase.from('breeds').select('id, name'),
      supabase.from('colors').select('id, name'),
    ])
    const breeds = breedsRes.data || []
    const colors = colorsRes.data || []
    const findBreed = (name: string | null) => { if (!name) return null; return breeds.find(b => b.name.toLowerCase() === name.toLowerCase())?.id || null }
    const findColor = (name: string | null) => { if (!name) return null; return colors.find(c => c.name.toLowerCase() === name.toLowerCase())?.id || null }

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

    // Duplicate detection (check both owned and contributed dogs)
    for (const dog of allDogs) {
      if (nameToId.has(dog.name)) continue
      const { data: owned } = await supabase.from('dogs').select('id').eq('owner_id', safeUserId).ilike('name', dog.name).limit(1)
      if (owned?.length) { nameToId.set(dog.name, owned[0].id); continue }
      const { data: contributed } = await supabase.from('dogs').select('id').eq('contributor_id', safeUserId).ilike('name', dog.name).limit(1)
      if (contributed?.length) { nameToId.set(dog.name, contributed[0].id); continue }
      if (dog.registration) {
        const { data: regMatch } = await supabase.from('dogs').select('id').eq('registration', dog.registration).limit(1)
        if (regMatch?.length) nameToId.set(dog.name, regMatch[0].id)
      }
    }

    const createdIds: string[] = []

    // Create bottom-up
    for (const dog of allDogs) {
      if (nameToId.has(dog.name)) continue
      const fatherId = dog.father_name ? nameToId.get(dog.father_name) || null : null
      const motherId = dog.mother_name ? nameToId.get(dog.mother_name) || null : null
      const parsedDate = dog.birth_date && dog.birth_date.length >= 4 ? (dog.birth_date.length === 4 ? `${dog.birth_date}-01-01` : dog.birth_date) : null

      const isMainDog = dog.generation === 0
      // Use dog's own breed, fall back to overrideBreed or main dog's breed
      const breedName = dog.breed || overrideBreed || mainDog.breed
      const { data: created } = await supabase.from('dogs').insert({
        name: dog.name, sex: dog.sex === 'Female' ? 'female' : 'male',
        registration: dog.registration || null, breed_id: findBreed(breedName), color_id: findColor(dog.color),
        birth_date: parsedDate, father_id: fatherId, mother_id: motherId,
        kennel_id: (isMainDog && !isAdmin) ? (kennelId || null) : null,
        owner_id: (isMainDog && !isAdmin) ? safeUserId : null,
        contributor_id: (isMainDog && !isAdmin) ? undefined : safeUserId,
        is_public: false,
        thumbnail_url: importPhotos !== false ? (dog.photo_url || null) : null,
      }).select('id').single()

      if (created) { nameToId.set(dog.name, created.id); createdIds.push(created.id) }
    }

    // Enrich existing dogs — only fill empty fields, never overwrite
    for (const dog of allDogs) {
      const dogId = nameToId.get(dog.name)
      if (!dogId || createdIds.includes(dogId)) continue
      const { data: existing } = await supabase.from('dogs').select('father_id, mother_id, registration, breed_id, color_id, birth_date').eq('id', dogId).single()
      if (!existing) continue
      const updates: any = {}
      if (!existing.father_id && dog.father_name && nameToId.has(dog.father_name)) updates.father_id = nameToId.get(dog.father_name)
      if (!existing.mother_id && dog.mother_name && nameToId.has(dog.mother_name)) updates.mother_id = nameToId.get(dog.mother_name)
      if (!existing.registration && dog.registration) updates.registration = dog.registration
      if (!existing.breed_id && dog.breed) updates.breed_id = findBreed(dog.breed)
      if (!existing.color_id && dog.color) updates.color_id = findColor(dog.color)
      if (!existing.birth_date && dog.birth_date) {
        const pd = dog.birth_date.length === 4 ? `${dog.birth_date}-01-01` : dog.birth_date
        updates.birth_date = pd
      }
      if (Object.keys(updates).length > 0) await supabase.from('dogs').update(updates).eq('id', dogId)
    }

    const mainDogId = nameToId.get(mainDog.name)
    const importId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Save import record
    const notifTitle = `Pedigrí importado: ${mainDog.name}`
    await supabase.from('notifications').insert({
      user_id: safeUserId, type: 'import',
      title: notifTitle,
      message: JSON.stringify({ importId, createdIds, mainDogId }),
      is_read: false,
    })

    // Send push notification
    const { sendPushToUser } = await import('@/lib/push')
    await sendPushToUser(safeUserId, notifTitle, `Se han importado ${createdIds.length} perros`, { link: `/dogs/${mainDogId}` })

    return NextResponse.json({ success: true, mainDogId, totalCreated: createdIds.length, totalLinked: nameToId.size - createdIds.length, importId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al importar' }, { status: 500 })
  }
}

// DELETE: Undo import (with safety checks)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { importId } = await request.json()
    if (!importId) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    const safeUserId = authUser.id
    const { data: notifs } = await supabase.from('notifications').select('id, message, created_at').eq('user_id', safeUserId).eq('type', 'import').order('created_at', { ascending: false }).limit(50)

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
      const { data: dog } = await supabase.from('dogs').select('name').eq('id', id).single()
      const dogName = dog?.name || id

      // Check if other users' dogs reference this as parent
      const { count: extFather } = await supabase.from('dogs').select('id', { count: 'exact', head: true })
        .eq('father_id', id).not('owner_id', 'eq', safeUserId).not('contributor_id', 'eq', safeUserId)
        .not('id', 'in', `(${createdIds.join(',')})`)
      if (extFather && extFather > 0) blocked = true

      if (!blocked) {
        const { count: extMother } = await supabase.from('dogs').select('id', { count: 'exact', head: true })
          .eq('mother_id', id).not('owner_id', 'eq', safeUserId).not('contributor_id', 'eq', safeUserId)
          .not('id', 'in', `(${createdIds.join(',')})`)
        if (extMother && extMother > 0) blocked = true
      }

      // Check litter references
      if (!blocked) {
        const { count: litterRef } = await supabase.from('litters').select('id', { count: 'exact', head: true })
          .or(`father_id.eq.${id},mother_id.eq.${id}`)
        if (litterRef && litterRef > 0) blocked = true
      }

      if (blocked) { skippedNames.push(dogName) }
      else { deletable.push(id) }
    }

    // Unlink parent refs within this import batch for deletable dogs
    for (const id of deletable) {
      await supabase.from('dogs').update({ father_id: null }).eq('father_id', id).not('id', 'in', `(${deletable.join(',')})`)
      await supabase.from('dogs').update({ mother_id: null }).eq('mother_id', id).not('id', 'in', `(${deletable.join(',')})`)
    }

    // Delete related data and dogs
    for (const id of deletable) {
      await supabase.from('dog_photos').delete().eq('dog_id', id)
      await supabase.from('favorites').delete().eq('dog_id', id)
      await supabase.from('vet_records').delete().eq('dog_id', id)
      await supabase.from('awards').delete().eq('dog_id', id)
      await supabase.from('dog_changes').delete().eq('dog_id', id)
      await supabase.from('dogs').delete().eq('id', id)
    }

    // Update or delete notification
    if (skippedNames.length === 0 && notifId) {
      await supabase.from('notifications').delete().eq('id', notifId)
    } else if (notifId) {
      // Update notification to reflect remaining dogs
      const remaining = createdIds.filter(id => !deletable.includes(id))
      await supabase.from('notifications').update({
        message: JSON.stringify({ importId, createdIds: remaining, mainDogId: remaining[0] || null }),
      }).eq('id', notifId)
    }

    return NextResponse.json({ success: true, deletedCount: deletable.length, skippedCount: skippedNames.length, skippedNames })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al deshacer' }, { status: 500 })
  }
}
