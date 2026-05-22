'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Save, Send, EyeOff, Eye, ExternalLink, Code, Settings as SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  savePageDraftAction, publishPageAction, togglePageEnabledAction, updatePageMetaAction,
} from '@/app/(dashboard)/web/actions'

interface Props {
  kennelId: string
  kennelSlug: string
  slug: string
  initialSections: any[]
  initialDraft: any[] | null
  initialEnabled: boolean
  initialNavLabel: string | null
  initialMetaTitle: string | null
  initialMetaDescription: string | null
  previewUrl: string
}

export default function PageSectionsEditor({
  kennelId, kennelSlug, slug,
  initialSections, initialDraft, initialEnabled,
  initialNavLabel, initialMetaTitle, initialMetaDescription, previewUrl,
}: Props) {
  // Inicializar con draft si existe, sino con sections publicadas
  const initialJson = JSON.stringify(initialDraft ?? initialSections, null, 2)
  const [json, setJson] = useState(initialJson)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [navLabel, setNavLabel] = useState(initialNavLabel || '')
  const [metaTitle, setMetaTitle] = useState(initialMetaTitle || '')
  const [metaDesc, setMetaDesc] = useState(initialMetaDescription || '')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  async function saveDraft() {
    setSaving(true); setMsg(null)
    const r = await savePageDraftAction(kennelId, slug, json)
    if (r.ok) setMsg({ kind: 'ok', text: 'Borrador guardado.' })
    else setMsg({ kind: 'err', text: r.error || 'Error' })
    setSaving(false)
  }

  async function publish() {
    setPublishing(true); setMsg(null)
    const r = await publishPageAction(kennelId, slug, json)
    if (r.ok) {
      setMsg({ kind: 'ok', text: '¡Publicado! Verás los cambios en producción en unos segundos.' })
      setEnabled(true)
    } else {
      setMsg({ kind: 'err', text: r.error || 'Error' })
    }
    setPublishing(false)
  }

  async function toggleEnabled() {
    const next = !enabled
    setEnabled(next)
    await togglePageEnabledAction(kennelId, slug, next)
  }

  async function saveMeta() {
    const r = await updatePageMetaAction(kennelId, slug, {
      nav_label: navLabel.trim() || null,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDesc.trim() || null,
    })
    if (r.ok) setMsg({ kind: 'ok', text: 'Metadatos guardados.' })
    else setMsg({ kind: 'err', text: r.error || 'Error' })
  }

  function insertExampleSection() {
    let parsed: any[] = []
    try { parsed = JSON.parse(json); if (!Array.isArray(parsed)) parsed = [] }
    catch { parsed = [] }
    parsed.push({
      id: `s-${Date.now()}`,
      type: 'page-header',
      props: { eyebrow: 'Sobre nosotros', title: 'Nuevo bloque', subtitle: 'Edita props en JSON.' },
    })
    setJson(JSON.stringify(parsed, null, 2))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      {/* Editor */}
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={toggleEnabled}>
            {enabled ? <><Eye className="w-3.5 h-3.5" /> Activa</> : <><EyeOff className="w-3.5 h-3.5" /> Inactiva</>}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowSettings(s => !s)}>
            <SettingsIcon className="w-3.5 h-3.5" /> Ajustes
          </Button>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium text-body hover:text-ink border border-hairline rounded-lg px-3 py-2 inline-flex items-center gap-1.5 hover:bg-surface-soft transition">
            <ExternalLink className="w-3.5 h-3.5" /> Previsualizar
          </a>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" size="sm" onClick={saveDraft} disabled={saving}>
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando…' : 'Guardar borrador'}
            </Button>
            <Button variant="primary" size="sm" onClick={publish} disabled={publishing}>
              <Send className="w-3.5 h-3.5" />
              {publishing ? 'Publicando…' : 'Publicar'}
            </Button>
          </div>
        </div>

        {msg && (
          <div className={`rounded-lg px-3 py-2 text-sm ${msg.kind === 'ok' ? 'bg-surface-card text-ink border border-hairline' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div className="rounded-xl border border-hairline bg-canvas p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Metadatos de la página</p>
            <label className="block">
              <span className="block text-[11px] text-muted mb-1">Texto del menú (nav)</span>
              <input value={navLabel} onChange={e => setNavLabel(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-canvas focus:outline-none focus:border-ink"
                placeholder="Inicio, Sobre nosotros, Contacto…" />
            </label>
            <label className="block">
              <span className="block text-[11px] text-muted mb-1">Meta title (SEO)</span>
              <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-canvas focus:outline-none focus:border-ink" />
            </label>
            <label className="block">
              <span className="block text-[11px] text-muted mb-1">Meta description (SEO)</span>
              <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-canvas focus:outline-none focus:border-ink min-h-[60px]" />
            </label>
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={saveMeta}>Guardar metadatos</Button>
            </div>
          </div>
        )}

        {/* JSON editor */}
        <div className="rounded-xl border border-hairline bg-canvas overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline px-3 py-2 bg-surface-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted flex items-center gap-1.5">
              <Code className="w-3 h-3" /> Sections (JSON)
            </p>
            <button onClick={insertExampleSection}
              className="text-[11px] text-body hover:text-ink underline">
              + Añadir bloque de ejemplo
            </button>
          </div>
          <textarea
            value={json}
            onChange={e => setJson(e.target.value)}
            className="w-full min-h-[500px] px-4 py-3 text-xs font-mono leading-relaxed bg-canvas text-ink focus:outline-none resize-y"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Sidebar: catalog */}
      <aside className="space-y-3">
        <div className="rounded-xl border border-hairline bg-canvas p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mb-3">Tipos de sección</p>
          <ul className="space-y-1.5 text-[12px] text-body">
            {SECTION_CATALOG.map(s => (
              <li key={s.type}>
                <code className="text-[11px] bg-surface-card border border-hairline rounded px-1.5 py-0.5">{s.type}</code>
                <span className="text-muted ml-1.5">{s.desc}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-hairline bg-surface-card p-4 text-[12px] text-body leading-relaxed">
          <p className="font-semibold text-ink mb-1.5">Formato</p>
          <pre className="text-[11px] bg-canvas border border-hairline rounded p-2 mt-2 overflow-x-auto">
{`[
  {
    "id": "s1",
    "type": "hero",
    "props": { "title": "…" }
  },
  …
]`}
          </pre>
        </div>
      </aside>
    </div>
  )
}

const SECTION_CATALOG = [
  { type: 'page-header', desc: 'Cabecera con eyebrow + título + subtítulo' },
  { type: 'hero', desc: 'Hero a pantalla completa con CTAs' },
  { type: 'three-pillars', desc: '3 columnas con iconos/texto' },
  { type: 'available-puppies-strip', desc: 'Tira de cachorros disponibles' },
  { type: 'available-puppies-grid', desc: 'Grid completo de disponibles' },
  { type: 'breeding-dogs-grid', desc: 'Grid de reproductores (sex: male/female/all)' },
  { type: 'dogs-tabs', desc: 'Tabs con disponibles/sementales/hembras' },
  { type: 'waitlist-cta', desc: 'CTA de lista de espera' },
  { type: 'breed-hero', desc: 'Hero de página de raza' },
  { type: 'breed-summary', desc: 'Texto largo sobre la raza' },
  { type: 'breed-temperament', desc: 'Lista de rasgos de carácter' },
  { type: 'breed-colors', desc: 'Colores aceptados con muestras' },
  { type: 'breed-traits', desc: 'Stats (peso, altura, esperanza vida…)' },
  { type: 'story-hero', desc: 'Hero de historia' },
  { type: 'timeline', desc: 'Línea temporal con hitos' },
  { type: 'team', desc: 'Tarjetas del equipo' },
  { type: 'services-grid', desc: 'Grid de servicios ofrecidos' },
  { type: 'facilities-hero', desc: 'Hero de instalaciones' },
  { type: 'facility-features', desc: 'Características de las instalaciones' },
  { type: 'gallery-grid', desc: 'Galería de fotos en grid' },
  { type: 'visit-cta', desc: 'CTA para concertar visita' },
  { type: 'blog-hero', desc: 'Hero de blog' },
  { type: 'featured-post', desc: 'Post destacado' },
  { type: 'posts-grid', desc: 'Grid de posts del blog' },
  { type: 'contact-form', desc: 'Formulario de contacto' },
  { type: 'contact-info', desc: 'Datos de contacto + redes' },
  { type: 'map-embed', desc: 'Mapa embebido' },
  { type: 'two-column-block', desc: 'Bloque a 2 columnas (imagen + texto)' },
  { type: 'reviews', desc: 'Reseñas/testimonios' },
  { type: 'video-embed', desc: 'Vídeo embebido (YouTube/Vimeo)' },
  { type: 'kennel-stats', desc: 'Números destacados del criadero' },
  { type: 'process-steps', desc: 'Pasos de un proceso (reserva, etc.)' },
  { type: 'faq', desc: 'Preguntas frecuentes' },
  { type: 'cta-banner', desc: 'Banner CTA destacado' },
  { type: 'newsletter', desc: 'Suscripción a newsletter' },
  { type: 'trust-strip', desc: 'Logos de confianza' },
]
