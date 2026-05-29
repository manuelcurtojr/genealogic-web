import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import CalendarSubnav from '@/components/calendar/calendar-subnav'
import ReproWorkspace from '@/components/reproduccion/repro-workspace'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: females } = await supabase
    .from('dogs')
    .select('id, name, slug, thumbnail_url, birth_date')
    .eq('owner_id', user.id)
    .eq('sex', 'female')
    .order('name')

  const Header = () => (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Crianza</p>
      <h1 className="mt-1.5 text-[28px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
        Calendario reproductivo
      </h1>
      <p className="mt-2 text-[13.5px] sm:text-[14px] text-body leading-snug">
        Elige una hembra para ver su ciclo de celo, su estado y su año reproductivo. Los celos futuros se estiman a partir del historial.
      </p>
    </div>
  )

  if (!females || females.length === 0) {
    return (
      <div className="space-y-6">
        <CalendarSubnav />
        <Header />
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-20 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">No tienes hembras registradas. Añade hembras a tu criadero para empezar a planificar.</p>
          <Link href="/dogs/new" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90">
            Añadir hembra
          </Link>
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
      <CalendarSubnav />
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
