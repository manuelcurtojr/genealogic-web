/**
 * FeedbackButton — botón flotante "¿Algo ha salido mal?" para zonas críticas.
 *
 * Uso:
 *   <FeedbackButton scope="importer" pageLabel="Importador de pedigrees" />
 *
 * Comportamiento:
 *   - Botón discreto bottom-right (no obstruye contenido)
 *   - Al pulsar abre un modal con DOS pasos:
 *       1) Chat opcional con la IA (intenta resolver in-situ)
 *       2) Textarea + enviar → crea admin_request type='feedback'
 *          con auto-captura de página/URL/viewport/UA/transcript IA
 *   - Notifica al super admin por email automáticamente
 *
 * Diseño minimalista: el botón debe ser visible pero no molesto. El modal
 * tiene fricción mínima (no le pedimos subject, lo autogeneramos).
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircleWarning, X, Send, Sparkles, Loader2, CheckCircle2, Bot, User as UserIcon } from 'lucide-react'
import { createFeedbackAction } from '@/lib/admin-requests/actions'
import type { FeedbackScope } from '@/lib/admin-requests/types'

type Msg = { role: 'user' | 'assistant'; content: string; pending?: boolean }

interface Props {
  scope: FeedbackScope
  /** Texto humano de en qué zona está el user. Va al email del admin. */
  pageLabel: string
  /** Ancla del botón. Por defecto bottom-right fijo. */
  variant?: 'fixed' | 'inline'
  /** Texto custom para el botón. Por defecto "¿Algo ha salido mal?" */
  label?: string
}

