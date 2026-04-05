import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function DogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: dogs } = await supabase
    .from('dogs')
    .select(`
      id, name, sex, birth_date, registration, is_public,
      breed:breeds(name),
      color:colors(name),
      kennel:kennels(name),
      photos:dog_photos(url)
    `)
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Mis Perros</h1>
          <p className="text-white/50 text-sm mt-1">{dogs?.length || 0} perros registrados</p>
        </div>
        <Link
          href="/dogs/new"
          className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Anadir perro
        </Link>
      </div>

      {!dogs || dogs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-lg">No tienes perros registrados</p>
          <p className="text-white/25 text-sm mt-2">Anade tu primer perro para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dogs.map((dog: any) => {
            const photo = dog.photos?.[0]?.url
            const sexColor = dog.sex === 'male' ? 'text-blue-400 border-blue-400' : 'text-pink-400 border-pink-400'

            return (
              <Link
                key={dog.id}
                href={`/dogs/${dog.id}`}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#D74709]/50 hover:bg-white/[0.07] transition group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full border-2 ${sexColor} overflow-hidden flex-shrink-0 bg-white/5`}>
                    {photo ? (
                      <img src={photo} alt={dog.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">
                        {dog.sex === 'male' ? '♂' : '♀'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white group-hover:text-[#D74709] transition truncate">
                      {dog.name}
                    </h3>
                    {dog.breed && (
                      <p className="text-xs text-white/40 mt-0.5">{(dog.breed as any).name}</p>
                    )}
                    {dog.registration && (
                      <p className="text-[11px] text-white/30 mt-0.5 font-mono">{dog.registration}</p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
