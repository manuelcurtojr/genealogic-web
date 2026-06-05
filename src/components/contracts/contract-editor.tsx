/**
 * Editor de contratos: split markdown + preview.
 * - Toolbar mínima (negrita, cursiva, H1-3, lista, separador)
 * - Atajo Cmd+S → guardar
 * - Sin lib externa; markdown render con `renderContractMarkdown`
 */
'use client'
import { useState, useTransition, useRef, useEffect, useMemo } from 'react'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  Minus,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  Lock,
  AlertCircle,
} from 'lucide-react'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { validateContractBody } from '@/lib/contracts/required-tokens'
import type { ContractKind } from '@/lib/contracts/templates'
import { useT } from '@/components/i18n/locale-provider'

export default function ContractEditor({
  reservationId,
  contractId,
  initialBody,
  initialTitle,
  canSend,
  kind,
  onSaveAction,
  onSendAction,
}: {
  reservationId: string
  contractId: string
  initialBody: string
  initialTitle: string
  canSend: boolean
  /** Kind del contrato, para validar tokens requeridos en tiempo real.
   *  Si no se pasa, el checklist no aparece (compat con callers viejos). */
  kind?: ContractKind
  onSaveAction: (
    reservationId: string,
    contractId: string,
    body: string,
    title?: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  onSendAction: (
    reservationId: string,
    contractId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
}) {
  const t = useT()
  const [body, setBody] = useState(initialBody)
  const [title, setTitle] = useState(initialTitle)
  const [pending, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Validación en vivo de tokens requeridos. Si el criador borra alguno
  // mientras edita el markdown, le mostramos un aviso ANTES de que intente
  // guardar (y el save action también valida server-side).
  const validation = useMemo(() => {
    if (!kind) return null
    return validateContractBody(body, kind)
  }, [body, kind])
  // En móvil mostramos una sola columna a la vez (Editar / Vista). En lg el
  // split de 2 columnas se muestra completo y este estado es irrelevante.
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit')
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Cmd+S
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, title])

  function save() {
    setError(null)
    startTransition(async () => {
      const res = await onSaveAction(reservationId, contractId, body, title)
      if (res.ok) setSavedAt(new Date().toLocaleTimeString('es-ES'))
      else setError(res.error)
    })
  }

  function send() {
    if (!confirm(t('¿Enviar el contrato al cliente? Después de enviar no podrás editarlo (puedes cancelar y reescribir).'))) return
    setError(null)
    startTransition(async () => {
      // Save first
      await onSaveAction(reservationId, contractId, body, title)
      const res = await onSendAction(reservationId, contractId)
      if (!res.ok) setError(res.error)
    })
  }

  function insertWrap(before: string, after = before) {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const sel = body.slice(start, end)
    const next = body.slice(0, start) + before + sel + after + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, end + before.length)
    })
  }

  function insertLinePrefix(prefix: string) {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = body.lastIndexOf('\n', start - 1) + 1
    const next = body.slice(0, lineStart) + prefix + body.slice(lineStart)
    setBody(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length)
    })
  }

  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('Título del contrato')}
        className="w-full text-xl sm:text-2xl font-bold tracking-tight text-ink bg-transparent border-0 border-b border-hairline focus:outline-none focus:border-ink/30 pb-2 mb-4"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 mb-2 rounded-lg border border-hairline bg-surface-card p-1">
        <ToolbarBtn onClick={() => insertLinePrefix('# ')} title="H1">
          <Heading1 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => insertLinePrefix('## ')} title="H2">
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => insertLinePrefix('### ')} title="H3">
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>
        <div className="w-px h-5 bg-hairline mx-1" />
        <ToolbarBtn onClick={() => insertWrap('**')} title={t('Negrita (Cmd+B)')}>
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => insertWrap('*')} title={t('Cursiva')}>
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <div className="w-px h-5 bg-hairline mx-1" />
        <ToolbarBtn onClick={() => insertLinePrefix('- ')} title={t('Lista')}>
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setBody(body + '\n\n---\n\n')} title={t('Separador')}>
          <Minus className="h-4 w-4" />
        </ToolbarBtn>

        <div className="ml-auto flex items-center gap-2">
          {savedAt && !pending && (
            <span className="text-[11px] text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {t('Guardado')} {savedAt}
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-canvas px-3 py-2 sm:py-1.5 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t('Guardar')}
          </button>
          {canSend && (
            <button
              type="button"
              onClick={send}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-ink text-on-primary px-3 py-2 sm:py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {t('Enviar al cliente')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 mb-2 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Bloques dinámicos requeridos (modo avanzado) ──────────────
          Mostramos en vivo qué tokens críticos están presentes en el
          markdown. Si el criador borra alguno (ej: {{clientName}}),
          aparece rojo y al pulsar Guardar el server lo rechaza. */}
      {validation && (
        <div className={`rounded-xl border px-3 py-2.5 mb-3 text-[12px] ${
          validation.ok
            ? 'border-emerald-200 bg-emerald-50/40'
            : 'border-amber-300 bg-amber-50'
        }`}>
          <div className="flex items-start gap-2">
            <Lock className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${
              validation.ok ? 'text-emerald-700' : 'text-amber-700'
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`font-semibold leading-tight ${
                validation.ok ? 'text-emerald-900' : 'text-amber-900'
              }`}>
                {validation.ok
                  ? `✓ ${t('Todos los bloques dinámicos requeridos están presentes')}`
                  : `${t('Faltan bloques dinámicos obligatorios')} (${validation.missing.length})`}
              </p>
              <p className={`mt-0.5 leading-snug ${
                validation.ok ? 'text-emerald-800' : 'text-amber-800'
              }`}>
                {validation.ok
                  ? t('Puedes editar el texto a mano, pero NO borres los {{tokens}} críticos — el contrato no será válido sin ellos.')
                  : t('Restáuralos en el markdown antes de guardar:')}
              </p>
              {!validation.ok && (
                <ul className="mt-1.5 space-y-0.5">
                  {validation.missing.map((m) => (
                    <li key={m.token} className="text-amber-900 font-mono text-[11px]">
                      <code className="bg-amber-100 px-1 rounded">{`{{${m.token}}}`}</code>{' '}
                      <span className="font-sans text-[11px] text-amber-800">— {m.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conmutador Editar / Vista — solo en móvil (en lg se ve el split). */}
      <div className="mb-2 inline-flex rounded-lg border border-hairline bg-surface-card p-0.5 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('edit')}
          aria-pressed={mobileTab === 'edit'}
          className={`rounded-md px-4 py-1.5 text-xs font-semibold ${
            mobileTab === 'edit' ? 'bg-ink text-on-primary' : 'text-muted'
          }`}
        >
          {t('Editar')}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          aria-pressed={mobileTab === 'preview'}
          className={`rounded-md px-4 py-1.5 text-xs font-semibold ${
            mobileTab === 'preview' ? 'bg-ink text-on-primary' : 'text-muted'
          }`}
        >
          {t('Vista previa')}
        </button>
      </div>

      {/* Split: editor + preview. En móvil se apila y solo se muestra la
          pestaña activa; en lg ambas columnas a la vez. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={mobileTab === 'edit' ? 'block' : 'hidden lg:block'}>
          <p className="hidden lg:block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
            Markdown
          </p>
          <textarea
            ref={taRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
            className="w-full h-[60vh] lg:h-[600px] resize-none rounded-lg border border-hairline bg-canvas p-4 text-base sm:text-sm font-mono text-ink focus:outline-none focus:border-ink/30"
          />
        </div>
        <div className={mobileTab === 'preview' ? 'block' : 'hidden lg:block'}>
          <p className="hidden lg:block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
            {t('Vista previa')}
          </p>
          <div
            className="contract-preview min-w-0 overflow-x-hidden break-words h-[60vh] lg:h-[600px] overflow-y-auto rounded-lg border border-hairline bg-canvas p-4 sm:p-6 text-sm text-ink"
            dangerouslySetInnerHTML={{ __html: renderContractMarkdown(body) }}
          />
        </div>
      </div>
    </div>
  )
}

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center justify-center rounded p-2 sm:p-1.5 text-muted hover:bg-canvas hover:text-ink"
    >
      {children}
    </button>
  )
}
