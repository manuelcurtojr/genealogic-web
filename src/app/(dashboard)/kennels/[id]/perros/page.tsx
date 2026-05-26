import { createClient } from '@/lib/supabase/server'
import { loadProPage } from '@/lib/kennel/pro-page-loader'
import { sortDogsPhotoFirst } from '@/lib/dogs/sort'
import PerrosCatalog from '@/components/kennel/perros-catalog'

export const dynamic = 'force-dynamic'

/**
 * Catálogo completo del criadero. Sin shell estrecho — usa el ancho
 * disponible del dashboard para mostrar más cards por fila. Buscador +
 * filtro de raza/sexo + tabs (Reproductores · Venta · Camadas · Producido).
 *
 * Filtrado es client-side: el server entrega TODO el dataset del kennel
 * (perros + camadas) y el cliente busca/filtra sin round-trips.
 */
export default async function KennelPerrosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { kennel } = await loadProPage({ kennelId: id, pageId: null })

  const supabase = await createClient()
  const [dogsRes, littersRes] = await Promise.all([
    supabase
      .from('dogs')
      .select('id, slug, name, sex, thumbnail_url, is_reproductive, is_for_sale, sale_price, sale_currency, sale_location, breed:breeds(name)')
      .eq('kennel_id', kennel.id)
      .or('show_in_kennel.is.null,show_in_kennel.eq.true')
      .order('name'),
    supabase
      .from('litters')
      .select('id, status, birth_date, mating_date, breed:breeds(name), father:dogs!litters_father_id_fkey(id, name, thumbnail_url), mother:dogs!litters_mother_id_fkey(id, name, thumbnail_url)')
      .eq('owner_id', kennel.owner_id)
      .eq('show_in_kennel', true)
      .order('created_at', { ascending: false }),
  ])

  // Normalización del join `breed` (PostgREST a veces lo tipa como array)
  type RawDog = Record<string, unknown> & { breed?: unknown }
  const normalizeDog = (d: RawDog) => {
    const br = d.breed
    const breed = Array.isArray(br) ? br[0] : br
    return { ...d, breed: breed || null }
  }
  type RawLitter = Record<string, unknown> & { breed?: unknown; father?: unknown; mother?: unknown }
  const normalizeLitter = (l: RawLitter) => {
    const br = l.breed, fa = l.father, mo = l.mother
    return {
      ...l,
      breed:  Array.isArray(br) ? br[0] : br,
      father: Array.isArray(fa) ? fa[0] : fa,
      mother: Array.isArray(mo) ? mo[0] : mo,
    }
  }

  const dogsRaw = (dogsRes.data || []).map(normalizeDog) as unknown as Parameters<typeof sortDogsPhotoFirst>[0]
  const dogs = sortDogsPhotoFirst(dogsRaw)
  const litters = (littersRes.data || []).map(normalizeLitter) as unknown as Array<{
    id: string; status: string; birth_date: string | null; mating_date: string | null;
    breed?: { name?: string } | null;
    father?: { id: string; name: string; thumbnail_url: string | null } | null;
    mother?: { id: string; name: string; thumbnail_url: string | null } | null;
  }>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forSale = dogs.filter((d: any) => d.is_for_sale)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reproductores = dogs.filter((d: any) => d.is_reproductive && !d.is_for_sale)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const criados = dogs.filter((d: any) => !d.is_reproductive && !d.is_for_sale)
  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$', COP: '$', ARS: '$', CLP: '$' }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Catálogo</p>
        <h1 className="mt-1 text-[28px] sm:text-[36px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
          Nuestros perros
        </h1>
        <p className="mt-2 text-[14px] sm:text-[15px] text-body leading-[1.55] max-w-prose">
          Reproductores activos, cachorros en venta, camadas planificadas y producidos por el criadero.
        </p>
      </header>

      <PerrosCatalog
        kennelName={kennel.name}
        reproductores={reproductores}
        forSale={forSale}
        litters={litters}
        criados={criados}
        currencySymbol={currencySymbol}
      />
    </div>
  )
}
