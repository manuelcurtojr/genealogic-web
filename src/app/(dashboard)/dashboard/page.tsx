import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { isIosUserAgent } from '@/lib/platform'
import { Dog, Baby, PawPrint, Tag, Plus, Stethoscope, ArrowRight, Search, BookOpen, Store, Compass, Bell, Syringe, Bug, Calendar, AlertCircle, Clock, CalendarClock } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import StatCard from '@/components/dashboard/stat-card'
import DailyCheckIn from '@/components/dashboard/daily-checkin'
import OnboardingCard from '@/components/onboarding/onboarding-card'
import OnboardingCardOwner from '@/components/onboarding/onboarding-card-owner'
import WelcomeNoKennel from '@/components/onboarding/welcome-no-kennel'
import WelcomeOwner from '@/components/onboarding/welcome-owner'
import AddDogButton from '@/components/dogs/add-dog-button'
import { getOnboardingStatus } from '@/lib/onboarding/checklist'
import { getOwnerOnboardingStatus } from '@/lib/onboarding/checklist-owner'
import { hasProAccess } from '@/lib/permissions'
import { getEffectiveRoles } from '@/lib/auth/roles'
import { allPosts } from '@/content/blog'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { Img } from '@/components/ui/img'
import Link from 'next/link'

export default async function DashboardPage() {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Detección iOS WebView (App Store 3.1.1) — filtra pasos B2B del onboarding
  const hdrs = await headers()
  const isIos = isIosUserAgent(hdrs.get('user-agent'))

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

  // SIN KENNEL — owner-first:
  //   - 'breeder' (eligió criador explícitamente) → WelcomeNoKennel ("crea tu kennel")
  //   - resto (propietario, o sin elegir todavía)  → WelcomeOwner + checklist propietario
  // El propietario es el caso POR DEFECTO. Antes un RoleSelector de "Paso 0" le
  // ofrecía a un propietario crear criadero; se retiró por el modelo owner-first.
  // Para pasarse a criador, WelcomeOwner tiene el botón "¿Me equivoqué — soy criador?".
  if (!isBreeder) {
    const intent = (profile as { onboarding_intent?: 'breeder' | 'owner' | null })?.onboarding_intent ?? null
    const roles = await getEffectiveRoles(user.id)

    // Solo un CRIADOR explícito ve el onboarding de crear criadero.
    if (intent === 'breeder') {
      return (
        <WelcomeNoKennel
          displayName={profile?.display_name || null}
          isClient={roles.isClient}
        />
      )
    }

    // Rama owner. Si TODAVÍA no tiene perros (ni registrados por él ni
    // transferidos por un criador tras una entrega), mostramos el welcome +
    // checklist de onboarding. Pero si YA tiene al menos un perro, saltamos el
    // onboarding y cae directo al escritorio normal de abajo, que ya tiene su
    // variante de propietario ("Mis perros", "Operativa", etc.).
    const { count: ownerDogCount } = await supabase
      .from('dogs')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)

    if (!ownerDogCount) {
      const ownerStatus = await getOwnerOnboardingStatus({
        userId: user.id,
        hasReservations: roles.isClient,
      })
      return (
        <div className="space-y-6 sm:space-y-8">
          <WelcomeOwner
            userId={user.id}
            displayName={profile?.display_name || null}
            hasReservations={roles.isClient}
          />
          {!ownerStatus.requiredComplete && (
            <OnboardingCardOwner userId={user.id} status={ownerStatus} />
          )}
        </div>
      )
    }
    // owner CON perros → sin return: continúa al escritorio normal de abajo.
  }

  // CON KENNEL: cargar estado de onboarding en paralelo al resto
  const userPlan = (profile as { plan?: string })?.plan || 'free'
  const isPro = hasProAccess(userPlan)
  // El checklist de onboarding de CRIADOR solo aplica si hay kennel. Un owner
  // con perros que cae aquí (sin kennel) no tiene checklist de criador.
  const onboardingStatus = kennel
    ? await getOnboardingStatus({
        kennelId: kennel.id,
        userId: user.id,
        isPro,
        isIos,
      })
    : null

  // Fecha máxima para vet reminders: 14 días desde hoy. Como esto es un
  // async Server Component con `force-dynamic`, Date.now() se evalúa una
  // sola vez por request; la regla react-hooks/purity está pensada para
  // client components y aquí es un falso positivo.
  // eslint-disable-next-line react-hooks/purity
  const reminderMaxDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  // Fetch dashboard data in parallel
  const [
    dogsRes, littersRes, vetRes, recentDogsRes,
    activeLittersRes, forSaleRes, vetRemindersRes,
    breedsCountRes,
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
    supabase.from('vet_reminders').select('id, title, type, due_date, dog:dogs(name, sex)').eq('owner_id', user.id).is('completed_date', null).lte('due_date', reminderMaxDate).order('due_date').limit(5),
    // Conteo de razas para el panel "Explorar Genealogic"
    supabase.from('breeds').select('id', { count: 'exact', head: true }),
  ])

  const breedsCount = breedsCountRes.count || 0
  const blogPostsCount = allPosts.length

  const dogCount = dogsRes.count || 0
  const forSaleCount = forSaleRes.count || 0

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Onboarding checklist — solo si faltan pasos required y user no la
       *  ha dismisseado. La card decide visibilidad sola; aquí siempre la
       *  pasamos para que se hidrate con el localStorage. */}
      {kennel && onboardingStatus && !onboardingStatus.requiredComplete && (
        <OnboardingCard kennelId={kennel.id} status={onboardingStatus} />
      )}

      {/* PageHeader Cal — eyebrow + display title + subtitle + CTAs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted capitalize">
            {today}
          </p>
          <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
            {t('Hola')}, {profile?.display_name || (isBreeder ? t('Criador') : t('Propietario'))}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isBreeder ? (
            <>
              <Link href="/dogs" className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90">
                <Plus className="h-4 w-4" /> {t('Perro')}
              </Link>
              <Link href="/litters" className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-medium text-body transition-colors hover:bg-surface-soft">
                <Baby className="h-4 w-4" /> {t('Camada')}
              </Link>
            </>
          ) : (
            /* OWNER: CTA primario = abrir el popup de "Añadir perro" (no /dogs).
               El AddDogButton se estiliza igual que el botón ink primario. */
            <AddDogButton userId={user.id} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90">
              <Plus className="h-4 w-4" /> {t('Añadir perro')}
            </AddDogButton>
          )}
          <Link href="/search" className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-medium text-body transition-colors hover:bg-surface-soft">
            <Search className="h-4 w-4" /> {t('Buscar')}
          </Link>
        </div>
      </div>

      {/* Daily Check-In Cal — resumen diario solo para criadores. Agrega
          recordatorios de vet + eventos del calendario y enlaza a /calendar. */}
      {isBreeder && <DailyCheckIn userId={user.id} />}

      {/* KPIs Cal — icon arriba con label, número grande tabular */}
      {isBreeder ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Dog} label={t('Perros')} value={dogCount} accentColor="#fb923c" sub={t('en tu criadero')} href="/dogs" />
          <StatCard icon={Tag} label={t('En venta')} value={forSaleCount} accentColor="#34d399" sub={t('cachorros publicados')} href="/dogs?for_sale=1" />
          <StatCard icon={Baby} label={t('Camadas')} value={littersRes.count || 0} accentColor="#8b5cf6" sub={t('totales registradas')} href="/litters" />
        </section>
      ) : (
        /* OWNER KPIs — solo lo útil para un propietario: cuántos perros tiene y
           cuántos recordatorios vet. tiene pendientes. Nada de métricas de cría
           ("En venta", camadas) ni "Registros vet." (redundante con la agenda). */
        <section className="grid gap-4 sm:grid-cols-2">
          <StatCard icon={Dog} label={t('Mis perros')} value={dogCount} accentColor="#fb923c" sub={t('en tu cuenta')} href="/dogs" />
          <StatCard icon={Bell} label={t('Recordatorios pendientes')} value={(vetRemindersRes.data || []).length} accentColor="var(--brand)" sub={t('próximos 14 días')} href="/calendar" />
        </section>
      )}

      {/* Breeder: Active litters — Cal style con header h2 22px + lista en card canvas */}
      {isBreeder && (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">{t('Camadas activas')}</h2>
            <Link href="/litters" className="text-[13px] font-medium text-body hover:text-ink">
              {t('Ver todas →')}
            </Link>
          </div>
          {(activeLittersRes.data || []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-12 text-center">
              <Baby className="mx-auto h-8 w-8 text-muted" />
              <p className="mt-3 text-[14px] text-body">{t('Sin camadas activas. Cuando planifiques o cruces, aparecerán aquí.')}</p>
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
                          {litter.status === 'mated' ? t('En gestación') : t('Planificada')}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Próximos recordatorios — agenda vet. con el MISMO lenguaje visual que la
          pestaña Salud: icono+color por tipo, semáforo de estado (Vencido rojo /
          Hoy·Pronto ámbar / futuro neutro) y fecha. Solo si hay recordatorios. */}
      {(vetRemindersRes.data || []).length > 0 && (() => {
        const todayISO = new Date().toISOString().split('T')[0]
        const soonISO = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
        const reminderTypes: Record<string, { color: string; icon: React.ElementType }> = {
          vaccine: { color: '#10B981', icon: Syringe },
          deworming: { color: '#F59E0B', icon: Bug },
          checkup: { color: '#3B82F6', icon: Stethoscope },
          custom: { color: '#8B5CF6', icon: Calendar },
        }
        return (
          <section>
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">
                {t('Próximos recordatorios')}
              </h2>
              <Link href="/calendar" className="text-[13px] font-medium text-body hover:text-ink">
                {t('Ver todos →')}
              </Link>
            </div>
            <div className="space-y-1.5">
              {(vetRemindersRes.data || []).map((r: any) => {
                const dog = r.dog as any
                const conf = reminderTypes[r.type] || reminderTypes.custom
                const Icon = conf.icon
                const isOverdue = r.due_date < todayISO
                const isDueToday = r.due_date === todayISO
                const isSoon = !isOverdue && !isDueToday && r.due_date <= soonISO
                // Semáforo: rojo (vencido), ámbar (hoy/pronto ≤14d), neutro (futuro).
                const tone = isOverdue
                  ? { box: 'border-red-500/30 bg-red-500/[0.06]', text: 'text-red-600', StateIcon: AlertCircle, state: t('Vencido') }
                  : (isDueToday || isSoon)
                    ? { box: 'border-amber-500/30 bg-amber-500/[0.07]', text: 'text-amber-700', StateIcon: Clock, state: isDueToday ? t('Hoy') : t('Pronto') }
                    : { box: 'border-hairline bg-canvas', text: 'text-muted', StateIcon: CalendarClock, state: '' }
                const StateIcon = tone.StateIcon
                return (
                  <Link
                    key={r.id}
                    href="/calendar"
                    className={`flex items-center gap-3 rounded-xl border p-3 transition hover:border-ink/20 ${tone.box}`}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: conf.color + '15' }}>
                      <Icon className="h-4 w-4" style={{ color: conf.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-ink truncate">{r.title}</p>
                      <p className={`flex items-center gap-1 text-[11.5px] ${tone.text}`}>
                        <StateIcon className="h-2.5 w-2.5 flex-shrink-0" />
                        {tone.state ? `${tone.state} · ` : ''}
                        {dog?.name ? `${dog.name} · ` : ''}
                        {new Date(r.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })()}

      {/* Explorar Genealogic — siempre visible. La idea es que el dashboard
          NO sea solo "tu data" sino también la puerta a todo el contenido
          público del catálogo: razas con estándar, criaderos, perros
          indexados y artículos del blog. Cuatro cards con icono coloreado y
          chip con conteo dinámico. */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink flex items-center gap-2">
            <Compass className="h-5 w-5 text-[color:var(--brand)]" /> {t('Explorar')} Genealogic
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ExploreCard
            href="/razas"
            icon={Tag}
            color="#D74709"
            title={t('Razas')}
            desc={t('Estándares raciales con historia, foto y catálogo.')}
            count={breedsCount > 0 ? `${breedsCount.toLocaleString('es-ES')} razas` : t('Ver todas')}
          />
          <ExploreCard
            href="/search"
            icon={Search}
            color="#3b82f6"
            title={t('Buscar perros')}
            desc={t('Directorio con genealogías indexables en Google.')}
            count={t('+250.000 perros')}
          />
          <ExploreCard
            href="/kennels"
            icon={Store}
            color="#8b5cf6"
            title={t('Criaderos')}
            desc={t('Conoce criaderos verificados de toda la red.')}
            count={t('Comunidad')}
          />
          <ExploreCard
            href="/blog"
            icon={BookOpen}
            color="#10b981"
            title={t('Blog')}
            desc={t('Guías sobre genética, cría y razas legendarias.')}
            count={`${blogPostsCount} artículos`}
          />
        </div>
      </section>

      {/* Mis perros (owner) / Perros recientes (breeder) — para el propietario
          ESTE es el contenido principal: la rejilla de sus perros. */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">{isBreeder ? t('Perros recientes') : t('Mis perros')}</h2>
          <Link href="/dogs" className="text-[13px] font-medium text-body hover:text-ink">
            {t('Ver todos →')}
          </Link>
        </div>
        {recentDogsRes.data && recentDogsRes.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:gap-4">
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
                      ? <Img w={480} src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover" />
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
            <p className="mt-3 text-[14px] text-body">{t('No tienes perros aún.')}</p>
            <AddDogButton userId={user.id} className="mt-3 inline-block text-[13px] font-medium text-ink hover:opacity-80">
              {t('Añade tu primer perro →')}
            </AddDogButton>
          </div>
        )}
      </section>

      {/* Rampa owner→criador SUTIL: una línea discreta al pie. No empuja a
          /pricing; presenta el producto B2B (Genealogic Breeders) en /criadores
          para quien tenga criadero. Solo para propietarios (un criador ya lo es). */}
      {!isBreeder && (
        <p className="border-t border-hairline pt-6 text-center text-[12.5px] text-muted">
          {t('¿Tienes un criadero?')}{' '}
          <Link href="/criadores" className="font-medium text-body hover:text-ink">
            {t('Conoce Genealogic Breeders →')}
          </Link>
        </p>
      )}
    </div>
  )
}

/**
 * ExploreCard — card del módulo "Explorar Genealogic" del dashboard.
 * Icono coloreado en pastilla, título, descripción de 1 línea, chip con
 * conteo dinámico abajo. Flecha que se desliza al hover. Pensada para que
 * cualquier usuario logueado (criador u owner) tenga atajos a contenido
 * público útil (razas, blog, criaderos, búsqueda).
 */
function ExploreCard({
  href, icon: Icon, color, title, desc, count,
}: {
  href: string
  icon: React.ElementType
  color: string
  title: string
  desc: string
  count: string
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-hairline bg-canvas p-5 transition-all hover:border-ink/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${color}15`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.02em] text-ink">{title}</h3>
      <p className="mt-1 text-[13px] leading-[1.5] text-body line-clamp-2">{desc}</p>
      <p
        className="mt-3 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
        style={{ background: `${color}15`, color }}
      >
        {count}
      </p>
    </Link>
  )
}
