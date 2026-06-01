/**
 * Editor de contratos: split markdown + preview.
 * - Toolbar mínima (negrita, cursiva, H1-3, lista, separador)
 * - Atajo Cmd+S → guardar
 * - Sin lib externa; markdown render con `renderContractMarkdown`
 */
'use client'
import { useState, useTransition, useRef, useEffect } from 'react'
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
} from 'lucide-react'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { useT } from '@/components/i18n/locale-provider'

export default function ContractEditor({
  reservationId,
  contractId,
  initialBody,
  initialTitle,
  canSend,
  onSaveAction,
  onSendAction,
}: {
  reservationId: string
  contractId: string
  initialBody: string
  initialTitle: string
  canSend: boolean
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
        className="w-full text-2xl font-bold tracking-tight text-ink bg-transparent border-0 border-b border-hairline focus:outline-none focus:border-ink/30 pb-2 mb-4"
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
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-canvas px-3 py-1.5 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t('Guardar')}
          </button>
          {canSend && (
            <button
              type="button"
              onClick={send}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-ink text-on-primary px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {t('Enviar al cliente')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 mb-2">{error}</p>
      )}

      {/* Split: editor + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
            Markdown
          </p>
          <textarea
            ref={taRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
            className="w-full h-[600px] resize-none rounded-lg border border-hairline bg-canvas p-4 text-sm font-mono text-ink focus:outline-none focus:border-ink/30"
          />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
            {t('Vista previa')}
          </p>
          <div
            className="contract-preview h-[600px] overflow-y-auto rounded-lg border border-hairline bg-canvas p-6 text-sm text-ink"
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
      className="inline-flex items-center justify-center rounded p-1.5 text-muted hover:bg-canvas hover:text-ink"
    >
      {children}
    </button>
  )
}
