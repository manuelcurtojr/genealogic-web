import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart } from 'lucide-react'
import ReproductionGantt from '@/components/reproduccion/reproduction-gantt'
import CalendarSubnav from '@/components/calendar/calendar-subnav'
import DogPicker from '@/components/dogs/dog-picker'

export const dynamic = 'force-dynamic'

/**
 * /reproduccion — calendario reproductivo de las hembras del criadero.
 *
 * Layout responsive:
 *   - Desktop (lg+): picker lateral de hembras (con filtros raza/búsqueda)
 *     + gantt principal. Sin `?dog=` el gantt muestra TODAS las hembras
 *     (vista panorámica); con `?dog=<id>` filtra a esa hembra concreta.
 *   - Mobile (<lg): el gantt entero con todas las hembras es inviable
 *     (eje horizontal infinito). El usuario DEBE elegir una hembra desde
 *     el picker, y entonces el gantt se renderiza para esa única hembra
 *     ocupando todo el ancho. Botón "← Cambiar hembra" para volver.
 */
export default async function ReproduccionPage({
  searchParams,
}: {
  searchParams: Promise<{ dog?: string }>
}) {
  const { dog: queryDog } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar hembras del criadero
  const { data: femalesRaw } = await supabase
    .from('dogs')
    .select('id, name, slug, sex, thumbnail_url, birth_date, breed_id, breed:breeds(name)')
    .eq('owner_id', user.id)
    .eq('sex', 'female')
    .order('name')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const females = (femalesRaw || []) as any[]

  if (females.length === 0) {
    return (
      <div className="space-y-6">
        <CalendarSubnav />
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Crianza</p>
          <h1 className="mt-1.5 text-[28px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
            Calendario reproductivo
          </h1>
          <p className="mt-2 text-[13.5px] sm:text-[14px] text-body leading-snug">
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

  const selectedDogId = queryDog || null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedFemale = selectedDogId ? females.find((f: any) => f.id === selectedDogId) : null

  // Si hay selección, filtramos a esa hembra. Si no, todas (vista panorámica desktop).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const femalesForGantt: any[] = selectedFemale ? [selectedFemale] : females
  const femaleIdsForQuery = femalesForGantt.map((f) => f.id)

  // Cargar heat cycles + litters para las hembras visibles
  const [cyclesRes, littersRes] = await Promise.all([
    supabase
      .from('heat_cycles')
      .select('id, dog_id, start_date, end_date, was_mated, resulted_in_litter_id, notes')
      .eq('owner_id', user.id)
      .in('dog_id', femaleIdsForQuery)
      .order('start_date', { ascending: true }),
    supabase
      .from('litters')
      .select('id, status, mating_date, birth_date, mother_id, puppy_count')
      .eq('owner_id', user.id)
      .in('mother_id', femaleIdsForQuery)
      .order('mating_date', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <CalendarSubnav />
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Crianza</p>
        <h1 className="mt-1.5 text-[28px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          Calendario reproductivo
        </h1>
        <p className="mt-2 text-[13.5px] sm:text-[14px] text-body leading-snug">
          Ciclos de celo, gestaciones y camadas de tus hembras en una línea de tiempo. Los celos futuros se estiman a partir del historial.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Picker lateral — siempre visible en desktop, oculto en mobile
            cuando hay hembra seleccionada para que el gantt tome todo el ancho. */}
        <DogPicker
          dogs={females}
          selectedDogId={selectedDogId}
          routerPath="/reproduccion"
          hideOnMobile={!!selectedFemale}
          label="Mis hembras"
          femalesOnly
        />

        {/* Gantt — en mobile solo se ve si hay hembra seleccionada (el grid
            colapsa a 1 columna y el picker se oculta). En desktop siempre
            visible: con selección filtra a 1; sin selección muestra todas. */}
        <div className={`min-w-0 ${selectedFemale ? '' : 'hidden lg:block'}`}>
          {selectedFemale && (
            <Link
              href="/reproduccion"
              className="lg:hidden mb-3 inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[12.5px] font-semibold text-body hover:text-ink hover:border-ink/30 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Cambiar hembra
            </Link>
          )}
          <ReproductionGantt
            females={femalesForGantt}
            cycles={cyclesRes.data || []}
            litters={littersRes.data || []}
          />
        </div>
      </div>
    </div>
  )
}
