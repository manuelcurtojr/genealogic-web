/**
 * Panel modal para importar contenido a la biblioteca con IA.
 *
 * 2 modos:
 *  - URL: pega URL de su web → scrape + extract con IA
 *  - Archivo: sube PDF/DOC/TXT → parse + extract con IA
 *
 * Tras importar, muestra el preview y un mensaje con cuántas entries
 * se han creado y cuánto costó. Recarga la página para refrescar la lista.
 */
'use client'

import { useState, useRef } from 'react'
import { X, Globe, Upload, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

type Mode = 'url' | 'file'

type ImportResult = {
  ok: boolean
  entries_created: number
  preview?: { category: string; title: string; content: string }[]
  cost_usd?: number
  model_used?: string
  page_title?: string | null
  filename?: string
  pages?: number
  message?: string
  error?: string
}

export default function KnowledgeImporter({
  open,
  onClose,
  kennelId,
}: {
  open: boolean
  onClose: () => void
  kennelId: string
}) {
  const t = useT()
  const [mode, setMode] = useState<Mode>('url')
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  async function submitUrl(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setSubmitting(true); setResult(null)
    try {
      const res = await fetch('/api/knowledge/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId, url: url.trim() }),
      })
      const json = await res.json()
      setResult({ ...json, ok: res.ok })
    } catch (err) {
      setResult({ ok: false, entries_created: 0, error: err instanceof Error ? err.message : t('Error de red') })
    } finally {
      setSubmitting(false)
    }
  }

  async function submitFile(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setSubmitting(true); setResult(null)
    try {
      const fd = new FormData()
      fd.append('kennel_id', kennelId)
      fd.append('file', file)
      const res = await fetch('/api/knowledge/import-file', {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      setResult({ ...json, ok: res.ok })
    } catch (err) {
      setResult({ ok: false, entries_created: 0, error: err instanceof Error ? err.message : t('Error de red') })
    } finally {
      setSubmitting(false)
    }
  }

  function finishAndReload() {
    onClose()
    if (result?.ok && result.entries_created > 0) {
      window.location.reload()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-canvas rounded-2xl border border-hairline shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ink" />
            <h2 className="text-lg font-bold text-ink">{t('Importar con IA')}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {!result && (
          <div className="flex border-b border-hairline px-6">
            <TabButton active={mode === 'url'} onClick={() => setMode('url')} icon={Globe}>
              {t('Desde URL')}
            </TabButton>
            <TabButton active={mode === 'file'} onClick={() => setMode('file')} icon={Upload}>
              {t('Desde archivo')}
            </TabButton>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {result ? (
            <ResultView result={result} onContinue={finishAndReload} />
          ) : mode === 'url' ? (
            <form onSubmit={submitUrl} className="space-y-4">
              <div>
                <p className="text-sm text-body mb-3">
                  {t('Pega la URL de tu web (página de inicio, condiciones, FAQ…). La IA extraerá la información relevante y la añadirá a la biblioteca como entradas categorizadas.')}
                </p>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
                  {t('URL')}
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://iremacurto.com/condiciones"
                  disabled={submitting}
                  className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-muted">
                {t('Coste estimado: ~0,01-0,05 USD por página. Se carga a tu cuenta de Genealogic (no necesitas tu propia API de IA).')}
              </p>
              <SubmitBtn submitting={submitting} disabled={!url.trim()}>
                {t('Importar página')}
              </SubmitBtn>
            </form>
          ) : (
            <form onSubmit={submitFile} className="space-y-4">
              <div>
                <p className="text-sm text-body mb-3">
                  {t('Sube un PDF, Word (.docx) o texto plano (.txt/.md) con información del criadero (condiciones, contrato, FAQ, manual de bienvenida…).')}
                </p>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
                  {t('Archivo (max 20 MB)')}
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                  disabled={submitting}
                  className="w-full text-xs text-body file:mr-2 file:rounded file:border-0 file:bg-ink file:text-on-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold hover:file:opacity-90"
                />
              </div>
              <p className="text-[11px] text-muted">
                {t('PDFs escaneados sin OCR no funcionan (la IA necesita el texto). Coste estimado: ~0,01-0,10 USD según número de páginas.')}
              </p>
              <SubmitBtn submitting={submitting} disabled={false}>
                {t('Importar archivo')}
              </SubmitBtn>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active, onClick, icon: Icon, children,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Globe
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
        active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-body'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  )
}

function SubmitBtn({
  submitting, disabled, children,
}: { submitting: boolean; disabled: boolean; children: React.ReactNode }) {
  const t = useT()
  return (
    <button
      type="submit"
      disabled={submitting || disabled}
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ink text-on-primary px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
    >
      {submitting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('Procesando con IA...')}
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          {children}
        </>
      )}
    </button>
  )
}

function ResultView({ result, onContinue }: { result: ImportResult; onContinue: () => void }) {
  const t = useT()
  if (!result.ok) {
    return (
      <div>
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">{t('Error al importar')}</p>
            <p className="text-sm text-red-800 mt-1">{result.error || t('Error desconocido')}</p>
          </div>
        </div>
        <button
          onClick={onContinue}
          className="w-full rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:bg-surface-soft"
        >
          {t('Cerrar')}
        </button>
      </div>
    )
  }

  if (result.entries_created === 0) {
    return (
      <div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">{t('Sin información útil')}</p>
            <p className="text-sm text-amber-800 mt-1">
              {result.message || t('La IA no encontró nada estructurado para añadir.')}
            </p>
          </div>
        </div>
        {result.cost_usd != null && (
          <p className="text-[11px] text-muted mb-3">
            {t('Coste de la consulta:')} ${result.cost_usd.toFixed(4)} USD ({result.model_used})
          </p>
        )}
        <button
          onClick={onContinue}
          className="w-full rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:bg-surface-soft"
        >
          {t('Cerrar')}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3 mb-4">
        <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            ✓ {result.entries_created} {t(result.entries_created === 1 ? 'entrada' : 'entradas')} {t(result.entries_created === 1 ? 'añadida' : 'añadidas')}
          </p>
          <p className="text-sm text-emerald-800 mt-0.5">
            {result.page_title || result.filename}
            {result.pages ? ` · ${result.pages} ${t('págs')}` : ''}
            {result.cost_usd != null && ` · $${result.cost_usd.toFixed(4)} USD`}
          </p>
        </div>
      </div>

      {result.preview && result.preview.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
            {t('Vista previa (primeras 3)')}
          </p>
          <ul className="space-y-2">
            {result.preview.map((p, i) => (
              <li key={i} className="rounded-lg border border-hairline bg-canvas p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{p.category}</p>
                <p className="text-sm font-semibold text-ink mt-0.5">{p.title}</p>
                <p className="text-xs text-body mt-1 line-clamp-2">{p.content}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full rounded-lg bg-ink text-on-primary px-4 py-2.5 text-sm font-semibold hover:opacity-90"
      >
        {t('Ver biblioteca actualizada')}
      </button>
    </div>
  )
}
