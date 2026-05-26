import { createClient } from '@/lib/supabase/server'
import { loadProPage } from '@/lib/kennel/pro-page-loader'
import { sortDogsPhotoFirst } from '@/lib/dogs/sort'
import KennelPublicTabs from '@/components/kennel/kennel-public-tabs'
import { ProPageShell } from '@/components/kennel/pro-page-shell'

export const dynamic = 'force-dynamic'

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

  const dogs = sortDogsPhotoFirst(dogsRes.data || [])
  const litters = littersRes.data || []
  const forSale = dogs.filter((d: { is_for_sale: boolean | null }) => d.is_for_sale)
  const reproductores = dogs.filter((d: { is_reproductive: boolean | null; is_for_sale: boolean | null }) => d.is_reproductive && !d.is_for_sale)
  const criados = dogs.filter((d: { is_reproductive: boolean | null; is_for_sale: boolean | null }) => !d.is_reproductive && !d.is_for_sale)
  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$', COP: '$', ARS: '$', CLP: '$' }

  return (
    <ProPageShell
      eyebrow="Catálogo"
      title="Nuestros perros"
      description="Reproductores activos, cachorros en venta, camadas planificadas y producidos por el criadero."
    >
      <KennelPublicTabs
        kennelName={kennel.name}
        reproductores={reproductores}
        forSale={forSale}
        litters={litters}
        criados={criados}
        currencySymbol={currencySymbol}
      />
    </ProPageShell>
  )
}
