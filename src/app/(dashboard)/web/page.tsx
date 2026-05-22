import { createClient } from '@/lib/supabase/server'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Globe, ExternalLink, FileText, Eye, EyeOff } from 'lucide-react'
import { DEFAULT_NAV_LABELS, PAGE_SLUGS, pageHref } from '@/lib/kennel/pages'
import { ensureAllPagesAction } from './actions'

export const metadata = { title: 'Web pública · Genealogic Pro' }
export const dynamic = 'force-dynamic'

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

export default async function WebBuilderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennelArr } = await supabase
    .from('kennels').select('id, name, slug, custom_domain').eq('owner_id', user.id).limit(1)
  const kennel = kennelArr?.[0]
  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Web pública</h1>
        <p className="text-body">Necesitas un criadero registrado.</p>
      </div>
    )
  }

  // Crear filas si faltan
  await ensureAllPagesAction(kennel.id)

  const admin = createKennelAdminClient()
  const { data: pages } = await admin
    .from('kennel_pages')
    .select('slug, enabled, nav_label, nav_order, sections, draft_sections')
    .eq('kennel_id', kennel.id)
    .order('nav_order', { ascending: true })

  const baseUrl = (kennel as any).custom_domain
    ? `https://${(kennel as any).custom_domain}`
    : `https://genealogic.io/c/${kennel.slug}`

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-muted" />
            Web pública
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {kennel.name} · 9 páginas troncales editables por secciones.
          </p>
        </div>
        <a
          href={baseUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs font-medium text-body hover:text-ink border border-hairline rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 hover:bg-surface-soft transition"
        >
          <ExternalLink className="w-3 h-3" /> Ver sitio
        </a>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-4 mb-6 flex items-start gap-3">
        <Globe className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />
        <div className="text-sm text-body leading-relaxed">
          <p className="mb-1">
            Tu web está en{' '}
            <code className="text-[12px] bg-canvas border border-hairline rounded px-1">{baseUrl}</code>
          </p>
          <p className="text-muted text-[13px]">
            Cada página se compone de <strong>secciones</strong> reutilizables (hero, listado de perros, FAQ, contacto, etc.).
            Puedes activarlas, ordenarlas, ocultarlas o editar sus textos e imágenes.
            {!(kennel as any).custom_domain && <> · <Link href="/cuenta/dominio" className="text-ink underline">Conectar dominio propio</Link></>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(pages || []).map((p: any) => {
          const isPublished = p.enabled && Array.isArray(p.sections) && p.sections.length > 0
          const hasDraft = Array.isArray(p.draft_sections) && p.draft_sections.length > 0
          const label = p.nav_label || DEFAULT_NAV_LABELS[p.slug] || p.slug
          return (
            <Link
              key={p.slug}
              href={`/web/${p.slug}`}
              className="rounded-xl border border-hairline bg-canvas p-4 hover:border-ink/30 hover:shadow-sm transition flex items-start gap-3"
            >
              <FileText className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-ink truncate">{label}</p>
                  {isPublished ? (
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] bg-ink text-on-primary rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5" /> Publicada
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] bg-surface-card text-muted rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                      <EyeOff className="w-2.5 h-2.5" /> Sin publicar
                    </span>
                  )}
                  {hasDraft && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] bg-yellow-200/60 text-yellow-900 rounded-full px-2 py-0.5">
                      Borrador
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-muted">{PAGE_HINT[p.slug] || 'Página personalizada.'}</p>
                <p className="text-[11px] text-muted mt-1">
                  <code>{pageHref(kennel.slug, p.slug)}</code> · {Array.isArray(p.sections) ? p.sections.length : 0} secciones
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