export default function FeedbackButton({
  scope, pageLabel, variant = 'fixed', label = '¿Algo ha salido mal?',
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {variant === 'fixed' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3.5 py-2 text-[12.5px] font-semibold text-body shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur hover:border-ink/30 hover:text-ink hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] transition-all"
          aria-label={label}
        >
          <MessageCircleWarning className="h-3.5 w-3.5 text-amber-600" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-soft px-3 py-1.5 text-[12.5px] font-semibold text-body hover:border-ink/30 hover:text-ink transition"
        >
          <MessageCircleWarning className="h-3.5 w-3.5 text-amber-600" />
          {label}
        </button>
      )}

      {open && (
        <FeedbackModal
          scope={scope}
          pageLabel={pageLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

// ─── Modal ──────────────────────────────────────────────────────────────────

function FeedbackModal({
  scope, pageLabel, onClose,
}: {
  scope: FeedbackScope
  pageLabel: string
  onClose: () => void
}) {
  const [aiMessages, setAiMessages] = useState<Msg[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiPending, setAiPending] = useState(false)
  const [aiOpen, setAiOpen] = useState(false) // colapsado por defecto

  const [ticketMessage, setTicketMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ id: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const ticketRef = useRef<HTMLTextAreaElement>(null)
  const aiScrollerRef = useRef<HTMLDivElement>(null)

  // Cerrar con Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !sending) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, sending])

  // Autoscroll del chat IA
  useEffect(() => {
    if (aiScrollerRef.current) {
      aiScrollerRef.current.scrollTop = aiScrollerRef.current.scrollHeight
    }
  }, [aiMessages])

  async function askAI() {
    const text = aiInput.trim()
    if (!text || aiPending) return
    setAiInput('')
    const newUser: Msg = { role: 'user', content: text }
    const placeholder: Msg = { role: 'assistant', content: '', pending: true }
    const nextMessages = [...aiMessages, newUser, placeholder]
    setAiMessages(nextMessages)
    setAiPending(true)

    try {
      const res = await fetch('/api/feedback/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          pageLabel,
          // Mandamos solo lo "real", sin el placeholder pendiente
          messages: [...aiMessages, newUser].map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply: string = data.reply || 'No he podido procesar tu pregunta. Mándalo abajo como feedback.'

      setAiMessages(prev => {
        const copy = [...prev]
        // Reemplaza el placeholder por la respuesta real
        const lastIdx = copy.length - 1
        if (copy[lastIdx]?.pending) {
          copy[lastIdx] = { role: 'assistant', content: reply }
        } else {
          copy.push({ role: 'assistant', content: reply })
        }
        return copy
      })
    } catch {
      setAiMessages(prev => {
        const copy = [...prev]
        const lastIdx = copy.length - 1
        if (copy[lastIdx]?.pending) {
          copy[lastIdx] = {
            role: 'assistant',
            content: 'No he podido conectar. Escribe el problema abajo y lo revisamos en menos de 24h.',
          }
        }
        return copy
      })
    } finally {
      setAiPending(false)
    }
  }

  async function sendTicket() {
    const msg = ticketMessage.trim()
    if (!msg || msg.length < 5) {
      setError('Escribe al menos unos detalles sobre lo que ha pasado.')
      ticketRef.current?.focus()
      return
    }
    setError(null)
    setSending(true)

    try {
      // Auto-captura del contexto del browser
      const pageUrl = typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : ''
      const viewport = typeof window !== 'undefined'
        ? `${window.innerWidth}x${window.innerHeight}`
        : undefined
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined

      // Si hubo conversación con la IA, la mandamos para que el admin tenga
      // todo el contexto del intento de auto-resolución
      const aiConversation = aiMessages
        .filter(m => !m.pending)
        .map(m => ({ role: m.role, content: m.content }))

      const result = await createFeedbackAction({
        scope,
        message: msg,
        pageLabel,
        pageUrl,
        viewport,
        userAgent,
        aiConversation: aiConversation.length > 0 ? aiConversation : undefined,
      })
      setSent({ id: result.id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el feedback. Inténtalo de nuevo.')
    } finally {
      setSending(false)
    }
  }

  // Estado "enviado" — pantalla de éxito
  if (sent) {
    return (
      <ModalShell onClose={onClose}>
        <div className="px-6 py-10 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-6 w-6 text-emerald-700" strokeWidth={2.5} />
          </div>
          <h2 className="text-lg font-semibold text-ink">¡Recibido!</h2>
          <p className="mt-2 text-[14px] text-body max-w-sm mx-auto">
            Tu feedback acaba de llegar al equipo. Lo revisamos a menudo (suele ser
            en menos de 24h) y si necesitamos más detalle te escribimos al email.
          </p>
          <p className="mt-3 text-[11px] text-muted font-mono">Ticket: {sent.id.slice(0, 8)}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 transition"
          >
            Cerrar
          </button>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose}>
      {/* Header */}
      <div className="border-b border-hairline px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2">
              <MessageCircleWarning className="h-4 w-4 text-amber-600" />
              Cuéntanos qué ha pasado
            </h2>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Zona: <span className="font-medium text-body">{pageLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-md p-1 text-muted hover:bg-surface-soft hover:text-ink disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {/* Bloque IA — opcional, colapsado por defecto */}
        <div className="border-b border-hairline">
          <button
            type="button"
            onClick={() => setAiOpen(o => !o)}
            className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-[13px] font-medium hover:bg-surface-soft transition"
          >
            <span className="flex items-center gap-2 text-ink">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--brand,#FE6620)]" />
              ¿Preguntar primero a la IA? <span className="text-muted font-normal">(opcional)</span>
            </span>
            <span className="text-[11px] text-muted">{aiOpen ? 'Ocultar' : 'Probar'}</span>
          </button>

          {aiOpen && (
            <div className="px-5 pb-4 space-y-2">
              <p className="text-[11.5px] text-muted leading-snug">
                Si tu problema es común te lo resolvemos al instante. Si no, manda el
                ticket abajo y lo miramos nosotros.
              </p>

              {aiMessages.length > 0 && (
                <div
                  ref={aiScrollerRef}
                  className="max-h-56 overflow-y-auto rounded-lg border border-hairline bg-surface-soft p-3 space-y-3"
                >
                  {aiMessages.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 text-[13px]">
                      {m.role === 'assistant' ? (
                        <Bot className="h-4 w-4 mt-0.5 text-[color:var(--brand,#FE6620)] flex-shrink-0" />
                      ) : (
                        <UserIcon className="h-4 w-4 mt-0.5 text-muted flex-shrink-0" />
                      )}
                      <div className={m.role === 'assistant' ? 'text-body' : 'text-ink font-medium'}>
                        {m.pending ? (
                          <span className="inline-flex items-center gap-1.5 text-muted">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Pensando...
                          </span>
                        ) : (
                          m.content
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      askAI()
                    }
                  }}
                  disabled={aiPending}
                  placeholder="Ej: el importador no detecta este perro"
                  className="flex-1 rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={askAI}
                  disabled={!aiInput.trim() || aiPending}
                  className="inline-flex items-center justify-center rounded-lg bg-ink px-3 py-2 text-on-primary disabled:opacity-40 hover:opacity-90 transition"
                  aria-label="Preguntar"
                >
                  {aiPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ticket — siempre visible */}
        <div className="px-5 py-4 space-y-3">
          <label className="block">
            <span className="text-[13px] font-semibold text-ink">Describe el problema</span>
            <span className="block text-[11.5px] text-muted mt-0.5">
              Qué intentabas hacer, qué pasó y qué esperabas. Cuanto más concreto, antes lo arreglamos.
            </span>
            <textarea
              ref={ticketRef}
              value={ticketMessage}
              onChange={e => setTicketMessage(e.target.value)}
              rows={5}
              disabled={sending}
              placeholder="Estaba subiendo una foto al perro Rocky y me sale 'error al guardar'. La foto pesa 2MB y es JPG. Ya lo intenté 3 veces."
              className="mt-1.5 w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[13.5px] text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition disabled:opacity-60 resize-none"
            />
          </label>

          <p className="text-[11px] text-muted leading-snug">
            Capturamos automáticamente la página y el navegador. No subimos contraseñas
            ni datos de tarjeta — esto solo lo ve el equipo de Genealogic.
          </p>

          {error && (
            <p className="text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Footer fixed con submit */}
      <div className="border-t border-hairline bg-surface-soft px-5 py-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={sending}
          className="rounded-lg px-3 py-2 text-[13px] font-semibold text-body hover:text-ink disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={sendTicket}
          disabled={sending || !ticketMessage.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-40 transition"
        >
          {sending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Enviar feedback
            </>
          )}
        </button>
      </div>
    </ModalShell>
  )
}

// ─── Shell común del modal (backdrop + centrado + animation) ───────────────

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      {/* Sheet (mobile bottom) / Modal centrado (desktop) */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-lg bg-canvas rounded-t-2xl sm:rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-hairline overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
