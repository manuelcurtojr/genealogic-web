import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ImportDog {
  name: string; sex: string; registration: string | null; breed: string | null
  color: string | null; birth_date: string | null; health: string | null
  photo_url: string | null; father_name: string | null; mother_name: string | null
  generation?: number
}

// POST: Confirm import
export async function POST(request: NextRequest) {
  try {
    const { mainDog, ancestors, userId, kennelId, swaps, importPhotos } = await request.json()
    if (!mainDog || !userId) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    const supabase = await createClient()
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

    // Duplicate detection
    for (const dog of allDogs) {
      if (nameToId.has(dog.name)) continue
      const { data: existing } = await supabase.from('dogs').select('id').eq('owner_id', userId).ilike('name', dog.name).limit(1)
      if (existing?.length) { nameToId.set(dog.name, existing[0].id); continue }
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

      const { data: created } = await supabase.from('dogs').insert({
        name: dog.name, sex: dog.sex === 'Female' ? 'female' : 'male',
        registration: dog.registration || null, breed_id: findBreed(dog.breed), color_id: findColor(dog.color),
        birth_date: parsedDate, father_id: fatherId, mother_id: motherId,
        kennel_id: kennelId || null, owner_id: userId, is_public: true,
        thumbnail_url: importPhotos !== false ? (dog.photo_url || null) : null,
      }).select('id').single()

      if (created) { nameToId.set(dog.name, created.id); createdIds.push(created.id) }
    }

    // Enrich existing dogs with missing parent links
    for (const dog of allDogs) {
      const dogId = nameToId.get(dog.name)
      if (!dogId || createdIds.includes(dogId)) continue
      const updates: any = {}
      if (dog.father_name && nameToId.has(dog.father_name)) {
        const { data: c } = await supabase.from('dogs').select('father_id').eq('id', dogId).single()
        if (!c?.father_id) updates.father_id = nameToId.get(dog.father_name)
      }
      if (dog.mother_name && nameToId.has(dog.mother_name)) {
        const { data: c } = await supabase.from('dogs').select('mother_id').eq('id', dogId).single()
        if (!c?.mother_id) updates.mother_id = nameToId.get(dog.mother_name)
      }
      if (Object.keys(updates).length > 0) await supabase.from('dogs').update(updates).eq('id', dogId)
    }

    const mainDogId = nameToId.get(mainDog.name)
    const importId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Save import record
    await supabase.from('notifications').insert({
      user_id: userId, type: 'import',
      title: `Pedigrí importado: ${mainDog.name}`,
      message: JSON.stringify({ importId, createdIds, mainDogId }),
      is_read: false,
    })

    return NextResponse.json({ success: true, mainDogId, totalCreated: createdIds.length, totalLinked: nameToId.size - createdIds.length, importId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al importar' }, { status: 500 })
  }
}

// DELETE: Undo import
export async function DELETE(request: NextRequest) {
  try {
    const { importId, userId } = await request.json()
    if (!importId || !userId) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    const supabase = await createClient()
    const { data: notifs } = await supabase.from('notifications').select('id, message').eq('user_id', userId).eq('type', 'import').order('created_at', { ascending: false }).limit(50)

    let createdIds: string[] = []
    let notifId: string | null = null
    for (const n of (notifs || [])) {
      try { const p = JSON.parse(n.message); if (p.importId === importId) { createdIds = p.createdIds || []; notifId = n.id; break } } catch {}
    }

    if (createdIds.length === 0) return NextResponse.json({ error: 'Import not found' }, { status: 404 })

    for (const id of createdIds) {
      await supabase.from('dogs').update({ father_id: null }).eq('father_id', id)
      await supabase.from('dogs').update({ mother_id: null }).eq('mother_id', id)
    }
    for (const id of createdIds) {
      await supabase.from('dog_photos').delete().eq('dog_id', id)
      await supabase.from('favorites').delete().eq('dog_id', id)
      await supabase.from('dogs').delete().eq('id', id).eq('owner_id', userId)
    }
    if (notifId) await supabase.from('notifications').delete().eq('id', notifId)

    return NextResponse.json({ success: true, deletedCount: createdIds.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al deshacer' }, { status: 500 })
  }
}
