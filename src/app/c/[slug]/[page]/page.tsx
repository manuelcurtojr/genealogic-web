import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getKennelBySlug } from '@/lib/kennel-site'
import { getPage } from '@/lib/kennel/pages'
import { runWithKennel } from '@/lib/kennel-context'
import { PageRenderer } from '@/components/site/sections/PageRenderer'
import PageTracker from '@/components/track/page-tracker'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

// Mapeo URL → slug DB. La URL /c/[slug]/raza corresponde al slug 'razas' en DB
function resolveDbSlug(urlPage: string): string {
  if (urlPage === 'raza') return 'razas'
  return urlPage
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; page: string }> }): Promise<Metadata> {
  const { slug, page: pageParam } = await params
  const kennel = await getKennelBySlug(slug)
  const t = getTranslator(await getLocale())
  if (!kennel) return { title: t('No encontrado') }
  const page = await getPage(kennel.id, resolveDbSlug(pageParam))
  if (!page) return { title: t('Página no encontrada') }
  return {
    title: page.meta_title || `${pageParam.charAt(0).toUpperCase() + pageParam.slice(1)} · ${kennel.name}`,
    description: page.meta_description || kennel.description || undefined,
  }
}

export default async function KennelPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string; page: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug, page: pageParam } = await params
  const kennel = await getKennelBySlug(slug)
  if (!kennel) notFound()
  const dbSlug = resolveDbSlug(pageParam)
  const page = await getPage(kennel.id, dbSlug)
  if (!page) notFound()
  // Ver nota en /c/[slug]/page.tsx sobre por qué hay que invocar PageRenderer
  // como función dentro del callback de runWithKennel (ALS + RSC async).
  const rendered = await runWithKennel(kennel, () => PageRenderer({ slug: dbSlug, searchParams }))
  return (
    <>
      <PageTracker kennelId={kennel.id} />
      {rendered}
    </>
  )
}
