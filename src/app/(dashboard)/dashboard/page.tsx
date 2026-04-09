import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Dog, Baby, Users, HandCoins, PawPrint, Tag, TrendingUp, FileText, Plus, Calendar, Stethoscope, ArrowRight, Heart, Store, Search } from 'lucide-react'
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

  // Admins go to admin panel
  const { data: roleCheck } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (roleCheck?.role === 'admin') redirect('/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, genes, avatar_url, email, created_at')
    .eq('id', user.id)
    .single()

  // Get kennel
  const { data: kennelArr } = await supabase.from('kennels').select('id, name').eq('owner_id', user.id).limit(1)
  const kennel = kennelArr?.[0] || null
  const isBreeder = !!kennel

  // Fetch all data in parallel
  const [
    dogsRes, littersRes, contactsRes, dealsRes, kennelsRes, vetRes, awardsRes,
    recentDogsRes, eventsRes, submissionsRes, recentDealsRes, activeLittersRes,
    forSaleRes, notifRes, favoritesRes, vetRemindersRes,
  ] = await Promise.all([
    supabase.from('dogs').select('id, father_id, mother_id, breed_id, thumbnail_url', { count: 'exact' }).eq('owner_id', user.id),
    supabase.from('litters').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('deals').select('id, value, stage_id', { count: 'exact' }).eq('owner_id', user.id),
    supabase.from('kennels').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('vet_records').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('awards').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    // Recent dogs (with photos first)
    supabase.from('dogs').select('id, name, sex, thumbnail_url, breed:breeds(name)').eq('owner_id', user.id).not('thumbnail_url', 'is', null).order('created_at', { ascending: false }).limit(6),
    // Upcoming events (next 7 days)
    supabase.from('events').select('id, title, event_type, start_date, color, is_completed').gte('start_date', new Date().toISOString()).lte('start_date', new Date(Date.now() + 7 * 86400000).toISOString()).order('start_date').limit(5),
    // Recent submissions
    kennel ? supabase.from('form_submissions').select('id, data, created_at').eq('kennel_id', kennel.id).order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] }),
    // Recent deals
    supabase.from('deals').select('id, title, value, currency, created_at, contact:contacts(name)').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(5),
    // Active litters
    supabase.from('litters').select('id, status, birth_date, mating_date, father:dogs!litters_father_id_fkey(name), mother:dogs!litters_mother_id_fkey(name)').eq('owner_id', user.id).in('status', ['planned', 'mated']).order('created_at', { ascending: false }).limit(3),
    // Dogs for sale
    supabase.from('dogs').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).eq('is_for_sale', true),
    // Unread notifications
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
    // Favorites
    supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    // Upcoming vet reminders (next 14 days)
    supabase.from('vet_reminders').select('id, title, type, due_date, dog:dogs(name, sex)').eq('owner_id', user.id).is('completed_date', null).lte('due_date', new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]).order('due_date').limit(5),
  ])

  const dogs = dogsRes.data || []
  const dogCount = dogsRes.count || 0
  const forSaleCount = forSaleRes.count || 0
  const pipelineValue = (dealsRes.data || []).reduce((s: number, d: any) => s + (Number(d.value) || 0), 0)
  const favoritesCount = favoritesRes.count || 0

  // Achievements
  const dogWithParentsCount = dogs.filter(d => d.father_id && d.mother_id).length
  const dogsWithPhotosCount = dogs.filter(d => d.thumbnail_url).length
  const distinctBreeds = new Set(dogs.map(d => d.breed_id).filter(Boolean))
  let dogWith3GenCount = 0
  for (const d of dogs.filter(d => d.father_id && d.mother_id).slice(0, 5)) {
    const { data: ped } = await supabase.rpc('get_pedigree', { dog_uuid: d.id, max_gen: 3 })
    if (ped && ped.length >= 7) { dogWith3GenCount = 1; break }
  }
  const createdAt = profile?.created_at || user.created_at
  const accountAgeYears = createdAt ? (Date.now() - new Date(createdAt).getTime()) / (365.25 * 86400000) : 0
  const profileComplete = !!(profile?.display_name && profile?.email && profile?.avatar_url)
  const evalData: EvalData = {
    dogCount, dogWithParentsCount, dogWith3GenCount,
    litterCount: littersRes.count || 0, kennelCount: kennelsRes.count || 0,
    dogsWithPhotosCount, distinctBreedsCount: distinctBreeds.size,
    totalVisits: 0, vetRecordsCount: vetRes.count || 0,
    awardsCount: awardsRes.count || 0, dealsCount: dealsRes.count || 0,
    accountAgeYears, profileComplete, genesPurchased: false,
  }
  const achievements = evaluateAchievements(evalData)

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Row 1: Welcome + Quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Hola, {profile?.display_name || (isBreeder ? 'Criador' : 'Propietario')}</h1>
          <p className="text-white/40 text-xs sm:text-sm mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dogs" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-[#D74709] hover:bg-[#c03d07] text-white text-xs sm:text-sm font-semibold transition">
            <Plus className="w-4 h-4" /> Perro
          </Link>
          {isBreeder && (
            <Link href="/litters" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs sm:text-sm font-medium hover:bg-white/10 transition">
              <Baby className="w-4 h-4" /> Camada
            </Link>
          )}
          {isBreeder && (
            <Link href="/crm/deals" className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition">
              <HandCoins className="w-4 h-4" /> Negocio
            </Link>
          )}
          {!isBreeder && (
            <Link href="/search" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs sm:text-sm font-medium hover:bg-white/10 transition">
              <Search className="w-4 h-4" /> Buscar
            </Link>
          )}
        </div>
      </div>

      {/* Stats — different for breeder vs owner */}
      {isBreeder ? (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-5 sm:mb-6">
          <StatCard icon={Dog} label="Perros" value={dogCount} accentColor={BRAND.primary} />
          <StatCard icon={Tag} label="En venta" value={forSaleCount} accentColor="#10B981" />
          <StatCard icon={Baby} label="Camadas" value={littersRes.count || 0} accentColor={BRAND.info} />
          <StatCard icon={HandCoins} label="Negocios" value={dealsRes.count || 0} accentColor={BRAND.warning} />
          <StatCard icon={TrendingUp} label="Pipeline" value={`${pipelineValue.toLocaleString('es-ES')} €`} accentColor="#10B981" />
          <StatCard icon={FileText} label="Solicitudes" value={(submissionsRes as any).data?.length || 0} accentColor="#EC4899" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
          <StatCard icon={Dog} label="Mis perros" value={dogCount} accentColor={BRAND.primary} />
          <StatCard icon={Heart} label="Favoritos" value={favoritesCount} accentColor="#EC4899" />
          <StatCard icon={Stethoscope} label="Registros vet." value={vetRes.count || 0} accentColor={BRAND.info} />
          <StatCard icon={Calendar} label="Eventos" value={(eventsRes.data || []).length} accentColor={BRAND.warning} />
        </div>
      )}

      {/* Genes */}
      <div className="mb-5 sm:mb-6">
        <GenesCard balance={profile?.genes || 0} userId={user.id} />
      </div>

      {/* Breeder: Activity + Upcoming */}
      {isBreeder ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
            {/* Recent deals */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Negocios recientes</h2>
                <Link href="/crm/deals" className="text-xs text-[#D74709] hover:text-[#c03d07] transition">Ver todos</Link>
              </div>
              {(recentDealsRes.data || []).length === 0 ? (
                <p className="text-xs text-white/25 text-center py-6">Sin negocios</p>
              ) : (
                <div className="space-y-2">
                  {(recentDealsRes.data || []).map((deal: any) => (
                    <div key={deal.id} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#D74709]/10 flex items-center justify-center flex-shrink-0">
                        <HandCoins className="w-4 h-4 text-[#D74709]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{deal.title}</p>
                        <p className="text-[10px] text-white/30">{(deal.contact as any)?.name || 'Sin contacto'}</p>
                      </div>
                      {deal.value && <span className="text-xs font-bold text-[#D74709]">{Number(deal.value).toLocaleString('es-ES')} €</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming events + litters */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Próximos eventos</h2>
                <Link href="/calendar" className="text-xs text-[#D74709] hover:text-[#c03d07] transition">Ver calendario</Link>
              </div>
              {(eventsRes.data || []).length === 0 && (activeLittersRes.data || []).length === 0 ? (
                <p className="text-xs text-white/25 text-center py-6">Nada programado</p>
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
                  {(eventsRes.data || []).map((ev: any) => (
                    <div key={ev.id} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: (ev.color || '#D74709') + '15' }}>
                        <Calendar className="w-4 h-4" style={{ color: ev.color || '#D74709' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{ev.title}</p>
                        <p className="text-[10px] text-white/30">{new Date(ev.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submissions + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
            {/* Recent submissions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Solicitudes recientes</h2>
                <Link href="/crm/contacts" className="text-xs text-[#D74709] hover:text-[#c03d07] transition">Ver contactos</Link>
              </div>
              {((submissionsRes as any).data || []).length === 0 ? (
                <p className="text-xs text-white/25 text-center py-6">Sin solicitudes</p>
              ) : (
                <div className="space-y-2">
                  {((submissionsRes as any).data || []).map((sub: any) => (
                    <div key={sub.id} className="flex items-center gap-3 bg-pink-500/5 rounded-lg p-2.5">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-pink-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{sub.data?.first_name} {sub.data?.last_name || ''}</p>
                        <div className="flex items-center gap-2 text-[10px] text-white/30">
                          {sub.data?.country_name && <span>{sub.data.country_name}</span>}
                          {sub.data?.breed_interest_names && <span className="text-pink-400">{sub.data.breed_interest_names}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-white/20">{new Date(sub.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-3">Resumen de actividad</h2>
              <div className="space-y-2.5">
                {[
                  { icon: Dog, label: 'Perros registrados', value: dogCount, color: BRAND.primary, href: '/dogs' },
                  { icon: Baby, label: 'Camadas', value: littersRes.count || 0, color: '#8B5CF6', href: '/litters' },
                  { icon: Stethoscope, label: 'Registros veterinarios', value: vetRes.count || 0, color: '#3B82F6', href: '/dogs' },
                  { icon: Users, label: 'Contactos CRM', value: contactsRes.count || 0, color: '#10B981', href: '/crm/contacts' },
                ].map(item => (
                  <Link key={item.label} href={item.href} className="flex items-center gap-3 hover:bg-white/[0.03] rounded-lg p-1.5 -mx-1.5 transition">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + '15' }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <span className="text-xs text-white/50 flex-1">{item.label}</span>
                    <span className="text-sm font-bold">{item.value}</span>
                    <ArrowRight className="w-3 h-3 text-white/20" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Owner view: simpler layout */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
            {/* Upcoming events */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Próximos eventos</h2>
                <Link href="/calendar" className="text-xs text-[#D74709] hover:text-[#c03d07] transition">Ver calendario</Link>
              </div>
              {(eventsRes.data || []).length === 0 ? (
                <p className="text-xs text-white/25 text-center py-6">Nada programado</p>
              ) : (
                <div className="space-y-2">
                  {(eventsRes.data || []).map((ev: any) => (
                    <div key={ev.id} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: (ev.color || '#D74709') + '15' }}>
                        <Calendar className="w-4 h-4" style={{ color: ev.color || '#D74709' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{ev.title}</p>
                        <p className="text-[10px] text-white/30">{new Date(ev.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions for owners */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-3">Acciones rápidas</h2>
              <div className="space-y-2.5">
                {[
                  { icon: Dog, label: 'Ver mis perros', color: BRAND.primary, href: '/dogs' },
                  { icon: Heart, label: 'Mis favoritos', color: '#EC4899', href: '/favorites' },
                  { icon: Search, label: 'Buscar perros', color: '#8B5CF6', href: '/search' },
                  { icon: Calendar, label: 'Calendario', color: BRAND.info, href: '/calendar' },
                ].map(item => (
                  <Link key={item.label} href={item.href} className="flex items-center gap-3 hover:bg-white/[0.03] rounded-lg p-1.5 -mx-1.5 transition">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + '15' }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <span className="text-xs text-white/60 flex-1">{item.label}</span>
                    <ArrowRight className="w-3 h-3 text-white/20" />
                  </Link>
                ))}
              </div>

              {/* CTA to become breeder */}
              <div className="mt-4 p-3 bg-[#D74709]/5 border border-[#D74709]/15 rounded-lg">
                <p className="text-xs font-semibold text-[#D74709] mb-1">¿Eres criador?</p>
                <p className="text-[11px] text-white/40 mb-2">Crea tu criadero para gestionar camadas, CRM y más.</p>
                <Link href="/kennel" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D74709] hover:text-[#c03d07] transition">
                  <Store className="w-3.5 h-3.5" /> Crear criadero <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Vet reminders widget */}
      {(vetRemindersRes.data || []).length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 mb-5 sm:mb-6">
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
                <div key={r.id} className={`flex items-center gap-3 rounded-lg p-2.5 ${isOverdue ? 'bg-red-500/5' : 'bg-white/[0.03]'}`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
                    <Stethoscope className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{r.title}</p>
                    <p className="text-[10px] text-white/30">{dog?.name || '?'}</p>
                  </div>
                  <span className={`text-xs font-semibold ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
                    {new Date(r.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="mb-5 sm:mb-6">
        <Achievements achievements={achievements} />
      </div>

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
                  className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/50 transition group">
                  <div className="aspect-square bg-white/5 relative">
                    {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/10"><PawPrint className="w-10 h-10" /></div>}
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: sexColor }} />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate group-hover:text-[#D74709] transition">{dog.name}</p>
                    {dog.breed && <p className="text-[10px] text-white/40 truncate">{(dog.breed as any).name}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white/40">No tienes perros aún</p>
            <Link href="/dogs" className="text-sm text-[#D74709] hover:underline mt-2 inline-block">Añade tu primer perro</Link>
          </div>
        )}
      </div>
    </div>
  )
}
