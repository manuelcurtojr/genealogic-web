import { createClient } from '@/lib/supabase/server'
import { Dog, Baby, Users, HandCoins, PawPrint } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import StatCard from '@/components/dashboard/stat-card'
import Achievements from '@/components/dashboard/achievements'
import GenesCard from '@/components/dashboard/genes-card'
import { evaluateAchievements, type EvalData } from '@/lib/achievements'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, genes, avatar_url, email, created_at')
    .eq('id', user!.id)
    .single()

  // Counts
  const [dogsRes, littersRes, contactsRes, dealsRes, kennelsRes, vetRes, awardsRes] = await Promise.all([
    supabase.from('dogs').select('id, father_id, mother_id, breed_id, thumbnail_url', { count: 'exact' }).eq('owner_id', user!.id),
    supabase.from('litters').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id),
    supabase.from('kennels').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id),
    supabase.from('vet_records').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id),
    supabase.from('awards').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id),
  ])

  const dogs = dogsRes.data || []
  const dogCount = dogsRes.count || 0

  // Achievement evaluation data
  const dogWithParentsCount = dogs.filter(d => d.father_id && d.mother_id).length
  const dogsWithPhotosCount = dogs.filter(d => d.thumbnail_url).length
  const distinctBreeds = new Set(dogs.map(d => d.breed_id).filter(Boolean))

  // For 3-gen complete check, we need pedigree data for dogs that have parents
  let dogWith3GenCount = 0
  const dogsWithParents = dogs.filter(d => d.father_id && d.mother_id).slice(0, 10) // check up to 10
  for (const d of dogsWithParents) {
    const { data: ped } = await supabase.rpc('get_pedigree', { dog_uuid: d.id, max_gen: 3 })
    if (ped && ped.length >= 7) { // root + 2 parents + 4 grandparents = 7
      dogWith3GenCount = 1
      break
    }
  }

  // Account age
  const createdAt = profile?.created_at || user.created_at
  const accountAgeYears = createdAt ? (Date.now() - new Date(createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000) : 0

  // Profile completeness
  const profileComplete = !!(profile?.display_name && profile?.email && profile?.avatar_url)

  const evalData: EvalData = {
    dogCount,
    dogWithParentsCount,
    dogWith3GenCount,
    litterCount: littersRes.count || 0,
    kennelCount: kennelsRes.count || 0,
    dogsWithPhotosCount,
    distinctBreedsCount: distinctBreeds.size,
    totalVisits: 0, // not tracked yet
    vetRecordsCount: vetRes.count || 0,
    awardsCount: awardsRes.count || 0,
    dealsCount: dealsRes.count || 0,
    accountAgeYears,
    profileComplete,
    genesPurchased: false, // not tracked yet
  }

  const achievements = evaluateAchievements(evalData)

  // Recent dogs with photos
  const { data: recentDogs } = await supabase
    .from('dogs')
    .select('id, name, sex, thumbnail_url, breed:breeds(name)')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const stats = [
    { icon: Dog, label: 'Perros', value: dogCount, color: BRAND.primary },
    { icon: Baby, label: 'Camadas', value: littersRes.count || 0, color: BRAND.info },
    { icon: Users, label: 'Contactos', value: contactsRes.count || 0, color: BRAND.success },
    { icon: HandCoins, label: 'Negocios', value: dealsRes.count || 0, color: BRAND.warning },
  ]

  return (
    <div>
      {/* Welcome banner */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Hola, {profile?.display_name || 'Criador'}
        </h1>
        <p className="text-white/50 text-sm mt-1">Bienvenido a tu panel de Genealogic</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} accentColor={s.color} />
        ))}
      </div>

      {/* Genes balance */}
      <div className="mb-8">
        <GenesCard balance={profile?.genes || 0} userId={user.id} />
      </div>

      {/* Achievements */}
      <div className="mb-8">
        <Achievements achievements={achievements} />
      </div>

      {/* Recent dogs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Perros recientes</h2>
          <Link href="/dogs" className="text-sm text-[#D74709] hover:text-[#c03d07] transition">
            Ver todos
          </Link>
        </div>

        {recentDogs && recentDogs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentDogs.map((dog: any) => {
              const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
              return (
                <Link
                  key={dog.id}
                  href={`/dogs/${dog.id}`}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/50 transition group"
                >
                  <div className="aspect-square bg-white/5 relative">
                    {dog.thumbnail_url ? (
                      <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/10 text-4xl">
                        <PawPrint className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: sexColor }} />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate group-hover:text-[#D74709] transition">{dog.name}</p>
                    {dog.breed && (
                      <p className="text-[10px] text-white/40 truncate">{(dog.breed as any).name}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white/40">No tienes perros aun</p>
            <Link href="/dogs/new" className="text-sm text-[#D74709] hover:underline mt-2 inline-block">
              Anade tu primer perro
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
