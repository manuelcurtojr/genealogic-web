'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, BookOpen, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import KnowledgeFormPanel from './knowledge-form-panel'
import KnowledgeImporter from './knowledge-importer'
import { isEarlyAccessKennel } from '@/lib/early-access'
import { ComingSoonChip } from '@/components/early-access/coming-soon'

interface Entry {
  id: string
  category: string
  title: string
  content: string
  position: number
  is_active: boolean
  updated_at: string
}

interface Props {
  kennelId: string
  kennelName: string
  initialEntries: Entry[]
}

export const CATEGORIES: { key: string; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'precio', label: 'Precio' },
  { key: 'salud', label: 'Salud' },
  { key: 'reserva', label: 'Reserva' },
  { key: 'entrega', label: 'Entrega' },
  { key: 'filosofia', label: 'Filosofía de cría' },
  { key: 'faq', label: 'FAQ' },
  { key: 'condiciones', label: 'Condiciones' },
]

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.key, c.label])
)

export default function KnowledgePageClient({ kennelId, kennelName, initialEntries }: Props) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [importerOpen, setImporterOpen] = useState(false)

  const filtered = useMemo(() => {
    let result = entries
    if (activeCategory !== 'all') {
      result = result.filter(e => e.category === activeCategory)
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q)
      )
    }
    return result
  }, [entries, activeCategory, query])

  const countByCategory = useMemo(() => {
    const m: Record<string, number> = {}
    for (const e of entries) m[e.category] = (m[e.category] || 0) + 1
    return m
  }, [entries])

  function handleSaved(updated: Entry) {
    setEntries(es => {
      const idx = es.findIndex(e => e.id === updated.id)
      if (idx >= 0) {
        const copy = [...es]
        copy[idx] = updated
        return copy
      }
      return [...es, updated].sort((a, b) =>
        a.category.localeCompare(b.category) || a.position - b.position
      )
    })
    setPanelOpen(false)
    setEditing(null)
  }

  function handleDeleted(id: string) {
    setEntries(es => es.filter(e => e.id !== id))
    setPanelOpen(false)
    setEditing(null)
  }

  const activeEntries = entries.filter(e => e.is_active).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Biblioteca</h1>
          <p className="text-sm text-muted mt-0.5">
            {kennelName} · {entries.length} entrada{entries.length === 1 ? '' : 's'}
            {entries.length > activeEntries && (
              <span className="text-muted"> · {activeEntries} activa{activeEntries === 1 ? '' : 's'}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEarlyAccessKennel(kennelId) ? (
            <Button onClick={() => setImporterOpen(true)} size="md" variant="secondary">
              <Sparkles className="w-4 h-4" />
              Importar con IA
            </Button>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-sm font-medium text-muted cursor-not-allowed"
              title="Importar URL/PDF/DOC con IA — disponible para todos pronto"
            >
              <Sparkles className="w-4 h-4 opacity-50" />
              Importar con IA
              <ComingSoonChip featureId="ai_importer" />
            </span>
          )}
          <Button onClick={() => { setEditing(null); setPanelOpen(true) }} size="md" variant="primary">
            <Plus className="w-4 h-4" />
            Nueva entrada
          </Button>
        </div>
      </div>
      {isEarlyAccessKennel(kennelId) && (
        <KnowledgeImporter
          open={importerOpen}
          onClose={() => setImporterOpen(false)}
          kennelId={kennelId}
        />
      )}

      {/* Hint */}
      <div className="rounded-xl border border-hairline bg-surface-card p-4 mb-6 flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />
        <div className="text-sm text-body leading-relaxed">
          <p>
            Las entradas de la Biblioteca son lo que el <strong>Emailbot</strong> usa como
            contexto para responder. Estructura tu información como entradas independientes
            (precio del cachorro, política de reserva, qué incluye la entrega…) — el bot
            elegirá las más relevantes para cada consulta.
          </p>
        </div>
      </div>

      {/* Filters: categories */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition ${
            activeCategory === 'all'
              ? 'bg-ink text-on-primary'
              : 'border border-hairline text-body hover:text-ink hover:bg-surface-soft'
          }`}
        >
          Todas ({entries.length})
        </button>
        {CATEGORIES.map(c => {
          const count = countByCategory[c.key] || 0
          if (count === 0) return null
          return (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition ${
                activeCategory === c.key
                  ? 'bg-ink text-on-primary'
                  : 'border border-hairline text-body hover:text-ink hover:bg-surface-soft'
              }`}
            >
              {c.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar en título o contenido…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-ink transition"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-hairline rounded-xl bg-canvas">
          <p className="text-sm text-muted mb-3">
            {entries.length === 0
              ? 'Aún no tienes entradas. Empieza añadiendo precio, política de reserva y filosofía.'
              : 'Ninguna entrada coincide con el filtro.'}
          </p>
          {entries.length === 0 && (
            <Button onClick={() => { setEditing(null); setPanelOpen(true) }} variant="secondary" size="sm">
              Crear primera entrada
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(e => (
            <button
              key={e.id}
              onClick={() => { setEditing(e); setPanelOpen(true) }}
              className={`w-full text-left rounded-xl border border-hairline bg-canvas p-4 hover:border-ink/30 hover:shadow-sm transition ${!e.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted bg-surface-card rounded-full px-2 py-0.5">
                      {CATEGORY_LABEL[e.category] || e.category}
                    </span>
                    {!e.is_active && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted">
                        <EyeOff className="w-3 h-3" /> Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-ink mb-1">{e.title}</p>
                  <p className="text-xs text-muted line-clamp-2 whitespace-pre-line">{e.content}</p>
                </div>
                <Eye className="w-4 h-4 text-muted flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}

      <KnowledgeFormPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditing(null) }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        editing={editing}
        kennelId={kennelId}
      />
    </div>
  )
}
