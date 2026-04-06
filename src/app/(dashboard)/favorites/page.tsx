import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: favorites } = await supabase
    .from('favorites')
    .select(`
      dog_id,
      dog:dogs(id, name, sex, thumbnail_url, breed:breeds(name))
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const dogs = favorites?.map((f: any) => f.dog).filter(Boolean) || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Favoritos</h1>
        <p className="text-white/50 text-sm mt-1">{dogs.length} perros guardados</p>
      </div>

      {dogs.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No tienes favoritos</p>
          <p className="text-white/25 text-sm mt-2">Guarda perros que te interesen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dogs.map((dog: any) => {
            const photo = dog.thumbnail_url
            const sexColor = dog.sex === 'male' ? 'border-blue-400' : 'border-pink-400'
            return (
              <Link key={dog.id} href={`/dogs/${dog.id}`}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#D74709]/50 transition group">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full border-2 ${sexColor} overflow-hidden flex-shrink-0 bg-white/5`}>
                    {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center text-white/20">{dog.sex === 'male' ? '♂' : '♀'}</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white group-hover:text-[#D74709] transition truncate">{dog.name}</h3>
                    {dog.breed && <p className="text-xs text-white/40">{(dog.breed as any).name}</p>}
                  </div>
                  <Heart className="w-4 h-4 text-red-400 fill-red-400 flex-shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
