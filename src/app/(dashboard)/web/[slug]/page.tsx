import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { getMyKennel } from '@/lib/kennel-site'
import { DEFAULT_NAV_LABELS, PAGE_SLUGS, pageHref, publicUrl } from '@/lib/kennel/pages'
import { catalogForPage, labelForType } from '@/lib/kennel/section-catalog'
import { getSectionSchema } from '@/lib/kennel/section-schemas'
import {
  removeSection, duplicateSection, publishPage, discardDraft,
} from '../actions'
import { SectionEditor } from './section-editor'
import { SectionsList } from '@/components/admin/web/sections-list'
import { AddSectionButton } from '@/components/admin/web/add-section-button'
import { PreviewFrame } from '@/components/admin/web/preview-frame'
import { EditorShortcuts, UndoRedoButtons } from '@/components/admin/web/editor-shortcuts'
import { EditorLayout } from '@/components/admin/web/editor-layout'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

type PageRow = {
  slug: string
  enabled: boolean
  nav_label: string | null
  sections: any[]
  draft_sections: any[] | null
  undo_history?: unknown[] | null
  redo_history?: unknown[] | null
}

export default async function PageEditorPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ section?: string }>
}) {
  const { slug } = await params
  if (!PAGE_SLUGS.includes(slug as any)) notFound()
  const t = getTranslator(await getLocale())
  const sp = await searchParams
  const selectedSectionId = sp.section ?? null

  const kennel = await getMyKennel()
  const admin = createKennelAdminClient() as any
  const { data } = await admin
    .from('kennel_pages')
    .select('slug, enabled, nav_label, sections, draft_sections, undo_history, redo_history')
    .eq('kennel_id', kennel.id)
    .eq('slug', slug)
    .maybeSingle()
  const page = data as PageRow | null
  if (!page) notFound()

  const isDraft = page.draft_sections !== null
  const canUndo = Array.isArray(page.undo_history) && page.undo_history.length > 0
  const canRedo = Array.isArray(page.redo_history) && page.redo_history.length > 0
  const sections = (page.draft_sections ?? page.sections ?? []) as Array<{
    id: string; type: string; props?: Record<string, any>
  }>
  const selected = selectedSectionId ? sections.find((s) => s.id === selectedSectionId) ?? null : null
  const catalog = catalogForPage(slug)
  const usedTypes = sections.map((s) => s.type)
  const pageTitle = page.nav_label ?? DEFAULT_NAV_LABELS[slug] ?? slug

  const sectionsLite = sections.map((s) => ({
    id: s.id, type: s.type, label: labelForType(s.type), summary: summarizeProps(s.props ?? {}),
  }))

  const publicHref = publicUrl({
    kennelSlug: kennel.slug,
    pageSlug: slug,
    customDomain: kennel.custom_domain,
  })

  return (
    <div className="-m-4 lg:-m-[30px] flex h-[calc(100vh-56px)] flex-col">
      <EditorShortcuts pageSlug={slug} />
      <header className="flex items-center justify-between gap-4 border-b border-hairline bg-canvas px-5 py-3">
        <div className="min-w-0 flex items-baseline gap-3">
          <Link href="/web" className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink">
            ← {t('Páginas')}
          </Link>
          <h1 className="font-bold text-xl tracking-tight text-ink truncate">{pageTitle}</h1>
          <span className="text-xs font-mono text-muted hidden sm:inline">{publicHref}</span>
          {isDraft && (
            <span className="rounded-full bg-yellow-200/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-900 ring-1 ring-yellow-300/60">
              {t('Borrador')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <UndoRedoButtons pageSlug={slug} canUndo={canUndo} canRedo={canRedo} />
          {page.enabled && (
            <Link href={publicHref} target="_blank"
              className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-body hover:border-ink/30 hover:text-ink">
              {t('Ver web pública')}
            </Link>
          )}
          {isDraft && (
            <>
              <form action={discardDraft.bind(null, slug)}>
                <button type="submit" className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-body hover:border-ink/30 hover:text-ink">
                  {t('Descartar')}
                </button>
              </form>
              <form action={publishPage.bind(null, slug)}>
                <button type="submit" className="rounded-lg bg-ink px-4 py-1.5 text-xs font-semibold text-on-primary hover:opacity-90">
                  {t('Publicar')}
                </button>
              </form>
            </>
          )}
        </div>
      </header>

      <EditorLayout
        left={
          <>
            <div className="flex-1 overflow-y-auto">
              <SectionsList pageSlug={slug} sections={sectionsLite} selectedId={selectedSectionId} />
            </div>
            <div className="border-t border-hairline p-3">
              <AddSectionButton pageSlug={slug} catalog={catalog} usedTypes={usedTypes} />
            </div>
          </>
        }
        center={<PreviewFrame slug={slug} />}
        right={
          <>
            {!selected && (
              <div className="flex h-full items-center justify-center p-6">
                <div className="max-w-[260px] text-center">
                  <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-card text-xl text-ink">✎</div>
                  <p className="text-base font-bold text-ink">{t('Selecciona una sección')}</p>
                  <p className="mt-2 text-xs text-muted">
                    {t('Pulsa una sección en la lista de la izquierda o directamente sobre ella en la vista previa.')}
                  </p>
                  <div className="mt-6 rounded-xl border border-hairline bg-surface-card p-3 text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Atajos')}</p>
                    <ul className="mt-2 space-y-1 text-[11px] text-body">
                      <Shortcut keys={['Doble-click']} desc={t('Editar texto en línea')} />
                      <Shortcut keys={['D']} desc={t('Duplicar sección')} />
                      <Shortcut keys={['Supr']} desc={t('Eliminar sección')} />
                      <Shortcut keys={['Esc']} desc={t('Deseleccionar')} />
                      <Shortcut keys={['⌘', 'Z']} desc={t('Deshacer')} />
                      <Shortcut keys={['⌘', '⇧', 'Z']} desc={t('Rehacer')} />
                      <Shortcut keys={['⌘', 'S']} desc={t('Publicar')} />
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selected && (
              <div className="flex flex-col">
                <div className="border-b border-hairline px-5 py-4">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted">
                    {selected.type}{!getSectionSchema(selected.type) && ` · ${t('sin form')}`}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-ink">{labelForType(selected.type)}</h2>
                  <div className="mt-3 flex items-center gap-2">
                    <form action={duplicateSection.bind(null, slug, selected.id)}>
                      <button type="submit" className="rounded-lg border border-hairline px-2.5 py-1 text-[11px] text-body hover:border-ink/30 hover:text-ink">
                        {t('Duplicar')}
                      </button>
                    </form>
                    <form action={removeSection.bind(null, slug, selected.id)}>
                      <button type="submit" className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] text-red-700 hover:bg-red-50">
                        {t('Eliminar')}
                      </button>
                    </form>
                  </div>
                </div>
                <div className="px-5 py-5 pb-24">
                  <SectionEditor pageSlug={slug} section={selected} />
                </div>
              </div>
            )}
          </>
        }
      />
    </div>
  )
}

function Shortcut({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i}>
            <kbd className="rounded border border-hairline bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-body">{k}</kbd>
            {i < keys.length - 1 && <span className="mx-0.5 text-muted">+</span>}
          </span>
        ))}
      </span>
      <span className="text-muted">{desc}</span>
    </li>
  )
}

function summarizeProps(props: Record<string, any>): string {
  const candidates = ['title', 'tagline', 'headline', 'name', 'eyebrow', 'body']
  for (const k of candidates) {
    if (typeof props[k] === 'string' && props[k].trim()) return props[k].slice(0, 50)
  }
  for (const k of Object.keys(props)) {
    if (Array.isArray(props[k])) return `${props[k].length} ${k}`
  }
  return '—'
}
