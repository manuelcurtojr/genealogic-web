/**
 * Chat compartido cliente↔criador para una reserva.
 * Recibe los mensajes ya cargados desde el server + una server action de envío.
 *
 * El componente:
 *  - Pinta los mensajes alineados según `currentRole` (mis mensajes a la derecha)
 *  - Tiene un textarea + Enter (Shift+Enter = newline)
 *  - Optimistic UI con useTransition
 *  - Muestra adjuntos del mensaje (downloads), no permite subir adjuntos
 *    desde aquí (TODO Fase D+)
 */
'use client'
import { useState, useTransition, useRef, useEffect } from 'react'
import { Send, Loader2, Paperclip } from 'lucide-react'
import type { ReservationMessage } from '@/lib/reservations/messages-shared'
import { formatMessageTime } from '@/lib/reservations/messages-shared'
import { useT } from '@/components/i18n/locale-provider'

export default function ReservationThread({
  messages,
  currentRole,
  reservationId,
  onSendAction,
  otherSideName,
  variant = 'card',
}: {
  messages: ReservationMessage[]
  currentRole: 'client' | 'breeder'
  reservationId: string
  onSendAction: (
    reservationId: string,
    body: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  /** Nombre que se muestra cuando NO hay mensajes ("Escribir a Irema Curtó..."). */
  otherSideName: string
  /** 'card' (default): wrapper con border + h-[500px] — para empotrar en una
   *  página. 'fill': sin border ni altura fija, ocupa el 100% del padre —
   *  para panels laterales (ReservationChatPanel) donde el contenedor
   *  controla la altura. */
  variant?: 'card' | 'fill'
}) {
  const t = useT()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on mount and on new message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages.length])

  function handleSend() {
    const body = text.trim()
    if (!body) return
    setError(null)
    startTransition(async () => {
      const res = await onSendAction(reservationId, body)
      if (res.ok) {
        setText('')
      } else {
        setError(res.error)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const wrapperClass = variant === 'fill'
    ? 'flex flex-col h-full bg-canvas overflow-hidden'
    : 'flex flex-col h-[500px] rounded-2xl border border-hairline bg-canvas overflow-hidden'

  return (
    <div className={wrapperClass}>
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-muted max-w-xs">
              {t('Aún no hay mensajes. Escribe el primero a')} <strong>{otherSideName}</strong>.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isMine={m.sender_role === currentRole}
            />
          ))
        )}
      </div>

      <div className="border-t border-hairline bg-surface-card p-3">
        {error && (
          <p className="text-xs text-red-600 mb-2">{error}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={pending}
            placeholder={`${t('Escribir a')} ${otherSideName}...`}
            rows={1}
            style={{ maxHeight: '120px' }}
            className="flex-1 resize-none rounded-xl border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-ink disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={pending || !text.trim()}
            className="w-10 h-10 rounded-xl bg-ink text-on-primary flex items-center justify-center hover:opacity-90 disabled:opacity-50 flex-shrink-0"
            title={t('Enviar (Enter)')}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[10px] text-muted mt-1.5">
          {t('Enter para enviar · Shift+Enter para nueva línea')}
        </p>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isMine,
}: {
  message: ReservationMessage
  isMine: boolean
}) {
  const t = useT()
  const isSystem = message.sender_role === 'system'
  if (isSystem) {
    return (
      <div className="text-center">
        <span className="inline-block rounded-full bg-surface-card px-3 py-1 text-[11px] text-muted">
          {message.body}
        </span>
      </div>
    )
  }

  const senderLabel =
    message.sender_name ||
    (message.sender_role === 'client' ? t('Cliente') : t('Criador'))

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
          isMine
            ? 'bg-ink text-on-primary rounded-br-sm'
            : 'bg-surface-card text-ink rounded-bl-sm'
        }`}
      >
        {!isMine && (
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-0.5">
            {senderLabel}
            {message.origin === 'email' && ` · ${t('vía email')}`}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.body}</p>
        {message.attachments.length > 0 && (
          <ul className="mt-2 space-y-1">
            {message.attachments.map((a, i) => (
              <li key={i}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 text-xs underline ${
                    isMine ? 'opacity-90' : 'text-body'
                  }`}
                >
                  <Paperclip className="h-3 w-3" />
                  {a.filename}
                </a>
              </li>
            ))}
          </ul>
        )}
        <p
          className={`text-[10px] mt-1 ${
            isMine ? 'opacity-60' : 'text-muted'
          }`}
        >
          {formatMessageTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
