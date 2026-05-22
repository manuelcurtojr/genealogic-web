'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Globe, Eye, EyeOff, ExternalLink, FileText, Home, Info, Dog, MessageCircle, HelpCircle, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageEditorPanel from './page-editor-panel'

interface Page {
  id: string
  slug: string
  title: string
  page_type: string
  content_md: string | null
  cover_image_url: string | null
  is_published: boolean
  position: number
  show_in_nav: boolean
  updated_at: string
}

interface Props {
  kennelId: string
  kennelName: string
  kennelSlug: string
  customDomain: string | null
  initialPages: Page[]
}

const PAGE_TYPE_ICON: Record<string, any> = {
  home: Home, about: Info, dogs: Dog, litters: Dog, contact: MessageCircle,
  faq: HelpCircle, blog: BookOpen, custom: FileText,
}

const PAGE_TYPE_LABEL: Record<string, string> = {
  home: 'Inicio', about: 'Sobre nosotros', dogs: 'Perros', litters: 'Camadas',
  contact: 'Contacto', faq: 'FAQ', blog: 'Blog', custom: 'Personalizada',
}

export const TEMPLATES: { type: string; slug: string; title: string; content: string }[] = [
  {
    type: 'home', slug: 'inicio', title: 'Inicio',
    content: `# Bienvenidos a ${'{{kennel}}'}\n\nSomos un criadero familiar dedicado a la cría seria y responsable. Nuestro objetivo es producir perros sanos, equilibrados y fieles al estándar de la raza.\n\n## Lo que nos diferencia\n\n- Cría planificada con tests de salud\n- Cachorros entregados con pedigrí oficial\n- Acompañamiento de por vida a las familias\n- Filosofía de lista de espera, no de disponibilidad inmediata`
  },
  {
    type: 'about', slug: 'sobre-nosotros', title: 'Sobre nosotros',
    content: `# Sobre ${'{{kennel}}'}\n\nNuestra historia, nuestra filosofía de cría y por qué llevamos haciendo esto X años.\n\n## Nuestra filosofía\n\nCada cachorro que entregamos lleva detrás meses de planificación, controles de salud y un proceso de selección de familias riguroso.\n\n## El equipo\n\nDescribe aquí quiénes formáis el criadero y vuestra trayectoria.`
  },
  {
    type: 'contact', slug: 'contacto', title: 'Contacto',
    content: `# Contacto\n\nSi te interesa entrar en nuestra lista de espera o tienes preguntas, escríbenos. Respondemos personalmente en 24-48h.\n\n**Email:** hola@ejemplo.com\n**Teléfono / WhatsApp:** +34 600 000 000\n**Ubicación:** Ciudad, País\n\n## Antes de contactar\n\nPor favor, lee nuestra [política de reserva](#reserva) y filosofía de cría. Solo aceptamos familias alineadas con nuestro enfoque.`
  },
  {
    type: 'faq', slug: 'faq', title: 'Preguntas frecuentes',
    content: `# Preguntas frecuentes\n\n## ¿Cuándo tendréis la próxima camada?\n\nResponde aquí.\n\n## ¿Cuánto cuesta un cachorro?\n\nResponde aquí.\n\n## ¿Cómo funciona la reserva?\n\nResponde aquí.\n\n## ¿Qué documentación recibo con el cachorro?\n\nResponde aquí.`
  },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PagesListClient({ kennelId, kennelName, kennelSlug, customDomain, initialPages }: Props) {
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Page | null>(null)

  const baseUrl = customDomain ? `https://${customDomain}` : `https://genealogic.io/c/${kennelSlug}`

  function handleSaved(updated: Page) {
    setPages(ps => {
      const idx = ps.findIndex(p => p.id === updated.id)
      if (idx >= 0) {
        const copy = [...ps]; copy[idx] = updated; return copy
      }
      return [...ps, updated].sort((a, b) => a.position - b.position)
    })
    setPanelOpen(false); setEditing(null)
  }
  function handleDeleted(id: string) {
    setPages(ps => ps.filter(p => p.id !== id))
    setPanelOpen(false); setEditing(null)
  }

  async function createFromTemplate(t: typeof TEMPLATES[number]) {
    const content = t.content.replace(/{{kennel}}/g, kennelName)
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kennel_id: kennelId, slug: t.slug, title: t.title,
          page_type: t.type, content_md: content, is_published: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      handleSaved(data.page)
      setEditing(data.page)
      setPanelOpen(true)
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-muted" />
            Web pública
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {kennelName} · {pages.length} página{pages.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={baseUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium text-body hover:text-ink border border-hairline rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 hover:bg-surface-soft transition"
          >
            <ExternalLink className="w-3 h-3" /> Ver sitio
          </a>
          <Button onClick={() => { setEditing(null); setPanelOpen(true) }} variant="primary" size="md">
            <Plus className="w-4 h-4" />
            Nueva página
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-4 mb-6 flex items-start gap-3">
        <Globe className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />
        <div className="text-sm text-body leading-relaxed">
          <p className="mb-1">
            Tu sitio público está en{' '}
            <code className="text-[12px] bg-canvas border border-hairline rounded px-1">{baseUrl}</code>
          </p>
          <p className="text-muted text-[13px]">
            Cada página publicada se sirve en <code className="text-[11px]">/c/{kennelSlug}/[slug]</code>.
            {!customDomain && <> Para apuntar tu dominio propio (p.ej. <code className="text-[11px]">iremacurto.com</code>) ve a <Link href="/cuenta/dominio" className="text-ink underline">Dominio</Link>.</>}
          </p>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-xl bg-canvas p-8 text-center">
          <p className="text-sm text-muted mb-5">
            Tu sitio aún no tiene páginas. Empieza con una de las plantillas:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {TEMPLATES.map(t => {
              const Icon = PAGE_TYPE_ICON[t.type] || FileText
              return (
                <button
                  key={t.slug}
                  onClick={() => createFromTemplate(t)}
                  className="rounded-xl border border-hairline bg-canvas p-4 hover:border-ink/30 hover:shadow-sm transition text-left"
                >
                  <Icon className="w-5 h-5 text-muted mb-2" />
                  <p className="text-sm font-semibold text-ink">{t.title}</p>
                  <p className="text-[11px] text-muted">{PAGE_TYPE_LABEL[t.type]}</p>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map(p => {
            const Icon = PAGE_TYPE_ICON[p.page_type] || FileText
            return (
              <button
                key={p.id}
                onClick={() => { setEditing(p); setPanelOpen(true) }}
                className="w-full text-left rounded-xl border border-hairline bg-canvas p-4 hover:border-ink/30 hover:shadow-sm transition flex items-start gap-4"
              >
                <Icon className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-ink truncate">{p.title}</p>
                    {p.is_published ? (
                      <span className="text-[10px] font-bold uppercase tracking-[0.06em] bg-ink text-on-primary rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                        <Eye className="w-2.5 h-2.5" /> Publicada
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-[0.06em] bg-surface-card text-muted rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                        <EyeOff className="w-2.5 h-2.5" /> Borrador
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted">
                    <code className="text-[11px]">/{p.slug}</code> · {PAGE_TYPE_LABEL[p.page_type] || p.page_type} · editado {fmtDate(p.updated_at)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <PageEditorPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditing(null) }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        editing={editing}
        kennelId={kennelId}
        kennelSlug={kennelSlug}
        customDomain={customDomain}
      />
    </div>
  )
}
