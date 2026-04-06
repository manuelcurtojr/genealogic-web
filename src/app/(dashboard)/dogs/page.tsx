import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import DogsPageClient from '@/components/dogs/dogs-page-client'

export default async function DogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [dogsRes, breedsRes, favoritesRes] = await Promise.all([
    supabase
      .from('dogs')
      .select(`
        id, name, sex, birth_date, thumbnail_url, breed_id,
        breed:breeds(name),
        color:colors(name)
      `)
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('breeds')
      .select('id, name')
      .order('name'),
    supabase
      .from('favorites')
      .select('dog_id')
      .eq('user_id', user!.id),
  ])

  const dogs = dogsRes.data || []
  const breeds = breedsRes.data || []
  const favoriteDogIds = (favoritesRes.data || []).map((f: any) => f.dog_id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mis Perros</h1>
          <p className="text-white/50 text-sm mt-1">{dogs.length} perros registrados</p>
        </div>
        <Link
          href="/dogs/new"
          className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Anadir perro
        </Link>
      </div>

      <DogsPageClient
        dogs={dogs}
        breeds={breeds}
        favoriteDogIds={favoriteDogIds}
        userId={user!.id}
      />
    </div>
  )
}
