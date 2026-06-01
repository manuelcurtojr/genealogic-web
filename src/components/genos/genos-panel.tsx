/**
 * Genos — panel lateral derecho con chat.
 *
 * Estructura:
 *   - Header con nombre + close
 *   - Lista de conversaciones recientes (collapsible)
 *   - Thread de la conversación activa (messages list)
 *   - Banner de escalación a humano (si el bot lo sugiere o el user lo pide)
 *   - Input + send
 *
 * Persistencia: cada conversación se guarda en DB. El id de la activa se
 * mantiene en state (no en localStorage — se pierde al cerrar y abrir).
 */
'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  X, Send, Loader2, Sparkles, Plus, ChevronLeft, User,
  Headphones, CheckCircle2, AlertCircle, MessageSquare,
} from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import {
  createConversationAction, sendMessageAction,
  listConversationsAction, getConversationMessagesAction,
  escalateToHumanAction,
} from '@/lib/genos/actions'
import { HANDOFF_TRIGGER_PHRASES } from '@/lib/genos/system-prompt'

type Msg = { id?: string; role: 'user' | 'assistant'; content: string; pending?: boolean }
type Conv = { id: string; title: string | null; updated_at: string; escalated_to_request_id: string | null }

function renderAssistant(text: string) {
  // Render mínimo markdown: links [label](href), bold **x**
  // Parser muy básico — el system prompt limita la sintaxis a estos dos.
  const parts: React.ReactNode[] = []
  const regex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1]) {
      // link
      const label = match[2]
      const href = match[3]
      const isInternal = href.startsWith('/')
      parts.push(
        isInternal
          ? <Link key={key++} href={href} className="underline font-semibold text-ink hover:opacity-80">{label}</Link>
          : <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-ink hover:opacity-80">{label}</a>
      )
    } else if (match[4]) {
      parts.push(<strong key={key++}>{match[5]}</strong>)
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

export default function GenosPanel({
  open, onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const t = useT()
  const [convs, setConvs] = useState<Conv[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [activeIsEscalated, setActiveIsEscalated] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [pending, startTransition] = useTransition()
  const [escalating, setEscalating] = useState(false)
  const [escalateSummary, setEscalateSummary] = useState('')
  const [escalateResult, setEscalateResult] = useState<{ requestId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const scrollerRef = useRef<HTMLDivElement>(null)

  // Cargar lista al abrir
  useEffect(() => {
    if (!open) return
    listConversationsAction().then((cs) => setConvs(cs)).catch(() => {})
  }, [open])

  // Auto-scroll al final
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight
    }
  }, [messages.length, pending])

  // ESC para cerrar
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  async function loadConversation(convId: string) {
    setError(null)
    setView('chat')
    setActiveConvId(convId)
    setEscalating(false)
    setEscalateResult(null)
    try {
      const msgs = await getConversationMessagesAction(convId)
      setMessages(msgs.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })))
      const c = convs.find((x) => x.id === convId)
      setActiveIsEscalated(c?.escalated_to_request_id || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Error cargando'))
    }
  }

  function startNew() {
    setActiveConvId(null)
    setActiveIsEscalated(null)
    setMessages([])
    setInput('')
    setView('chat')
    setEscalating(false)
    setEscalateResult(null)
    setError(null)
  }

  function send() {
    const txt = input.trim()
    if (!txt) return
    setInput('')
    setError(null)

    // Optimistic user msg
    const userMsg: Msg = { role: 'user', content: txt }
    const placeholder: Msg = { role: 'assistant', content: '…', pending: true }
    setMessages((prev) => [...prev, userMsg, placeholder])

    startTransition(async () => {
      try {
        let reply: string
        let newConvId = activeConvId
        if (!activeConvId) {
          const r = await createConversationAction({
            firstMessage: txt,
            contextUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          })
          reply = r.assistantMessage
          newConvId = r.conversationId
          setActiveConvId(r.conversationId)
          // refrescar lista
          listConversationsAction().then((cs) => setConvs(cs)).catch(() => {})
        } else {
          const r = await sendMessageAction({
            conversationId: activeConvId,
            userMessage: txt,
          })
          reply = r.assistantMessage
        }
        setMessages((prev) => {
          const next = [...prev]
          // sustituir placeholder
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].pending) { next[i] = { role: 'assistant', content: reply }; break }
          }
          return next
        })
        void newConvId
      } catch (e) {
        setMessages((prev) => prev.filter((m) => !m.pending))
        const msg = e instanceof Error ? e.message : t('Error')
        setError(msg)
      }
    })
  }

  function doEscalate() {
    if (!activeConvId) return
    const summary = escalateSummary.trim()
    if (summary.length < 5) {
      setError(t('Resume el problema en una frase (mín. 5 caracteres)'))
      return
    }
    startTransition(async () => {
      try {
        const r = await escalateToHumanAction({
          conversationId: activeConvId,
          summary,
        })
        setEscalateResult(r)
        setActiveIsEscalated(r.requestId)
        setEscalating(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : t('Error escalando'))
      }
    })
  }

  // El último mensaje del bot menciona handoff?
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && !m.pending)
  const suggestHandoff = lastAssistant && HANDOFF_TRIGGER_PHRASES.some((p) =>
    lastAssistant.content.toLowerCase().includes(p)
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel — header (incl. notch) y composer (incl. home bar) fijos, sólo
          scrollea la lista de mensajes en el medio. */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-canvas border-l border-hairline shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        style={{
          paddingTop: 'var(--safe-area-top)',
          paddingBottom: 'var(--safe-area-bottom)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hairline flex-shrink-0">
          <div className="flex items-center gap-2">
            {view === 'history' && (
              <button
                onClick={() => setView('chat')}
                className="text-muted hover:text-ink transition mr-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-8 h-8 min-w-[2rem] min-h-[2rem] rounded-lg bg-ink flex items-center justify-center flex-shrink-0 flex-grow-0 aspect-square">
              <Sparkles className="w-4 h-4 text-on-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink leading-none">Genos</h2>
              <p className="text-[11px] text-muted leading-none mt-0.5">{t('Asistente de Genealogic')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {view === 'chat' && convs.length > 0 && (
              <button
                onClick={() => setView('history')}
                title={t('Historial')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-card transition"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={startNew}
              title={t('Nueva conversación')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-card transition"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-card transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Vista: historial */}
        {view === 'history' ? (
          <div className="flex-1 overflow-y-auto">
            {convs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted px-6 text-center">
                <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm text-body">{t('No tienes conversaciones aún.')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-hairline-soft">
                {convs.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => loadConversation(c.id)}
                      className={`w-full text-left px-5 py-3 hover:bg-surface-soft transition ${
                        activeConvId === c.id ? 'bg-surface-soft' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-ink line-clamp-1">
                        {c.title || t('Conversación')}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-muted">
                          {new Date(c.updated_at).toLocaleString('es-ES', {
                            day: '2-digit', month: 'short',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        {c.escalated_to_request_id && (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {t('Escalada')}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            {/* Vista: chat */}
            <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-2">
                  <div className="w-14 h-14 rounded-2xl bg-ink flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6 text-on-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-ink">{t('Hola, soy Genos')}</h3>
                  <p className="text-sm text-body max-w-xs mt-1.5">
                    {t('Te ayudo con todo lo de Genealogic: criadero, perros, genealogía, web, emailbot…')}
                  </p>
                  <div className="mt-5 space-y-1.5 w-full max-w-xs">
                    <SuggestionChip
                      label={t('¿Cómo subo una foto al perro?')}
                      onClick={(s) => { setInput(s) }}
                    />
                    <SuggestionChip
                      label={t('Reclamar un perro importado')}
                      onClick={(s) => { setInput(s) }}
                    />
                    <SuggestionChip
                      label={t('Configurar mi web pública')}
                      onClick={(s) => { setInput(s) }}
                    />
                    <SuggestionChip
                      label={t('Hablar con un humano')}
                      onClick={(s) => { setInput(s) }}
                    />
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={m.id || i}
                  className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    m.role === 'user' ? 'bg-surface-card' : 'bg-ink'
                  }`}>
                    {m.role === 'user'
                      ? <User className="w-3.5 h-3.5 text-ink" />
                      : <Sparkles className="w-3.5 h-3.5 text-on-primary" />}
                  </div>
                  <div className={`flex-1 min-w-0 max-w-[85%] ${m.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block text-left rounded-2xl px-3.5 py-2.5 ${
                      m.role === 'user'
                        ? 'bg-ink text-on-primary'
                        : 'bg-surface-card text-ink'
                    }`}>
                      {m.pending ? (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {t('Pensando…')}
                        </span>
                      ) : m.role === 'assistant' ? (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {renderAssistant(m.content)}
                        </p>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Handoff banner si el bot lo sugiere y no está escalada */}
              {suggestHandoff && !activeIsEscalated && !escalating && !escalateResult && (
                <div className="rounded-xl border-2 border-ink/15 bg-surface-soft p-3 ml-9">
                  <p className="text-xs font-semibold text-ink mb-2 flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5" />
                    {t('¿Te conecto con un humano del equipo?')}
                  </p>
                  <button
                    onClick={() => setEscalating(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-3 py-1.5 text-xs font-bold hover:opacity-90"
                  >
                    {t('Sí, escalar a soporte')}
                  </button>
                </div>
              )}

              {/* Form de escalación */}
              {escalating && !escalateResult && (
                <div className="rounded-xl border-2 border-ink/20 bg-canvas p-4 ml-9">
                  <p className="text-xs font-bold text-ink mb-2 flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5" />
                    {t('Hablar con un humano')}
                  </p>
                  <p className="text-[11px] text-muted mb-2">
                    {t('Resume en una frase qué necesitas. Se enviará a soporte junto con esta conversación.')}
                  </p>
                  <textarea
                    value={escalateSummary}
                    onChange={(e) => setEscalateSummary(e.target.value)}
                    rows={3}
                    placeholder={t('Ej: el emailbot no responde a leads desde ayer…')}
                    className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none resize-none"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={doEscalate}
                      disabled={pending || escalateSummary.trim().length < 5}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink text-on-primary px-3 py-2 text-xs font-bold hover:opacity-90 disabled:opacity-50"
                    >
                      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {t('Enviar a soporte')}
                    </button>
                    <button
                      onClick={() => setEscalating(false)}
                      disabled={pending}
                      className="px-3 py-2 text-xs text-body hover:text-ink"
                    >
                      {t('Cancelar')}
                    </button>
                  </div>
                </div>
              )}

              {/* Resultado escalación */}
              {(escalateResult || activeIsEscalated) && (
                <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 ml-9">
                  <p className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('Solicitud enviada')}
                  </p>
                  <p className="text-[11px] text-emerald-800 mb-2">
                    {t('El equipo te responderá lo antes posible.')}
                  </p>
                  <Link
                    href={`/mis-solicitudes/${escalateResult?.requestId || activeIsEscalated}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 underline"
                  >
                    {t('Ver mi solicitud →')}
                  </Link>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>

            {/* Input */}
            {!activeIsEscalated && !escalateResult && (
              <div className="border-t border-hairline px-3 py-3 flex-shrink-0 bg-canvas">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        send()
                      }
                    }}
                    rows={1}
                    placeholder={t('Pregúntale a Genos…')}
                    disabled={pending}
                    className="flex-1 bg-surface-card border border-hairline rounded-xl px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none resize-none disabled:opacity-50"
                    style={{ maxHeight: '120px' }}
                  />
                  <button
                    onClick={send}
                    disabled={pending || !input.trim()}
                    className="w-10 h-10 rounded-xl bg-ink text-on-primary flex items-center justify-center hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                  >
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted mt-1.5 text-center">
                  {t('Enter para enviar · Shift+Enter para nueva línea')}
                </p>
              </div>
            )}

            {(activeIsEscalated || escalateResult) && (
              <div className="border-t border-hairline px-4 py-3 flex-shrink-0 bg-canvas">
                <button
                  onClick={startNew}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2 text-xs font-semibold text-body hover:border-ink hover:text-ink"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('Nueva conversación')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function SuggestionChip({
  label, onClick,
}: {
  label: string
  onClick: (s: string) => void
}) {
  return (
    <button
      onClick={() => onClick(label)}
      className="w-full text-left px-3 py-2 rounded-lg border border-hairline bg-canvas hover:border-ink/40 hover:bg-surface-soft transition text-xs text-body hover:text-ink"
    >
      {label}
    </button>
  )
}
