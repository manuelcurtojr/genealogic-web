import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getKennelBySlug } from '@/lib/kennel-site'
import { getPage } from '@/lib/kennel/pages'
import { runWithKennel } from '@/lib/kennel-context'
import { PageRenderer } from '@/components/site/sections/PageRenderer'
import PageTracker from '@/components/track/page-tracker'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const kennel = await getKennelBySlug(slug)
  if (!kennel) return { title: 'No encontrado' }
  const page = await getPage(kennel.id, 'home')
  return {
    title: page?.meta_title || kennel.name,
    description: page?.meta_description || kennel.description || undefined,
  }
}

export default async function KennelHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const kennel = await getKennelBySlug(slug)
  if (!kennel) notFound()
  const page = await getPage(kennel.id, 'home')
  if (!page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-ink mb-3">{kennel.name}</h1>
        {kennel.description && <p className="text-body mb-6">{kennel.description}</p>}
        <p className="text-sm text-muted">
          La web pública aún no se ha publicado. Ver{' '}
          <a href={`/kennels/${kennel.slug}`} className="text-ink underline">perfil en Genealogic</a>.
        </p>
      </div>
    )
  }
  // CRÍTICO: ejecutar PageRenderer DENTRO del callback de runWithKennel para
  // que AsyncLocalStorage propague el kennel a todas las secciones async.
  // Si retornamos <PageRenderer/> como JSX, React lo evalúa fuera del scope
  // ALS y getCurrentKennel() lanza "No kennel in context".
  const rendered = await runWithKennel(kennel, () => PageRenderer({ slug: 'home' }))
  return (
    <>
      <PageTracker kennelId={kennel.id} />
      {rendered}
    </>
  )
}
