import Link from 'next/link'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { getMyKennel } from '@/lib/kennel-site'
import { DEFAULT_NAV_LABELS, pageHref } from '@/lib/kennel/pages'
import { ensureAllPages, togglePageEnabled } from './actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Web pública · Genealogic Pro' }

const PAGE_HINT: Record<string, string> = {
  home: 'La portada de la web. Lo primero que ven los visitantes.',
  perros: 'Listado de cachorros disponibles, próximas camadas y reproductores.',
  razas: 'Información detallada sobre la raza (o razas) que crías.',
  historia: 'El legado del criadero, hitos y equipo.',
  servicios: 'Servicios secundarios: pupilaje, asesoría, libros, etc.',
  instalaciones: 'Fotos del kennel, ubicación, características.',
  galeria: 'Galería de fotos del criadero.',
  blog: 'Índice de artículos. Los posts individuales se editan aparte.',
  contacto: 'Formulario y datos para que te contacten.',
}

type Row = {
  slug: string
  enabled: boolean
  nav_label: string | null
  nav_order: number
  sections: unknown[]
  draft_sections: unknown[] | null
}

export default async function AdminWebIndexPage() {
  const kennel = await getMyKennel()
  await ensureAllPages()

  const admin = createKennelAdminClient() as any
  const { data } = await admin
    .from('kennel_pages')
    .select('slug, enabled, nav_label, nav_order, sections, draft_sections')
    .eq('kennel_id', kennel.id)
    .order('nav_order', { ascending: true })
  const pages = (data as Row[] | null) ?? []

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Web pública</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">Páginas</h1>
      <p className="mt-2 text-body">
        9 páginas troncales, siempre las mismas. Activa las que quieras mostrar y construye el
        contenido por secciones.
      </p>

      <div className="mt-8 rounded-2xl bg-canvas border border-hairline overflow-hidden">
        <ul className="divide-y divide-hairline">
          {pages.map((p) => {
            const draftCount = p.draft_sections ? (p.draft_sections as unknown[]).length : null
            const sectionsCount = (p.sections as unknown[]).length
            return (
              <li key={p.slug} className="flex items-center gap-4 px-5 py-4">
                <form action={togglePageEnabled.bind(null, p.slug, !p.enabled)} className="flex items-center">
                  <button
                    type="submit"
                    aria-pressed={p.enabled}
                    className={`relative h-5 w-9 rounded-full transition ${p.enabled ? 'bg-ink' : 'bg-hairline'}`}
                    title={p.enabled ? 'Desactivar página' : 'Activar página'}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${p.enabled ? 'left-[18px]' : 'left-0.5'}`}
                    />
                  </button>
                </form>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-ink">{p.nav_label ?? DEFAULT_NAV_LABELS[p.slug] ?? p.slug}</p>
                    <span className="text-[11px] font-mono text-muted">{pageHref(kennel.slug, p.slug)}</span>
                    {draftCount !== null && (
                      <span className="rounded-full bg-yellow-200/60 px-2 py-0.5 text-[10px] font-medium text-yellow-900 ring-1 ring-yellow-300/60">
                        Borrador sin publicar
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">{PAGE_HINT[p.slug]}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {sectionsCount} {sectionsCount === 1 ? 'sección publicada' : 'secciones publicadas'}
                    {draftCount !== null && ` · ${draftCount} en borrador`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {p.enabled && (
                    <Link
                      href={pageHref(kennel.slug, p.slug)}
                      target="_blank"
                      className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-body hover:border-ink/30 hover:text-ink"
                    >
                      Ver
                    </Link>
                  )}
                  <Link
                    href={`/web/${p.slug}`}
                    className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-on-primary hover:opacity-90"
                  >
                    Editar →
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
