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

  const [dogsCount, kennelsCount, breedsCount, featuredDogsRes, mosaicPoolRes, featuredKennelsRes] = await Promise.all([
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
    // Pool del mosaico del hero: pedimos 300 perros recientes con foto y
    // breed_id, luego filtramos en memoria 1 por raza única para
    // garantizar variedad visual. Cambia cada recarga porque ORDER BY
    // created_at en una tabla que crece da resultados ligeramente
    // distintos según el momento.
    admin
      .from('dogs')
      .select('id, thumbnail_url, breed_id')
      .not('thumbnail_url', 'is', null)
      .not('breed_id', 'is', null)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(300),
    admin
      .from('kennels')
      .select('id, name, slug, logo_url, country, city')
      .not('logo_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  // Filtrar pool del mosaico para tener 1 foto por raza única (variedad
  // visual), luego barajar y tomar 12. Si hay menos razas distintas que
  // 12, rellenamos con sobrantes para no dejar slots vacíos.
  type DogPoolRow = { id: string; thumbnail_url: string | null; breed_id: string | null }
  const pool: DogPoolRow[] = (mosaicPoolRes.data as DogPoolRow[]) || []
  const seenBreeds = new Set<string>()
  const uniqueByBreed: DogPoolRow[] = []
  for (const d of pool) {
    if (d.breed_id && !seenBreeds.has(d.breed_id)) {
      seenBreeds.add(d.breed_id)
      uniqueByBreed.push(d)
    }
  }
  // Fisher-Yates shuffle para que el orden de razas también cambie
  for (let i = uniqueByBreed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[uniqueByBreed[i], uniqueByBreed[j]] = [uniqueByBreed[j], uniqueByBreed[i]]
  }
  // Rellenar hasta 12 con sobrantes del pool si hace falta
  const mosaicPhotos = uniqueByBreed.slice(0, 12).map((d) => d.thumbnail_url).filter(Boolean) as string[]
  if (mosaicPhotos.length < 12) {
    for (const d of pool) {
      if (d.thumbnail_url && !mosaicPhotos.includes(d.thumbnail_url)) {
        mosaicPhotos.push(d.thumbnail_url)
        if (mosaicPhotos.length >= 12) break
      }
    }
  }

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
          featuredKennels={featuredKennelsRes.data || []}
          blogPosts={blogPosts}
          mosaicPhotos={mosaicPhotos}
        />
      </main>
      <MarketingFooter />
    </div>
  )
}
