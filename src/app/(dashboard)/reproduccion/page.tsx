import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReproductionGantt from '@/components/reproduccion/reproduction-gantt'
import CalendarSubnav from '@/components/calendar/calendar-subnav'
import { Heart } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ReproduccionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar hembras del criadero (sex = 'female')
  const { data: females } = await supabase
    .from('dogs')
    .select('id, name, slug, thumbnail_url, birth_date')
    .eq('owner_id', user.id)
    .eq('sex', 'female')
    .order('name')

  if (!females || females.length === 0) {
    return (
      <div className="space-y-6">
        <CalendarSubnav />
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Crianza</p>
          <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
            Calendario reproductivo
          </h1>
          <p className="mt-2 text-[14px] text-body">
            Visualiza los ciclos de celo, gestaciones y camadas de tus hembras en una línea de tiempo.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-20 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">
            No tienes hembras registradas. Añade hembras a tu criadero para empezar a planificar.
          </p>
          <Link
            href="/dogs/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90"
          >
            Añadir hembra
          </Link>
        </div>
      </div>
    )
  }

  const femaleIds = females.map((f) => f.id)

  // Cargar todos los heat cycles + litters en paralelo
  const [cyclesRes, littersRes] = await Promise.all([
    supabase
      .from('heat_cycles')
      .select('id, dog_id, start_date, end_date, was_mated, resulted_in_litter_id, notes')
      .eq('owner_id', user.id)
      .in('dog_id', femaleIds)
      .order('start_date', { ascending: true }),
    supabase
      .from('litters')
      .select('id, status, mating_date, birth_date, mother_id, puppy_count')
      .eq('owner_id', user.id)
      .in('mother_id', femaleIds)
      .order('mating_date', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <CalendarSubnav />
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Crianza</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          Calendario reproductivo
        </h1>
        <p className="mt-2 text-[14px] text-body">
          Ciclos de celo, gestaciones y camadas de tus hembras en una línea de tiempo. Los celos futuros se estiman a partir del historial.
        </p>
      </div>

      <ReproductionGantt
        females={females}
        cycles={cyclesRes.data || []}
        litters={littersRes.data || []}
      />
    </div>
  )
}
