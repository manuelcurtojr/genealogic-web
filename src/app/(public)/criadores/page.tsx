/**
 * /criadores — landing dedicada al lado "criador" de Genealogic.
 *
 * Antes era el contenido de la home (`/`). Lo movemos aquí para que la
 * home pueda ser un hub discovery-first y cada audiencia tenga su propia
 * landing dedicada.
 *
 * Reutiliza el componente LandingPage tal cual. El layout del grupo
 * (public) ya monta el MarketingHeader arriba.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/landing-page'
import type { Metadata } from 'next'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export async function generateMetadata(): Promise<Metadata> {
  const t = getTranslator(await getLocale())
  return {
    title: t('Para criadores'),
    description: t(
      'Software gratis para criaderos: perfil público indexable en Google, genealogías con importador IA, camadas y salud. Crea tu criadero gratis — y más herramientas llegando.'
    ),
    alternates: { canonical: 'https://genealogic.io/criadores' },
    openGraph: {
      title: t('Genealogic para criadores'),
      description: t('Gestiona tu criadero y vende más cachorros con menos esfuerzo.'),
      url: 'https://genealogic.io/criadores',
      type: 'website',
      siteName: 'Genealogic',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Genealogic' }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/opengraph-image'],
    },
  }
}

async function fetchCockerPhotos(): Promise<string[]> {
  try {
    const res = await fetch('https://dog.ceo/api/breed/spaniel/cocker/images/random/7', {
      signal: AbortSignal.timeout(2000),
      next: { revalidate: 60 * 60 * 24 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json?.message) ? json.message : []
  } catch {
    return []
  }
}

export default async function CriadoresPage() {
  const supabase = await createClient()

  // Contadores reales (admin = service-role para no truncar a 1000). Antes el
  // hero mostraba "1.366 perros / 148 criaderos" hardcodeado → infravendía la
  // escala real (la mayor BBDD), justo el argumento. Ahora va en vivo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const [{ data: breeds }, { data: featuredDogs }, cockerPhotos, dogsCountRes, kennelsCountRes] = await Promise.all([
    supabase.from('breeds').select('id, name').order('name').limit(20),
    supabase
      .from('dogs')
      .select('id, name, slug, thumbnail_url, breed:breeds(id, name)')
      .not('thumbnail_url', 'is', null)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(8),
    fetchCockerPhotos(),
    admin.from('dogs').select('id', { count: 'exact', head: true }),
    admin.from('kennels').select('id', { count: 'exact', head: true }),
  ])

  return (
    <LandingPage
      breeds={breeds || []}
      featuredDogs={featuredDogs || []}
      cockerPhotos={cockerPhotos}
      counts={{ dogs: dogsCountRes.count || 0, kennels: kennelsCountRes.count || 0 }}
    />
  )
}
