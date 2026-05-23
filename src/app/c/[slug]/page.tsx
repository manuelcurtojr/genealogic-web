import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getKennelBySlug } from '@/lib/kennel-site'
import { getPage } from '@/lib/kennel/pages'
import { runWithKennel } from '@/lib/kennel-context'
import { PageRenderer } from '@/components/site/sections/PageRenderer'
import PageTracker from '@/components/track/page-tracker'
import ContactKennelButton from '@/components/kennel/contact-kennel-button'

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

      {/* Botón flotante de Solicitudes — mismo motor que /kennels/[slug],
          renderiza el form configurado por el criador */}
      <div className="fixed bottom-4 left-4 z-40">
        <ContactKennelButton
          kennelId={kennel.id}
          kennelName={kennel.name}
          config={(kennel as any).contact_form_config || null}
          variant="light"
        />
      </div>

      {/* Badge sutil bottom-right para ir al perfil estándar */}
      <a
        href={`/kennels/${kennel.slug}?force=standard`}
        title={`Ver perfil de ${kennel.name} en Genealogic`}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-sm px-3.5 py-1.5 text-[11.5px] font-medium text-white shadow-lg transition-opacity hover:bg-black"
      >
        <span aria-hidden="true">🐾</span>
        <span>Ver en Genealogic</span>
      </a>
    </>
  )
}
