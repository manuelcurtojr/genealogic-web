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
    // Showcase dog: ficha completa para el mockup central.
    admin
      .from('dogs')
      .select(`
        id, name, slug, thumbnail_url, sex, birth_date,
        breed:breeds(name),
        color:colors(name),
        father:dogs!dogs_father_id_fkey(name),
        mother:dogs!dogs_mother_id_fkey(name)
      `)
      .eq('slug', SHOWCASE_DOG_SLUG)
      .maybeSingle(),
  ])

  // Fotos del showcase dog en query aparte (no funciona como join directo)
  let showcasePhotos: string[] = []
  if (showcaseDogRes.data?.id) {
    const { data: photos } = await admin
      .from('dog_photos')
      .select('url')
      .eq('dog_id', showcaseDogRes.data.id)
      .order('position')
      .limit(6)
    showcasePhotos = (photos || []).map((p: { url: string }) => p.url)
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
            breed_name: Array.isArray(showcaseDogRes.data.breed)
              ? showcaseDogRes.data.breed[0]?.name
              : (showcaseDogRes.data.breed as { name?: string } | null)?.name,
            color_name: Array.isArray(showcaseDogRes.data.color)
              ? showcaseDogRes.data.color[0]?.name
              : (showcaseDogRes.data.color as { name?: string } | null)?.name,
            father_name: Array.isArray(showcaseDogRes.data.father)
              ? showcaseDogRes.data.father[0]?.name
              : (showcaseDogRes.data.father as { name?: string } | null)?.name,
            mother_name: Array.isArray(showcaseDogRes.data.mother)
              ? showcaseDogRes.data.mother[0]?.name
              : (showcaseDogRes.data.mother as { name?: string } | null)?.name,
            photos: showcasePhotos,
          } : null}
          blogPosts={blogPosts}
          mosaicPhotos={mosaicPhotos}
        />
      </main>
      <MarketingFooter />
    </div>
  )
}
