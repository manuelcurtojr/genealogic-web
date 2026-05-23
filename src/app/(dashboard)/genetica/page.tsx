import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Dna } from 'lucide-react'
import Link from 'next/link'
import GenotypeEditor from '@/components/genetica/genotype-editor'

export const dynamic = 'force-dynamic'

export default async function GeneticaPage({
  searchParams,
}: {
  searchParams: { dog?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [dogsRes, allColorsRes] = await Promise.all([
    supabase
      .from('dogs')
      .select('id, name, slug, sex, thumbnail_url, breed_id, color_id, breed:breeds(name)')
      .eq('owner_id', user.id)
      .order('name'),
    supabase.from('colors').select('id, name').order('name'),
  ])
  const dogs = dogsRes.data || []
  const allColors = allColorsRes.data || []

  const selectedDogId = searchParams.dog || dogs[0]?.id || null
  const selectedDog = dogs.find((d) => d.id === selectedDogId) || null

  // Cargar genotipos DNA + observación visual + colores filtrados por raza
  let genotypes: any[] = []
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
      // Colores del estándar de la raza (si breed_id existe)
      selectedDog.breed_id
        ? supabase
            .from('breed_colors')
            .select('color:colors(id, name)')
            .eq('breed_id', selectedDog.breed_id)
        : Promise.resolve({ data: [] as any[] }),
    ])
    genotypes = gtRes.data || []
    observation = obsRes.data || null
    breedColors = ((bcRes.data || []) as any[])
      .map((r) => r.color)
      .filter((c): c is { id: string; name: string } => !!c)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Crianza</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          Genética
        </h1>
        <p className="mt-2 text-[14px] text-body">
          Registra el color visible de tus perros (lo más común) o su genotipo DNA si tienes tests. Los datos alimentan la predicción de cruces en el planificador.
        </p>
      </div>

      {!dogs || dogs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-20 text-center">
          <Dna className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">
            No tienes perros registrados. Añade perros para empezar.
          </p>
          <Link
            href="/dogs/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90"
          >
            Añadir perro
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Lista de perros */}
          <aside className="rounded-xl border border-hairline bg-canvas p-2">
            <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
              Mis perros
            </p>
            <ul className="space-y-0.5">
              {dogs.map((dog) => (
                <li key={dog.id}>
                  <Link
                    href={`/genetica?dog=${dog.id}`}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-colors ${
                      selectedDogId === dog.id
                        ? 'bg-surface-card font-medium text-ink'
                        : 'text-body hover:bg-surface-soft'
                    }`}
                  >
                    {dog.thumbnail_url ? (
                      <img
                        src={dog.thumbnail_url}
                        alt=""
                        className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-7 w-7 flex-shrink-0 rounded-full bg-surface-card" />
                    )}
                    <span className="truncate">{dog.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {/* Editor */}
          {selectedDog ? (
            <GenotypeEditor
              dog={{
                id: selectedDog.id,
                name: selectedDog.name,
                slug: selectedDog.slug,
                sex: selectedDog.sex,
                thumbnail_url: selectedDog.thumbnail_url,
                breed_id: selectedDog.breed_id,
                color_id: selectedDog.color_id,
                // Supabase devuelve la relación como array; normalizar
                breed: Array.isArray((selectedDog as any).breed)
                  ? (selectedDog as any).breed[0] || null
                  : (selectedDog as any).breed || null,
              }}
              initialGenotypes={genotypes}
              breedColors={breedColors}
              allColors={allColors}
              initialObservation={observation}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-20 text-center text-[14px] text-muted">
              Selecciona un perro para editar su genética.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
