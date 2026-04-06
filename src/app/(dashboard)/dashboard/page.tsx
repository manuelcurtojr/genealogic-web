import { createClient } from '@/lib/supabase/server'
import { Dog, Baby, Users, HandCoins, Shield, PawPrint } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import StatCard from '@/components/dashboard/stat-card'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, genes')
    .eq('id', user!.id)
    .single()

  // Counts
  const [dogsRes, littersRes, contactsRes, dealsRes] = await Promise.all([
    supabase.from('dogs').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id),
    supabase.from('litters').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id),
  ])

  // Recent dogs with photos
  const { data: recentDogs } = await supabase
    .from('dogs')
    .select('id, name, sex, thumbnail_url, breed:breeds(name)')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const stats = [
    { icon: Dog, label: 'Perros', value: dogsRes.count || 0, color: BRAND.primary },
    { icon: Baby, label: 'Camadas', value: littersRes.count || 0, color: BRAND.info },
    { icon: Users, label: 'Contactos', value: contactsRes.count || 0, color: BRAND.success },
    { icon: HandCoins, label: 'Negocios', value: dealsRes.count || 0, color: BRAND.warning },
  ]

  return (
    <div>
      {/* Welcome banner */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Hola, {profile?.display_name || 'Criador'} 👋
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
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">{profile?.genes?.toLocaleString() || 0} Genes</p>
            <p className="text-xs text-white/40">Tu saldo de genes</p>
          </div>
        </div>
      </div>

      {/* Recent dogs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Perros recientes</h2>
          <Link href="/dogs" className="text-sm text-[#D74709] hover:text-[#c03d07] transition">
            Ver todos →
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
