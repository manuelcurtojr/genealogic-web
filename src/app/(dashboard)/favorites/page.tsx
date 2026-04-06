import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Heart, Dog, GitBranch } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import FavoriteButton from '@/components/dogs/favorite-button'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: favorites } = await supabase
    .from('favorites')
    .select(`
      dog_id,
      dog:dogs(id, name, sex, thumbnail_url, birth_date, breed:breeds(name), color:colors(name), kennel:kennels(name))
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const dogs = favorites?.map((f: any) => f.dog).filter(Boolean) || []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Favoritos</h1>
        <p className="text-white/50 text-sm mt-1">{dogs.length} perros guardados</p>
      </div>

      {dogs.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No tienes favoritos</p>
          <p className="text-white/25 text-sm mt-2">Pulsa el corazon en el perfil de un perro para guardarlo</p>
          <Link href="/dogs" className="text-sm text-[#D74709] hover:underline mt-4 inline-block">
            Explorar perros
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dogs.map((dog: any) => {
            const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
            const sexIcon = dog.sex === 'male' ? '♂' : '♀'
            const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
            const colorName = Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name
            const kennelName = Array.isArray(dog.kennel) ? dog.kennel[0]?.name : dog.kennel?.name

            return (
              <div key={dog.id} className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/30 transition group relative">
                {/* Photo */}
                <Link href={`/dogs/${dog.id}`} className="block relative aspect-[4/3] bg-white/5">
                  {dog.thumbnail_url ? (
                    <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Dog className="w-12 h-12 text-white/10" /></div>
                  )}
                  {breedName && (
                    <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">{breedName}</span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
                </Link>

                {/* Favorite button */}
                <div className="absolute top-2 left-2">
                  <FavoriteButton dogId={dog.id} initialFavorited={true} />
                </div>

                {/* Info */}
                <div className="p-3">
                  <Link href={`/dogs/${dog.id}`} className="flex items-center gap-1.5 group-hover:text-[#D74709] transition">
                    <span className="text-sm font-semibold truncate">{dog.name}</span>
                    <span className="text-xs" style={{ color: sexColor }}>{sexIcon}</span>
                  </Link>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/35">
                    {dog.birth_date && <span>{new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    {colorName && <span>{colorName}</span>}
                  </div>
                  {kennelName && (
                    <p className="text-[10px] text-white/25 mt-1 truncate">{kennelName}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                    <Link href={`/dogs/${dog.id}`} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition">
                      Ver perfil
                    </Link>
                    <Link href={`/dogs/${dog.id}`} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-white/5 text-white/30 hover:bg-white/10 transition ml-auto">
                      <GitBranch className="w-3 h-3" /> Pedigri
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
