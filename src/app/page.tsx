/**
 * Home master de Genealogic — discovery-first.
 *
 * Filosofía: el catálogo público es el mejor argumento de venta. Aquí
 * mostramos counts en vivo, perros recientes y criaderos destacados, y
 * dos puertas grandes hacia /criadores y /propietarios.
 *
 * Esta página NO está dentro del grupo (public) porque Next.js no permite
 * que un route group capture la raíz cuando existe app/page.tsx. Por eso
 * monta el MarketingHeader directamente.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MarketingHeader from '@/components/marketing/marketing-header'
import MarketingFooter from '@/components/marketing/marketing-footer'
import DiscoveryHome from '@/components/marketing/discovery-home'
import { WebSiteJsonLd, SiteNavigationJsonLd } from '@/lib/seo/json-ld'
import { allPosts } from '@/content/blog'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    redirect(profile?.role === 'admin' ? '/admin' : '/dashboard')
  }

  // Admin client para que los counts no se trunquen a 1000 en tablas grandes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // Perro para el mockup "Producto en acción" — usamos Nestor de Irema Curtó
  // explícitamente porque es el perro insignia del criadero piloto (usuario
  // 0) y tiene varias fotos reales. Si por lo que sea no existe (cambio de
  // slug, borrado), el componente hace fallback al primer featuredDog.
  const SHOWCASE_DOG_SLUG = 'nestor-de-irema-curto'

  const [
    dogsCount, kennelsCount, breedsCount,
    featuredDogsRes, mosaicRpcRes,
    topBreedsRes, topKennelsRes,
    showcaseDogRes,
  ] = await Promise.all([
    admin.from('dogs').select('id', { count: 'exact', head: true }),
    admin.from('kennels').select('id', { count: 'exact', head: true }),
    admin.from('breeds').select('id', { count: 'exact', head: true }),
    // Grid editorial: 6 perros recientes con foto.
    admin
      .from('dogs')
      .select('id, name, slug, thumbnail_url, breed:breeds(name)')
      .not('thumbnail_url', 'is', null)
      .eq('is_public', true)
      .is('deceased_at', null)  // ocultar fallecidos del home
      .order('created_at', { ascending: false })
      .limit(6),
    // Mosaico del hero: RPC que garantiza 1 perro aleatorio POR RAZA.
    admin.rpc('get_hero_mosaic_dogs', { p_limit: 12 }),
    // Razas representadas en el home: top 12 por dog_count con thumbnail
    // (prioriza razas que SÍ tienen foto pública para que el mosaico sea
    // visualmente atractivo). RPC dedicado evita N+1.
    admin.rpc('get_home_top_breeds', { p_limit: 12 }),
    // Criaderos destacados: top 6 con su perro estrella como cover. RPC
    // dedicado para no tener que correr una subquery por kennel en el
    // cliente.
    admin.rpc('get_home_top_kennels', { p_limit: 6 }),
    // Showcase dog base — datos directos, sin joins a self-FK porque
    // PostgREST y maybeSingle() los devuelven inconsistentemente cuando
    // el alias es ambiguo. Padres y fotos se resuelven en queries aparte.
    admin
      .from('dogs')
      .select('id, name, slug, thumbnail_url, sex, birth_date, breed_id, color_id, father_id, mother_id')
      .eq('slug', SHOWCASE_DOG_SLUG)
      .maybeSingle(),
  ])

  // Resolver detalles del showcase dog en queries paralelas (padres, color,
  // raza, fotos). Sin esto, Nestor caía al fallback porque el join PostgREST
  // anidado con self-FK fallaba silencioso.
  let showcaseEnriched: {
    breed_name?: string | null
    color_name?: string | null
    father_name?: string | null
    mother_name?: string | null
    photos: string[]
  } = { photos: [] }

  if (showcaseDogRes.data?.id) {
    const sd = showcaseDogRes.data
    const [breedR, colorR, fatherR, motherR, photosR] = await Promise.all([
      sd.breed_id ? admin.from('breeds').select('name').eq('id', sd.breed_id).maybeSingle() : Promise.resolve({ data: null }),
      sd.color_id ? admin.from('colors').select('name').eq('id', sd.color_id).maybeSingle() : Promise.resolve({ data: null }),
      sd.father_id ? admin.from('dogs').select('name').eq('id', sd.father_id).maybeSingle() : Promise.resolve({ data: null }),
      sd.mother_id ? admin.from('dogs').select('name').eq('id', sd.mother_id).maybeSingle() : Promise.resolve({ data: null }),
      admin.from('dog_photos').select('url').eq('dog_id', sd.id).order('position').limit(6),
    ])
    showcaseEnriched = {
      breed_name: breedR.data?.name ?? null,
      color_name: colorR.data?.name ?? null,
      father_name: fatherR.data?.name ?? null,
      mother_name: motherR.data?.name ?? null,
      photos: (photosR.data || []).map((p: { url: string }) => p.url),
    }
  }

  type MosaicRow = { id: string; thumbnail_url: string | null; breed_name: string | null }
  const mosaicPhotos: string[] = ((mosaicRpcRes.data as MosaicRow[] | null) || [])
    .map((d) => d.thumbnail_url)
    .filter(Boolean) as string[]

  // Blog: tomamos los 8 más recientes para el slider.
  const blogPosts = allPosts
    .slice(0, 8)
    .map((p) => ({
      slug: p.meta.slug,
      title: p.meta.title,
      excerpt: p.meta.excerpt,
      category: p.meta.category,
      heroImage: p.meta.heroImage,
      heroAlt: p.meta.heroAlt,
      readMinutes: p.meta.readMinutes,
      date: p.meta.date,
    }))

  return (
    <div className="min-h-screen bg-canvas text-[var(--foreground)] flex flex-col">
      {/* JSON-LD para empujar a Google a mostrar sitelinks + search box en SERP.
          NO garantiza sitelinks (Google los decide por tráfico/autoridad de
          marca), pero sin estos schemas la probabilidad es muy baja. */}
      <WebSiteJsonLd />
      <SiteNavigationJsonLd />
      <MarketingHeader />
      <main className="flex-1">
        <DiscoveryHome
          counts={{
            dogs: dogsCount.count || 0,
            kennels: kennelsCount.count || 0,
            breeds: breedsCount.count || 0,
          }}
          featuredDogs={featuredDogsRes.data || []}
          featuredKennels={topKennelsRes.data || []}
          topBreeds={topBreedsRes.data || []}
          showcaseDog={showcaseDogRes.data ? {
            name: showcaseDogRes.data.name,
            slug: showcaseDogRes.data.slug,
            sex: showcaseDogRes.data.sex,
            birth_date: showcaseDogRes.data.birth_date,
            breed_name: showcaseEnriched.breed_name,
            color_name: showcaseEnriched.color_name,
            father_name: showcaseEnriched.father_name,
            mother_name: showcaseEnriched.mother_name,
            photos: showcaseEnriched.photos,
          } : null}
          blogPosts={blogPosts}
          mosaicPhotos={mosaicPhotos}
        />
      </main>
      <MarketingFooter />
    </div>
  )
}
