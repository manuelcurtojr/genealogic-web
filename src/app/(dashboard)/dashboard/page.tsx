import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Dog, Baby, PawPrint, Tag, Plus, Stethoscope, ArrowRight, Search, Crown } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import StatCard from '@/components/dashboard/stat-card'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Admins go to admin panel
  const { data: roleCheck } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (roleCheck?.role === 'admin') redirect('/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, email, created_at')
    .eq('id', user.id)
    .single()

  // Get kennel
  const { data: kennelArr } = await supabase.from('kennels').select('id, name').eq('owner_id', user.id).limit(1)
  const kennel = kennelArr?.[0] || null
  const isBreeder = !!kennel

  // Fetch dashboard data in parallel
  const [
    dogsRes, littersRes, vetRes, recentDogsRes,
    activeLittersRes, forSaleRes, vetRemindersRes,
  ] = await Promise.all([
    supabase.from('dogs').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('litters').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('vet_records').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    // Recent dogs (with photos first)
    supabase.from('dogs').select('id, name, sex, thumbnail_url, slug, breed:breeds(name)').eq('owner_id', user.id).not('thumbnail_url', 'is', null).order('created_at', { ascending: false }).limit(6),
    // Active litters
    supabase.from('litters').select('id, status, birth_date, mating_date, father:dogs!litters_father_id_fkey(name), mother:dogs!litters_mother_id_fkey(name)').eq('owner_id', user.id).in('status', ['planned', 'mated']).order('created_at', { ascending: false }).limit(3),
    // Dogs for sale
    supabase.from('dogs').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).eq('is_for_sale', true),
    // Upcoming vet reminders (next 14 days)
    supabase.from('vet_reminders').select('id, title, type, due_date, dog:dogs(name, sex)').eq('owner_id', user.id).is('completed_date', null).lte('due_date', new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]).order('due_date').limit(5),
  ])

  const dogCount = dogsRes.count || 0
  const forSaleCount = forSaleRes.count || 0

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Row 1: Welcome + Quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Hola, {profile?.display_name || (isBreeder ? 'Criador' : 'Propietario')}</h1>
          <p className="text-fg-mute text-xs sm:text-sm mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dogs" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-[#D74709] hover:bg-[#c03d07] text-white text-xs sm:text-sm font-semibold transition">
            <Plus className="w-4 h-4" /> Perro
          </Link>
          {isBreeder && (
            <Link href="/litters" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-chip border border-hair text-fg-dim text-xs sm:text-sm font-medium hover:bg-chip transition">
              <Baby className="w-4 h-4" /> Camada
            </Link>
          )}
          <Link href="/search" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-chip border border-hair text-fg-dim text-xs sm:text-sm font-medium hover:bg-chip transition">
            <Search className="w-4 h-4" /> Buscar
          </Link>
        </div>
      </div>

      {/* Stats — different for breeder vs owner */}
      {isBreeder ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
          <StatCard icon={Dog} label="Perros" value={dogCount} accentColor={BRAND.primary} />
          <StatCard icon={Tag} label="En venta" value={forSaleCount} accentColor="#10B981" />
          <StatCard icon={Baby} label="Camadas" value={littersRes.count || 0} accentColor={BRAND.info} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
          <StatCard icon={Dog} label="Mis perros" value={dogCount} accentColor={BRAND.primary} />
          <StatCard icon={Stethoscope} label="Registros vet." value={vetRes.count || 0} accentColor={BRAND.info} />
          <StatCard icon={Tag} label="En venta" value={forSaleCount} accentColor="#10B981" />
        </div>
      )}

      {/* Breeder: Active litters */}
      {isBreeder ? (
        <div className="mb-5 sm:mb-6">
          <div className="bg-chip border border-hair rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Camadas activas</h2>
              <Link href="/litters" className="text-xs text-[#D74709] hover:text-[#c03d07] transition">Ver todas</Link>
            </div>
            {(activeLittersRes.data || []).length === 0 ? (
              <p className="text-xs text-fg-mute text-center py-6">Sin camadas activas</p>
            ) : (
              <div className="space-y-2">
                {(activeLittersRes.data || []).map((litter: any) => (
                  <Link key={litter.id} href={`/litters/${litter.id}`} className="flex items-center gap-3 bg-purple-500/5 rounded-lg p-2.5 hover:bg-purple-500/10 transition">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Baby className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{(litter.father as any)?.name || '?'} x {(litter.mother as any)?.name || '?'}</p>
                      <p className="text-[10px] text-purple-400">{litter.status === 'mated' ? 'En gestación' : 'Planificada'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Owner view: simpler layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="bg-chip border border-hair rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-3">Acciones rápidas</h2>
            <div className="space-y-2.5">
              {[
                { icon: Dog, label: 'Ver mis perros', color: BRAND.primary, href: '/dogs' },
                { icon: Search, label: 'Buscar perros', color: '#8B5CF6', href: '/search' },
                { icon: Stethoscope, label: 'Veterinario', color: BRAND.info, href: '/vet' },
              ].map(item => (
                <Link key={item.label} href={item.href} className="flex items-center gap-3 hover:bg-chip rounded-lg p-1.5 -mx-1.5 transition">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + '15' }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <span className="text-xs text-fg-dim flex-1">{item.label}</span>
                  <ArrowRight className="w-3 h-3 text-fg-mute" />
                </Link>
              ))}
            </div>

            {/* CTA to upgrade */}
            <div className="mt-4 p-3 bg-[#D74709]/5 border border-[#D74709]/15 rounded-lg">
              <p className="text-xs font-semibold text-[#D74709] mb-1">¿Eres criador?</p>
              <p className="text-[11px] text-fg-mute mb-2">Mejora tu plan para gestionar tu criadero, camadas y más.</p>
              <Link href="/pricing" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D74709] hover:text-[#c03d07] transition">
                <Crown className="w-3.5 h-3.5" /> Ver planes <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Vet reminders widget */}
      {(vetRemindersRes.data || []).length > 0 && (
        <div className="bg-chip border border-hair rounded-xl p-3 sm:p-4 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-blue-400" /> <span className="hidden sm:inline">Próximos recordatorios vet.</span><span className="sm:hidden">Recordatorios vet.</span>
            </h2>
            <Link href="/vet" className="text-xs text-[#D74709] hover:text-[#c03d07] transition">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {(vetRemindersRes.data || []).map((r: any) => {
              const dog = r.dog as any
              const isOverdue = r.due_date < new Date().toISOString().split('T')[0]
              const typeColors: Record<string, string> = { vaccine: '#10B981', deworming: '#F59E0B', checkup: '#3B82F6', custom: '#8B5CF6' }
              const color = typeColors[r.type] || '#8B5CF6'
              return (
                <div key={r.id} className={`flex items-center gap-3 rounded-lg p-2.5 ${isOverdue ? 'bg-red-500/5' : 'bg-chip'}`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
                    <Stethoscope className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{r.title}</p>
                    <p className="text-[10px] text-fg-mute">{dog?.name || '?'}</p>
                  </div>
                  <span className={`text-xs font-semibold ${isOverdue ? 'text-red-400' : 'text-fg-mute'}`}>
                    {new Date(r.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent dogs */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold">Perros recientes</h2>
          <Link href="/dogs" className="text-xs sm:text-sm text-[#D74709] hover:text-[#c03d07] transition">Ver todos</Link>
        </div>
        {recentDogsRes.data && recentDogsRes.data.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {recentDogsRes.data.map((dog: any) => {
              const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
              return (
                <Link key={dog.id} href={`/dogs/${dog.slug || dog.id}`}
                  className="bg-ink-800 border border-hair rounded-xl overflow-hidden hover:border-[#D74709]/50 transition group">
                  <div className="aspect-square bg-chip relative">
                    {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-fg-mute"><PawPrint className="w-10 h-10" /></div>}
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: sexColor }} />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate group-hover:text-[#D74709] transition">{dog.name}</p>
                    {dog.breed && <p className="text-[10px] text-fg-mute truncate">{(dog.breed as any).name}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-chip border border-hair rounded-xl">
            <p className="text-fg-mute">No tienes perros aún</p>
            <Link href="/dogs" className="text-sm text-[#D74709] hover:underline mt-2 inline-block">Añade tu primer perro</Link>
          </div>
        )}
      </div>
    </div>
  )
}
