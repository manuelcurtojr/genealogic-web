import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getKennelBySlug } from '@/lib/kennel-site'
import { getPage } from '@/lib/kennel/pages'
import { runWithKennel } from '@/lib/kennel-context'
import { PageRenderer } from '@/components/site/sections/PageRenderer'
import PageTracker from '@/components/track/page-tracker'
import { FloatingContactButton } from '@/components/site/floating-contact-button'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const kennel = await getKennelBySlug(slug)
  if (!kennel) return { title: 'No encontrado' }
  const page = await getPage(kennel.id, 'home')
  // Canonical apunta a la URL principal /kennels/[slug] — esto evita el
  // SEO duplicado entre las dos rutas que conviven (legacy /c y la
  // nueva /kennels Pro), sin tener que migrar contenido todavía.
  const canonical = `https://genealogic.io/kennels/${kennel.slug || slug}`
  return {
    title: page?.meta_title || kennel.name,
    description: page?.meta_description || kennel.description || undefined,
    alternates: { canonical },
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

      {/* Botón flotante de Solicitudes (solo desktop sticky; en mobile el
          equivalente vive en el footer del layout). */}
      <div className="hidden md:block">
        <FloatingContactButton
          kennelId={kennel.id}
          kennelName={kennel.name}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          config={(kennel as any).contact_form_config || null}
        />
      </div>

      {/* Badge "Ver en Genealogic" — siempre absoluto a genealogic.io (porque
          desde un custom domain como iremacurto.com /kennels/<slug> daría 404
          al estar en otro origin). Solo desktop sticky. */}
      <a
        href={`https://genealogic.io/kennels/${kennel.slug}`}
        target="_blank"
        rel="noopener"
        title={`Ver perfil de ${kennel.name} en Genealogic`}
        className="hidden md:inline-flex fixed bottom-4 right-4 z-40 items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-sm px-3.5 py-1.5 text-[11.5px] font-medium text-white shadow-lg transition-opacity hover:bg-black"
      >
        <span aria-hidden="true">🐾</span>
        <span>Ver en Genealogic</span>
      </a>
    </>
  )
}
