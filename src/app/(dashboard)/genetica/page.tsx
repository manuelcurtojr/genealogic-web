import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Dna, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import GenotypeEditor from '@/components/genetica/genotype-editor'
import DogPicker from '@/components/dogs/dog-picker'
import { hasProFeatures, isEnterpriseUser, normalizePlan } from '@/lib/permissions'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

/**
 * /genetica — registro de genotipo (color visible o DNA) por perro.
 *
 * Layout responsive:
 *   - Desktop (lg+): sidebar de perros con filtros (búsqueda, raza, sexo)
 *     a la izquierda + editor del perro elegido a la derecha.
 *   - Mobile (<lg): si NO hay perro elegido, se muestra solo el picker
 *     (buscar y filtrar es la única tarea hasta seleccionar). Cuando se
 *     elige uno, el picker se oculta y aparece el editor full-width con
 *     un botón "← Cambiar perro" arriba para volver al picker.
 */
export default async function GeneticaPage({
  searchParams,
}: {
  searchParams: Promise<{ dog?: string }>
}) {
  const { dog: queryDog } = await searchParams
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Gate REAL de plan: Genotipos es feature de Kennel Pro (49€). El flag
  // requiresPro del sidebar es solo cosmético; sin esto cualquiera abría la
  // página por URL. Si no tiene plan de pago → /pricing.
  const [dogsRes, allColorsRes, profileRes] = await Promise.all([
    supabase
      .from('dogs')
      .select('id, name, slug, sex, thumbnail_url, breed_id, color_id, breed:breeds(name)')
      .eq('owner_id', user.id)
      .order('name'),
    supabase.from('colors').select('id, name').order('name'),
    supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle(),
  ])
  if (!isEnterpriseUser(user.id) && !hasProFeatures(normalizePlan(profileRes.data?.plan))) {
    redirect('/pricing')
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dogs = (dogsRes.data || []) as any[]
  const allColors = allColorsRes.data || []

  // En mobile no auto-seleccionamos el primer perro — queremos que el usuario
  // elija explícitamente vía el picker. En desktop sí (para que el editor
  // no salga vacío de inicio).
  const selectedDogId = queryDog || null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedDog = selectedDogId ? dogs.find((d: any) => d.id === selectedDogId) || null : null

  // Cargar genotipos DNA + observación visual + colores filtrados por raza
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let genotypes: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let observation: any = null
  let breedColors: { id: string; name: string }[] = []
  if (selectedDog) {
    const [gtRes, obsRes, bcRes] = await Promise.all([
      supabase
        .from('dog_genotypes')
        .select('id, locus, allele_1, allele_2, source, confidence, notes')
        .eq('dog_id', selectedDog.id),
      supabase
        .from('dog_color_observations')
        .select('id, color_id, coat_length, white_pattern, has_merle, has_mask, has_tan_points, has_brindle, is_diluted, notes')
        .eq('dog_id', selectedDog.id)
        .maybeSingle(),
      selectedDog.breed_id
        ? supabase
            .from('breed_colors')
            .select('color:colors(id, name)')
            .eq('breed_id', selectedDog.breed_id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : Promise.resolve({ data: [] as any[] }),
    ])
    genotypes = gtRes.data || []
    observation = obsRes.data || null
    breedColors = ((bcRes.data || []) as Array<{ color: { id: string; name: string } | { id: string; name: string }[] | null }>)
      .map(r => Array.isArray(r.color) ? r.color[0] : r.color)
      .filter((c): c is { id: string; name: string } => !!c)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Crianza')}</p>
        <h1 className="mt-1.5 text-[28px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          {t('Genotipos')}
        </h1>
        <p className="mt-2 text-[13.5px] sm:text-[14px] text-body leading-snug">
          {t('Registra el color visible de tus perros (lo más común) o su genotipo DNA si tienes tests. Los datos alimentan la predicción de cruces en el planificador.')}
        </p>
      </div>

      {!dogs || dogs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-20 text-center">
          <Dna className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">
            {t('No tienes perros registrados. Añade perros para empezar.')}
          </p>
          <Link
            href="/dogs/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90"
          >
            {t('Añadir perro')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Picker — siempre visible en desktop, oculto en mobile cuando hay
              perro seleccionado (entonces el editor toma todo el ancho). */}
          <DogPicker
            dogs={dogs}
            selectedDogId={selectedDogId}
            routerPath="/genetica"
            hideOnMobile={!!selectedDog}
            label={t('Mis perros')}
          />

          {/* Editor (o estado vacío). En mobile cuando hay selectedDog,
              ocupa todo el ancho porque el picker se ha ocultado. */}
          {selectedDog ? (
            <div className="min-w-0">
              {/* Botón "Cambiar perro" — solo mobile cuando hay perro seleccionado */}
              <Link
                href="/genetica"
                className="lg:hidden mb-3 inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[12.5px] font-semibold text-body hover:text-ink hover:border-ink/30 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {t('Cambiar perro')}
              </Link>
              <GenotypeEditor
                dog={{
                  id: selectedDog.id,
                  name: selectedDog.name,
                  slug: selectedDog.slug,
                  sex: selectedDog.sex,
                  thumbnail_url: selectedDog.thumbnail_url,
                  breed_id: selectedDog.breed_id,
                  color_id: selectedDog.color_id,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  breed: Array.isArray((selectedDog as any).breed)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? (selectedDog as any).breed[0] || null
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    : (selectedDog as any).breed || null,
                }}
                initialGenotypes={genotypes}
                breedColors={breedColors}
                allColors={allColors}
                initialObservation={observation}
              />
            </div>
          ) : (
            // Sin perro seleccionado: en desktop placeholder, en mobile no se
            // ve (el picker ocupa todo y el padre no muestra editor).
            <div className="hidden lg:flex rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-20 items-center justify-center text-center text-[14px] text-muted">
              {t('Selecciona un perro para editar su genética.')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
