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

  const { data: dogs } = await supabase
    .from('dogs')
    .select('id, name, slug, sex, thumbnail_url')
    .eq('owner_id', user.id)
    .order('name')

  const selectedDogId = searchParams.dog || dogs?.[0]?.id || null
  const selectedDog = dogs?.find((d) => d.id === selectedDogId) || null

  // Cargar genotipos del perro seleccionado
  let genotypes: any[] = []
  if (selectedDog) {
    const { data } = await supabase
      .from('dog_genotypes')
      .select('id, locus, allele_1, allele_2, source, confidence, notes')
      .eq('dog_id', selectedDog.id)
    genotypes = data || []
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Crianza</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          Genética
        </h1>
        <p className="mt-2 text-[14px] text-body">
          Registra los genotipos de tus perros por locus. Los datos se usarán en el planificador de cruces para predecir el color, patrón y características de las camadas.
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
              dog={selectedDog}
              initialGenotypes={genotypes}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-20 text-center text-[14px] text-muted">
              Selecciona un perro para editar su genotipo.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
