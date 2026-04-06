import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ImportDog {
  name: string
  sex: string
  registration: string | null
  breed: string | null
  color: string | null
  birth_date: string | null
  health: string | null
  photo_url: string | null
  father_name: string | null
  mother_name: string | null
  generation?: number
}

export async function POST(request: NextRequest) {
  try {
    const { mainDog, ancestors, userId, kennelId } = await request.json()
    if (!mainDog || !userId) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    const supabase = await createClient()

    // Get breeds and colors for matching
    const [breedsRes, colorsRes] = await Promise.all([
      supabase.from('breeds').select('id, name'),
      supabase.from('colors').select('id, name'),
    ])
    const breeds = breedsRes.data || []
    const colors = colorsRes.data || []

    const findBreed = (name: string | null) => {
      if (!name) return null
      return breeds.find(b => b.name.toLowerCase() === name.toLowerCase())?.id || null
    }
    const findColor = (name: string | null) => {
      if (!name) return null
      return colors.find(c => c.name.toLowerCase() === name.toLowerCase())?.id || null
    }

    // Build all dogs sorted by generation (highest first = most distant ancestors)
    const allDogs: ImportDog[] = [
      ...(ancestors || []).sort((a: any, b: any) => (b.generation || 0) - (a.generation || 0)),
      { ...mainDog, generation: 0 },
    ]

    // Map: dog name → created dog ID
    const nameToId = new Map<string, string>()

    // Check for existing dogs by name
    for (const dog of allDogs) {
      const { data: existing } = await supabase.from('dogs')
        .select('id, name')
        .eq('owner_id', userId)
        .ilike('name', dog.name)
        .limit(1)
      if (existing?.length) {
        nameToId.set(dog.name, existing[0].id)
      }
    }

    // Create dogs from most distant ancestor to main dog
    for (const dog of allDogs) {
      if (nameToId.has(dog.name)) continue // Already exists

      const fatherId = dog.father_name ? nameToId.get(dog.father_name) || null : null
      const motherId = dog.mother_name ? nameToId.get(dog.mother_name) || null : null
      const breedId = findBreed(dog.breed)
      const colorId = findColor(dog.color)

      const parsedDate = dog.birth_date && dog.birth_date.length >= 4
        ? (dog.birth_date.length === 4 ? `${dog.birth_date}-01-01` : dog.birth_date)
        : null

      const { data: created } = await supabase.from('dogs').insert({
        name: dog.name,
        sex: dog.sex === 'Female' ? 'female' : 'male',
        registration: dog.registration || null,
        breed_id: breedId,
        color_id: colorId,
        birth_date: parsedDate,
        father_id: fatherId,
        mother_id: motherId,
        kennel_id: kennelId || null,
        owner_id: userId,
        is_public: true,
        thumbnail_url: dog.photo_url || null,
      }).select('id').single()

      if (created) {
        nameToId.set(dog.name, created.id)
      }
    }

    const mainDogId = nameToId.get(mainDog.name)
    const totalCreated = allDogs.filter(d => !nameToId.has(d.name) || nameToId.get(d.name) === mainDogId).length

    return NextResponse.json({
      success: true,
      mainDogId,
      totalCreated: nameToId.size,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al importar' }, { status: 500 })
  }
}
