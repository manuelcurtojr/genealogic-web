import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import CalendarSubnav from '@/components/calendar/calendar-subnav'
import ReproWorkspace from '@/components/reproduccion/repro-workspace'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

/**
 * /reproduccion — calendario reproductivo, patrón maestro–detalle.
 *
 * Izquierda: lista de hembras con su estado (en celo / montada / gestante /
 * reposo) + buscador y filtros. Derecha: detalle de la hembra seleccionada
 * con selector de vistas (Ciclo del celo · Año reproductivo). Sin duplicar
 * la lista de hembras ni el antiguo gantt de líneas.
 */
export default async function ReproduccionPage() {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ¿Es criador? El subnav solo muestra la tab "Reproductivo" a criadores.
  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
  const isBreeder = (kennelArr?.length ?? 0) > 0

  // Solo las hembras marcadas como REPRODUCTORAS aparecen en el calendario de
  // celos (el ❤ en Mis Perros). El resto de hembras del criadero no se
  // gestionan aquí. Las que ya tenían celos/camadas quedaron marcadas por el
  // backfill de la migración 20260711.
  const { data: females } = await supabase
    .from('dogs')
    .select('id, name, slug, thumbnail_url, birth_date')
    .eq('owner_id', user.id)
    .eq('sex', 'female')
    .eq('is_reproductive', true)
    .order('name')

  const Header = () => (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Crianza')}</p>
      <h1 className="mt-1.5 text-[28px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
        {t('Calendario reproductivo')}
      </h1>
      <p className="mt-2 text-[13.5px] sm:text-[14px] text-body leading-snug">
        {t('Elige una de tus reproductoras para ver su ciclo de celo, su estado y su año reproductivo. Los celos futuros se estiman a partir del historial.')}
      </p>
    </div>
  )

  if (!females || females.length === 0) {
    // ¿No tiene hembras en absoluto, o las tiene pero ninguna marcada como
    // reproductora? El mensaje cambia para guiar a la acción correcta.
    const { count: totalFemales } = await supabase
      .from('dogs')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('sex', 'female')
    const hasFemales = (totalFemales || 0) > 0
    return (
      <div className="space-y-6">
        <CalendarSubnav isBreeder={isBreeder} />
        <Header />
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-20 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted" />
          {hasFemales ? (
            <>
              <p className="mt-3 text-[14px] text-body">
                {t('Aún no has marcado ninguna hembra como')} <strong className="text-ink">{t('reproductora')}</strong>. {t('En el calendario reproductivo solo aparecen tus reproductoras.')}
              </p>
              <p className="mt-1.5 text-[13px] text-muted">
                {t('Ve a')} <strong className="text-body">{t('Mis Perros')}</strong> {t('y pulsa el')} <Heart className="inline h-3.5 w-3.5 -mt-0.5 text-pink-500" /> {t('en las hembras que vayas a criar.')}
              </p>
              <Link href="/dogs" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90">
                {t('Ir a Mis Perros')}
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-[14px] text-body">{t('No tienes hembras registradas. Añade hembras a tu criadero para empezar a planificar.')}</p>
              <Link href="/dogs?new=1" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90">
                {t('Añadir hembra')}
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  const femaleIds = females.map((f) => f.id)
  const [cyclesRes, littersRes] = await Promise.all([
    supabase
      .from('heat_cycles')
      .select('id, dog_id, start_date, end_date, was_mated, mating_date, mating_end_date, mating_dates, pregnancy_status, resulted_in_litter_id, notes')
      .eq('owner_id', user.id)
      .in('dog_id', femaleIds)
      .order('start_date', { ascending: true }),
    supabase
      .from('litters')
      .select('id, status, mating_date, birth_date, mother_id, puppy_count')
      .eq('owner_id', user.id)
      .in('mother_id', femaleIds),
  ])

  return (
    <div className="space-y-6">
      <CalendarSubnav isBreeder={isBreeder} />
      <Header />
      <ReproWorkspace
        females={females}
        cycles={cyclesRes.data || []}
        litters={littersRes.data || []}
        userId={user.id}
      />
    </div>
  )
}
