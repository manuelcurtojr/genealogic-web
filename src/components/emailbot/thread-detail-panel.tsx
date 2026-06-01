'use client'

import { useEffect, useState } from 'react'
import SlidePanel from '@/components/ui/slide-panel'
import { Bot, User, AlertTriangle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n/locale-provider'

interface Thread {
  id: string
  contact_email: string
  contact_name: string | null
  subject: string | null
  status: string
  bot_replies_count: number
  last_message_at: string
  created_at: string
}

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  from_email: string
  to_email: string
  subject: string | null
  body_text: string | null
  is_from_bot: boolean
  was_flagged: boolean
  flagged_reason: string | null
  created_at: string
}

interface Props {
  open: boolean
  onClose: () => void
  thread: Thread | null
}

export default function ThreadDetailPanel({ open, onClose, thread }: Props) {
  const t = useT()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>(thread?.status || 'active')

  useEffect(() => {
    if (!thread || !open) return
    setCurrentStatus(thread.status)
    setLoading(true)
    fetch(`/api/emailbot/threads/${thread.id}/messages`)
      .then(r => r.json())
      .then(data => setMessages(data.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [thread, open])

  async function updateStatus(newStatus: string) {
    if (!thread) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/emailbot/threads/${thread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error(t('Error al actualizar'))
      setCurrentStatus(newStatus)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (!thread) return null

  return (
    <SlidePanel open={open} onClose={onClose} title={thread.contact_name || thread.contact_email}>
      {/* Meta */}
      <div className="space-y-1 mb-5 pb-4 border-b border-hairline">
        <p className="text-xs text-muted">
          <span className="font-semibold text-body">{t('Email:')}</span> {thread.contact_email}
        </p>
        {thread.subject && (
          <p className="text-xs text-muted">
            <span className="font-semibold text-body">{t('Asunto:')}</span> {thread.subject}
          </p>
        )}
        <p className="text-xs text-muted">
          <span className="font-semibold text-body">{t('Inicio:')}</span> {new Date(thread.created_at).toLocaleString('es-ES')}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] bg-surface-card text-ink rounded-full px-2 py-0.5">
            {t('Estado:')} {currentStatus === 'active' ? t('Activo') : currentStatus === 'derived_to_human' ? t('Derivado') : t('Cerrado')}
          </span>
        </div>
      </div>

      {/* Status actions */}
      <div className="flex flex-wrap gap-2 mb-5">
        {currentStatus !== 'active' && (
          <Button variant="secondary" size="sm" disabled={actionLoading} onClick={() => updateStatus('active')}>
            {t('Reabrir')}
          </Button>
        )}
        {currentStatus !== 'derived_to_human' && (
          <Button variant="secondary" size="sm" disabled={actionLoading} onClick={() => updateStatus('derived_to_human')}>
            {t('Derivar a mí')}
          </Button>
        )}
        {currentStatus !== 'closed' && (
          <Button variant="secondary" size="sm" disabled={actionLoading} onClick={() => updateStatus('closed')}>
            {t('Cerrar hilo')}
          </Button>
        )}
      </div>

      {/* Messages */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mb-3">{t('Conversación')}</p>

      {loading ? (
        <p className="text-sm text-muted text-center py-8">{t('Cargando…')}</p>
      ) : messages.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted">
          <Mail className="w-6 h-6 mx-auto mb-2 opacity-50" />
          {t('Sin mensajes en este hilo todavía.')}
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(m => (
            <div
              key={m.id}
              className={`rounded-xl border p-3 ${
                m.direction === 'inbound'
                  ? 'bg-surface-card border-hairline'
                  : m.was_flagged
                    ? 'bg-red-50/40 border-red-200/60'
                    : 'bg-canvas border-hairline border-l-2 border-l-ink'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {m.direction === 'inbound' ? (
                  <User className="w-3.5 h-3.5 text-muted" />
                ) : m.was_flagged ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-ink" />
                )}
                <span className="text-[11px] font-semibold text-ink">
                  {m.direction === 'inbound'
                    ? t('Cliente')
                    : m.was_flagged
                      ? t('Bot · escalado')
                      : t('Bot')}
                </span>
                <span className="text-[10px] text-muted ml-auto">
                  {new Date(m.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {m.was_flagged && m.flagged_reason && (
                <p className="text-[11px] text-red-700 mb-2 italic">{t('Motivo:')} {m.flagged_reason}</p>
              )}
              {m.body_text ? (
                <pre className="text-xs text-body whitespace-pre-wrap font-sans leading-relaxed">{m.body_text}</pre>
              ) : (
                <p className="text-xs text-muted italic">{t('(sin contenido)')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </SlidePanel>
  )
}
