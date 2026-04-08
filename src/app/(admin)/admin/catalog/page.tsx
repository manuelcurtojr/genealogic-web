import { createClient } from '@/lib/supabase/server'
import AdminCatalogClient from '@/components/admin/admin-catalog-client'

export default async function AdminCatalogPage() {
  const supabase = await createClient()

  const [breedsRes, colorsRes, dogsByBreedRes, breedColorsRes] = await Promise.all([
    supabase.from('breeds').select('id, name').order('name'),
    supabase.from('colors').select('id, name, thumbnail_url, hex_code').order('name'),
    supabase.from('dogs').select('breed_id'),
    supabase.from('breed_colors').select('breed_id, color_id'),
  ])

  const breedCounts: Record<string, number> = {}
  ;(dogsByBreedRes.data || []).forEach((d: any) => { if (d.breed_id) breedCounts[d.breed_id] = (breedCounts[d.breed_id] || 0) + 1 })

  const breeds = (breedsRes.data || []).map(b => ({ ...b, dog_count: breedCounts[b.id] || 0 }))

  return (
    <AdminCatalogClient
      breeds={breeds}
      colors={colorsRes.data || []}
      breedColors={breedColorsRes.data || []}
    />
  )
}
