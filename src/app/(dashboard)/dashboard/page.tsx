import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Dog, Baby, PawPrint, Tag, Plus, Stethoscope, ArrowRight, Search, Crown } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import StatCard from '@/components/dashboard/stat-card'
import DailyCheckIn from '@/components/dashboard/daily-checkin'
import OnboardingCard from '@/components/onboarding/onboarding-card'
import OnboardingCardOwner from '@/components/onboarding/onboarding-card-owner'
import WelcomeNoKennel from '@/components/onboarding/welcome-no-kennel'
import WelcomeOwner from '@/components/onboarding/welcome-owner'
import RoleSelector from '@/components/onboarding/role-selector'
import { getOnboardingStatus } from '@/lib/onboarding/checklist'
import { getOwnerOnboardingStatus } from '@/lib/onboarding/checklist-owner'
import { hasProAccess } from '@/lib/permissions'
import { getEffectiveRoles } from '@/lib/auth/roles'
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
    .select('display_name, avatar_url, email, created_at, plan, onboarding_intent')
    .eq('id', user.id)
    .single()

  // Get kennel
  const { data: kennelArr } = await supabase.from('kennels').select('id, name').eq('owner_id', user.id).limit(1)
  const kennel = kennelArr?.[0] || null
  const isBreeder = !!kennel

  // SIN KENNEL: ramificar según onboarding_intent
  //   - null              → RoleSelector (Paso 0, elegir rol)
  //   - 'owner'           → WelcomeOwner + checklist owner
  //   - 'breeder'         → WelcomeNoKennel ("crea tu kennel")
  // El campo se rellena automáticamente con backfill para users existentes
  // (ver migration 20260610_profiles_onboarding_intent.sql).
  if (!isBreeder) {
    const intent = (profile as { onboarding_intent?: 'breeder' | 'owner' | null })?.onboarding_intent ?? null

    // Paso 0: todavía no eligió
    if (!intent) {
      return <RoleSelector displayName={profile?.display_name || null} />
    }

    const roles = await getEffectiveRoles(user.id)

    // Rama owner: welcome + checklist propio
    if (intent === 'owner') {
      const ownerStatus = await getOwnerOnboardingStatus({
        userId: user.id,
        hasReservations: roles.isClient,
      })
      return (
        <div className="space-y-6 sm:space-y-8">
          <WelcomeOwner
            displayName={profile?.display_name || null}
            hasReservations={roles.isClient}
          />
          {!ownerStatus.requiredComplete && (
            <OnboardingCardOwner userId={user.id} status={ownerStatus} />
          )}
        </div>
      )
    }

    // Rama breeder (sin kennel todavía): CTA crear criadero
    return (
      <WelcomeNoKennel
        displayName={profile?.display_name || null}
        isClient={roles.isClient}
      />
    )
  }

  // CON KENNEL: cargar estado de onboarding en paralelo al resto
  const userPlan = (profile as { plan?: string })?.plan || 'free'
  const isPro = hasProAccess(userPlan)
  const onboardingStatus = await getOnboardingStatus({
    kennelId: kennel.id,
    userId: user.id,
    isPro,
  })

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
    <div className="space-y-8 sm:space-y-10">
      {/* Onboarding checklist — solo si faltan pasos required y user no la
       *  ha dismisseado. La card decide visibilidad sola; aquí siempre la
       *  pasamos para que se hidrate con el localStorage. */}
      {!onboardingStatus.requiredComplete && (
        <OnboardingCard kennelId={kennel.id} status={onboardingStatus} />
      )}

      {/* PageHeader Cal — eyebrow + display title + subtitle + CTAs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted capitalize">
            {today}
          </p>
          <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
            Hola, {profile?.display_name || (isBreeder ? 'Criador' : 'Propietario')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dogs" className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90">
            <Plus className="h-4 w-4" /> Perro
          </Link>
          {isBreeder && (
            <Link href="/litters" className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-medium text-body transition-colors hover:bg-surface-soft">
              <Baby className="h-4 w-4" /> Camada
            </Link>
          )}
          <Link href="/search" className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-medium text-body transition-colors hover:bg-surface-soft">
            <Search className="h-4 w-4" /> Buscar
          </Link>
        </div>
      </div>

      {/* Daily Check-In Cal — resumen diario solo para criadores */}
      {isBreeder && <DailyCheckIn userId={user.id} />}

      {/* KPIs Cal — icon arriba con label, número grande tabular */}
      {isBreeder ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Dog} label="Perros" value={dogCount} accentColor="#fb923c" sub="en tu criadero" href="/dogs" />
          <StatCard icon={Tag} label="En venta" value={forSaleCount} accentColor="#34d399" sub="cachorros publicados" href="/dogs?for_sale=1" />
          <StatCard icon={Baby} label="Camadas" value={littersRes.count || 0} accentColor="#8b5cf6" sub="totales registradas" href="/litters" />
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Dog} label="Mis perros" value={dogCount} accentColor="#fb923c" sub="en tu cuenta" href="/dogs" />
          <StatCard icon={Stethoscope} label="Registros vet." value={vetRes.count || 0} accentColor="#3b82f6" sub="historiales clínicos" href="/vet" />
          <StatCard icon={Tag} label="En venta" value={forSaleCount} accentColor="#34d399" sub="publicados" href="/dogs?for_sale=1" />
        </section>
      )}

      {/* Breeder: Active litters — Cal style con header h2 22px + lista en card canvas */}
      {isBreeder ? (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">Camadas activas</h2>
            <Link href="/litters" className="text-[13px] font-medium text-body hover:text-ink">
              Ver todas →
            </Link>
          </div>
          {(activeLittersRes.data || []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-12 text-center">
              <Baby className="mx-auto h-8 w-8 text-muted" />
              <p className="mt-3 text-[14px] text-body">Sin camadas activas. Cuando planifiques o cruces, aparecerán aquí.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
              <ul className="divide-y divide-hairline-soft">
                {(activeLittersRes.data || []).map((litter: any) => (
                  <li key={litter.id}>
                    <Link href={`/litters/${litter.id}`} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-soft">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#8b5cf6' }}>
                        <Baby className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-ink truncate">
                          {(litter.father as any)?.name || '?'} × {(litter.mother as any)?.name || '?'}
                        </p>
                        <p className="text-[12.5px] text-muted">
                          {litter.status === 'mated' ? 'En gestación' : 'Planificada'}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        /* Owner view: feature cards Cal style con iconos pastel */
        <section>
          <h2 className="mb-5 text-[22px] font-semibold tracking-[-0.04em] text-ink">Operativa</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Dog, label: 'Mis perros', desc: 'Gestiona el registro de tus perros y sus genealogías.', color: '#fb923c', href: '/dogs' },
              { icon: Search, label: 'Buscar perros', desc: 'Explora el registro público de perros con genealogía verificable.', color: '#8b5cf6', href: '/search' },
              { icon: Stethoscope, label: 'Veterinario', desc: 'Historial clínico y recordatorios de vacunas para cada perro.', color: '#3b82f6', href: '/vet' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="group block rounded-xl bg-surface-card p-6 transition-colors hover:bg-[#eaeaea]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-canvas shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <item.icon className="h-5 w-5" style={{ color: item.color }} />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.02em] text-ink">{item.label}</h3>
                <p className="mt-1.5 text-[13.5px] leading-[1.5] text-body">{item.desc}</p>
              </Link>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-hairline bg-surface-soft px-5 py-4">
            <p className="text-[14px] font-semibold text-ink">¿Eres criador?</p>
            <p className="mt-1 text-[13px] text-body">
              Mejora tu plan para gestionar tu criadero, camadas y conectar con Pawdoq Breeders.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink hover:opacity-80"
            >
              <Crown className="h-3.5 w-3.5" /> Ver planes →
            </Link>
          </div>
        </section>
      )}

      {/* Vet reminders widget */}
      {(vetRemindersRes.data || []).length > 0 && (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">
              Próximos recordatorios vet.
            </h2>
            <Link href="/vet" className="text-[13px] font-medium text-body hover:text-ink">
              Ver todos →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
            <ul className="divide-y divide-hairline-soft">
              {(vetRemindersRes.data || []).map((r: any) => {
                const dog = r.dog as any
                const isOverdue = r.due_date < new Date().toISOString().split('T')[0]
                const typeColors: Record<string, string> = { vaccine: '#34d399', deworming: '#f59e0b', checkup: '#3b82f6', custom: '#8b5cf6' }
                const color = typeColors[r.type] || '#8b5cf6'
                return (
                  <li key={r.id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-soft">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: color }}>
                      <Stethoscope className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-ink truncate">{r.title}</p>
                      <p className="text-[12.5px] text-muted">{dog?.name || '?'}</p>
                    </div>
                    <span className={`text-[12px] font-medium tabular-nums ${isOverdue ? 'text-[color:var(--error)]' : 'text-muted'}`}>
                      {new Date(r.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Recent dogs */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">Perros recientes</h2>
          <Link href="/dogs" className="text-[13px] font-medium text-body hover:text-ink">
            Ver todos →
          </Link>
        </div>
        {recentDogsRes.data && recentDogsRes.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
            {recentDogsRes.data.map((dog: any) => {
              const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#888'
              return (
                <Link
                  key={dog.id}
                  href={`/dogs/${dog.slug || dog.id}`}
                  className="group block overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
                >
                  <div className="aspect-square bg-surface-card relative">
                    {dog.thumbnail_url
                      ? <img src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-muted"><PawPrint className="h-10 w-10" /></div>
                    }
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: sexColor }} />
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-medium text-ink truncate">{dog.name}</p>
                    {dog.breed && <p className="mt-0.5 text-[11.5px] text-muted truncate">{(dog.breed as any).name}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-12 text-center">
            <PawPrint className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-3 text-[14px] text-body">No tienes perros aún.</p>
            <Link href="/dogs" className="mt-3 inline-block text-[13px] font-medium text-ink hover:opacity-80">
              Añade tu primer perro →
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
