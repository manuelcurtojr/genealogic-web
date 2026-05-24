/**
 * Helpers de datos del kennel para el web builder.
 *
 * En Pawdoq tenant-breeder estos datos venían vía Genealogic API HTTP.
 * Aquí estamos DENTRO de Genealogic, así que vamos directo a la DB local
 * con service-role para servir contenido público.
 */
import 'server-only'
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { sortDogsPhotoFirst } from '@/lib/dogs/sort'

export type SiteDog = {
  id: string
  name: string
  slug: string
  sex: 'male' | 'female'
  birth_date: string | null
  registration: string | null
  microchip: string | null
  thumbnail_url: string | null
  weight: number | null
  height: number | null
  is_public: boolean
  is_for_sale: boolean
  sale_price: number | null
  sale_currency: string | null
  sale_description: string | null
  sale_location: string | null
  is_reproductive: boolean
  breeding_rights: boolean
  father_id: string | null
  mother_id: string | null
  breed?: { id: string; name: string } | null
  color?: { id: string; name: string } | null
}

export type SiteLitter = {
  id: string
  status: string | null
  mating_date: string | null
  expected_date: string | null
  birth_date: string | null
  puppy_count: number | null
  breed?: { id: string; name: string } | null
  father?: { id: string; name: string; slug: string; thumbnail_url: string | null } | null
  mother?: { id: string; name: string; slug: string; thumbnail_url: string | null } | null
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export const getDogsByKennel = cache(async (kennelId: string): Promise<SiteDog[]> => {
  const { data } = await admin()
    .from('dogs')
    .select(`
      id, name, slug, sex, birth_date, registration, microchip, thumbnail_url,
      weight, height, is_public, is_for_sale, sale_price, sale_currency,
      sale_description, sale_location, is_reproductive, breeding_rights,
      father_id, mother_id,
      breed:breeds(id, name), color:colors(id, name)
    `)
    .eq('kennel_id', kennelId)
    .eq('is_public', true)
    .order('birth_date', { ascending: false })
  // Primero los que tienen foto: en el primer pantallazo de la web nunca
  // se ven cajas vacías. Sort estable mantiene el orden por birth_date dentro
  // de cada grupo (con foto / sin foto).
  return sortDogsPhotoFirst((data as any) || [])
})

export const getReproductiveDogsByKennel = cache(async (kennelId: string): Promise<SiteDog[]> => {
  const dogs = await getDogsByKennel(kennelId)
  return dogs.filter(d => d.is_reproductive)
})

export const getAvailablePuppiesByKennel = cache(async (kennelId: string): Promise<SiteDog[]> => {
  const dogs = await getDogsByKennel(kennelId)
  return dogs.filter(d => d.is_for_sale)
})

export const getUpcomingLittersByKennel = cache(async (kennelId: string): Promise<SiteLitter[]> => {
  const { data } = await admin()
    .from('litters')
    .select(`
      id, status, mating_date, expected_date, birth_date, puppy_count,
      father:dogs!father_id(id, name, slug, thumbnail_url),
      mother:dogs!mother_id(id, name, slug, thumbnail_url)
    `)
    .eq('owner_id', (await admin().from('kennels').select('owner_id').eq('id', kennelId).single()).data?.owner_id)
    .order('expected_date', { ascending: true })
    .limit(10)
  return (data as any) || []
})

export const getPublishedPostsByKennel = cache(async (kennelId: string, limit = 9): Promise<any[]> => {
  const { data } = await admin()
    .from('kennel_posts')
    .select('id, slug, title, excerpt, cover_image_url, cover_image_alt, published_at, category_slug, tags, author_name, author_avatar_url, reading_time_minutes')
    .eq('kennel_id', kennelId)
    .eq('status', 'published')
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)
  return data || []
})

export const getPostBySlug = cache(async (kennelId: string, slug: string): Promise<any | null> => {
  const { data } = await admin()
    .from('kennel_posts')
    .select('*')
    .eq('kennel_id', kennelId)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  return data
})
