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
import DiscoveryHome from '@/components/marketing/discovery-home'

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

  const [dogsCount, kennelsCount, breedsCount, featuredDogsRes, featuredKennelsRes] = await Promise.all([
    admin.from('dogs').select('id', { count: 'exact', head: true }),
    admin.from('kennels').select('id', { count: 'exact', head: true }),
    admin.from('breeds').select('id', { count: 'exact', head: true }),
    admin
      .from('dogs')
      .select('id, name, slug, thumbnail_url, breed:breeds(name)')
      .not('thumbnail_url', 'is', null)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(6),
    admin
      .from('kennels')
      .select('id, name, slug, logo_url, country, city')
      .not('logo_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return (
    <div className="min-h-screen bg-canvas text-[var(--foreground)]">
      <MarketingHeader />
      <DiscoveryHome
        counts={{
          dogs: dogsCount.count || 0,
          kennels: kennelsCount.count || 0,
          breeds: breedsCount.count || 0,
        }}
        featuredDogs={featuredDogsRes.data || []}
        featuredKennels={featuredKennelsRes.data || []}
      />
    </div>
  )
}
