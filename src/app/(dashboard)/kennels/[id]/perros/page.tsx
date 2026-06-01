import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { isUUID } from '@/lib/slug'
import { isKennelOnProPlan } from '@/lib/kennel/pro-web'
import { sortDogsByPhotoQuality } from '@/lib/dogs/sort-quality'
import PerrosCatalog from '@/components/kennel/perros-catalog'
import { headers } from 'next/headers'
import { isDynamicSiteHost } from '@/lib/kennel/custom-site'
import type { Metadata } from 'next'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('name, slug, city, country')
    .eq(field, id)
    .maybeSingle()
  if (!kennel) return { title: 'No encontrado' }
  const loc = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const title = `Nuestros perros · ${kennel.name}`
  const description = `Reproductores, cachorros disponibles y ejemplares criados por ${kennel.name}${loc ? ` en ${loc}` : ''}. Cada perro con su genealogía completa y verificable.`
  const canonical = `https://genealogic.io/kennels/${kennel.slug}/perros`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website', locale: 'es_ES' },
  }
}

export default async function KennelPerrosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = getTranslator(await getLocale())
  const supabase = await createClient()

  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, owner_id, name, contact_form_config')
    .eq(field, id)
    .single()
  if (!kennel) notFound()
  if (field === 'id' && kennel.slug && kennel.slug !== id) {
    redirect(`/kennels/${kennel.slug}/perros`)
  }

  let ownerPlan: string | null = null
  if (kennel.owner_id) {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', kennel.owner_id).single()
    ownerPlan = profile?.plan || null
  }
  const isPro = isKennelOnProPlan({ ownerPlan, ownerUserId: kennel.owner_id })
  if (!isPro) redirect(`/kennels/${kennel.slug || kennel.id}`)

  const [dogsRes, littersRes] = await Promise.all([
    supabase
      .from('dogs')
      .select('id, slug, name, sex, thumbnail_url, is_reproductive, is_for_sale, sale_price, sale_currency, sale_location, breed:breeds(name)')
      .eq('kennel_id', kennel.id)
      .or('show_in_kennel.is.null,show_in_kennel.eq.true')
      .is('deceased_at', null)  // ocultar fallecidos del escaparate público
      .order('name'),
    supabase
      .from('litters')
      .select('id, status, birth_date, mating_date, breed:breeds(name), father:dogs!litters_father_id_fkey(id, name, thumbnail_url), mother:dogs!litters_mother_id_fkey(id, name, thumbnail_url)')
      .eq('owner_id', kennel.owner_id)
      .eq('show_in_kennel', true)
      .order('created_at', { ascending: false }),
  ])

  // Normalización joins
  type RawDog = Record<string, unknown> & { breed?: unknown }
  const normalizeDog = (d: RawDog) => {
    const br = d.breed
    return { ...d, breed: Array.isArray(br) ? br[0] : br || null }
  }
  type RawLitter = Record<string, unknown> & { breed?: unknown; father?: unknown; mother?: unknown }
  const normalizeLitter = (l: RawLitter) => ({
    ...l,
    breed:  Array.isArray(l.breed)  ? l.breed[0]  : l.breed,
    father: Array.isArray(l.father) ? l.father[0] : l.father,
    mother: Array.isArray(l.mother) ? l.mother[0] : l.mother,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dogsRaw = (dogsRes.data || []).map(normalizeDog) as any[]

  // Ordenamos por CALIDAD DE FOTO (más fotos en galería = mejor candidato).
  // Cuenta de dog_photos por dog para los del kennel, en una sola query.
  const dogIds = dogsRaw.map(d => d.id as string)
  const photoCount: Record<string, number> = {}
  if (dogIds.length > 0) {
    const { data: photos } = await supabase
      .from('dog_photos')
      .select('dog_id')
      .in('dog_id', dogIds)
    for (const p of (photos || []) as Array<{ dog_id: string }>) {
      photoCount[p.dog_id] = (photoCount[p.dog_id] || 0) + 1
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dogs = sortDogsByPhotoQuality(dogsRaw, photoCount) as any[]
  const litters = (littersRes.data || []).map(normalizeLitter) as unknown as Array<{
    id: string; status: string; birth_date: string | null; mating_date: string | null
    breed?: { name?: string } | null
    father?: { id: string; name: string; thumbnail_url: string | null } | null
    mother?: { id: string; name: string; thumbnail_url: string | null } | null
  }>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forSale = dogs.filter((d: any) => d.is_for_sale)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reproductores = dogs.filter((d: any) => d.is_reproductive && !d.is_for_sale)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const criados = dogs.filter((d: any) => !d.is_reproductive && !d.is_for_sale)
  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$', COP: '$', ARS: '$', CLP: '$' }

  // Bajo el dominio propio del criadero (web dinámica, p.ej. iremacurto.com),
  // las fichas de perro abren el perfil en genealogic.io en una pestaña nueva:
  // allí está toda la herramienta (genealogía, salud, palmarés). En
  // genealogic.io la navegación es interna (/dogs/[slug]).
  const dogsToGenealogic = isDynamicSiteHost((await headers()).get('host'))

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{t('Catálogo')}</p>
        <h1 className="mt-1 text-[28px] sm:text-[36px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
          {t('Nuestros perros')}
        </h1>
        <p className="mt-2 text-[14px] sm:text-[15px] text-body leading-[1.55] max-w-prose">
          {t('Reproductores activos, cachorros en venta, camadas planificadas y producidos por el criadero.')}
        </p>
      </header>

      <PerrosCatalog
        kennelName={kennel.name}
        kennelId={kennel.id}
        contactConfig={kennel.contact_form_config || null}
        reproductores={reproductores}
        forSale={forSale}
        litters={litters}
        criados={criados}
        currencySymbol={currencySymbol}
        dogsToGenealogic={dogsToGenealogic}
      />
    </div>
  )
}
