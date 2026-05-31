'use client'

import { useState } from 'react'
import { Scale, Save, Check, Eye, Code } from 'lucide-react'
import { adminUpsertGlobalLegalDoc } from '@/lib/kennel/legal-actions'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import type { LegalDocType } from '@/lib/kennel/legal'

interface Doc {
  type: LegalDocType
  label: string
  slug: string
  title: string
  body_md: string
  updated_at: string | null
}

// Placeholders disponibles — se muestran como ayuda al editar.
const PLACEHOLDERS = [
  '{{kennel_name}}', '{{kennel_legal_name}}', '{{kennel_legal_id}}',
  '{{kennel_legal_address}}', '{{kennel_legal_email}}', '{{kennel_location}}',
  '{{site_domain}}', '{{platform}}', '{{platform_legal}}', '{{platform_email}}', '{{date}}',
]

export default function AdminLegalClient({ docs }: { docs: Doc[] }) {
  const [active, setActive] = useState<LegalDocType>(docs[0]?.type || 'aviso_legal')
  const [drafts, setDrafts] = useState<Record<string, { title: string; body_md: string }>>(
    Object.fromEntries(docs.map(d => [d.type, { title: d.title, body_md: d.body_md }])),
  )
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<LegalDocType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const current = docs.find(d => d.type === active)!
  const draft = drafts[active]

  const setDraft = (patch: Partial<{ title: string; body_md: string }>) => {
    setDrafts(prev => ({ ...prev, [active]: { ...prev[active], ...patch } }))
    setSavedAt(null)
  }

  const save = async () => {
    setSaving(true); setError(null)
    try {
      await adminUpsertGlobalLegalDoc({
        docType: active,
        title: draft.title,
        bodyMd: draft.body_md,
      })
      setSavedAt(active)
      setTimeout(() => setSavedAt(null), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Scale className="w-5 h-5 text-ink" />
        <h1 className="text-2xl font-bold">Documentos legales</h1>
      </div>
      <p className="text-muted text-sm mb-6 max-w-2xl">
        Plantillas por defecto de las webs de criadero (aviso legal, privacidad,
        cookies y términos). Cada criadero puede sobrescribirlas; esto es lo que
        ven mientras no lo hagan. Usa los <strong>placeholders</strong> para que
        cada web rellene sus datos automáticamente.
      </p>

      {/* Tabs de documentos */}
      <div className="flex gap-1 border-b border-hairline mb-5 overflow-x-auto scrollbar-hide">
        {docs.map(d => (
          <button
            key={d.type}
            onClick={() => { setActive(d.type); setPreview(false) }}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              active === d.type
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <input
            type="text"
            value={draft.title}
            onChange={e => setDraft({ title: e.target.value })}
            placeholder="Título del documento"
            className="flex-1 min-w-[200px] bg-canvas border border-hairline rounded-lg px-3 py-2 text-[15px] font-semibold text-ink focus:border-ink focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(p => !p)}
              className="inline-flex items-center gap-1.5 border border-hairline rounded-lg px-3 py-2 text-[13px] font-medium text-body hover:text-ink hover:bg-surface-soft transition"
            >
              {preview ? <><Code className="w-4 h-4" /> Editar</> : <><Eye className="w-4 h-4" /> Vista previa</>}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-ink text-on-primary rounded-lg px-4 py-2 text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition"
            >
              {savedAt === active ? <><Check className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> {saving ? 'Guardando…' : 'Guardar'}</>}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {preview ? (
          <article
            className="legal-prose border border-hairline rounded-xl p-6 bg-canvas min-h-[400px]"
            // Vista previa con los placeholders SIN resolver (se ven {{...}}),
            // para que el admin sepa dónde caerá cada dato dinámico.
            dangerouslySetInnerHTML={{ __html: renderContractMarkdown(draft.body_md) }}
          />
        ) : (
          <textarea
            value={draft.body_md}
            onChange={e => setDraft({ body_md: e.target.value })}
            spellCheck={false}
            className="w-full h-[460px] bg-canvas border border-hairline rounded-xl px-4 py-3 text-[13px] font-mono leading-relaxed text-ink focus:border-ink focus:outline-none resize-y"
          />
        )}

        {/* Ayuda de placeholders */}
        <div className="rounded-xl bg-surface-soft border border-hairline p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
            Placeholders disponibles (clic para copiar)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PLACEHOLDERS.map(p => (
              <button
                key={p}
                onClick={() => { navigator.clipboard?.writeText(p) }}
                className="inline-flex items-center rounded-md bg-canvas border border-hairline px-2 py-1 text-[11.5px] font-mono text-body hover:border-ink/30 hover:text-ink transition"
                title="Copiar"
              >
                {p}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] text-muted">
            Markdown: <code>## Título</code>, <code>### Subtítulo</code>,
            {' '}<code>**negrita**</code>, listas con <code>-</code>, y <code>---</code> como separador.
            {current.updated_at && (
              <> · Última edición: {new Date(current.updated_at).toLocaleDateString('es-ES')}</>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
