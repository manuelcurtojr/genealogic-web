/**
 * Panel deslizante de notificaciones (header → campana).
 * Versión mejorada con:
 *  - Iconos por tipo consistentes con /notifications (catálogo unificado)
 *  - Realtime: nuevas notifs aparecen al instante
 *  - Mensajes humanizados (imports JSON → "X perros importados")
 *  - Botón "Ver todas" → /notifications
 */
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  X, Loader2, Check, ArrowRight,
  Bell, Calendar, Stethoscope, Trophy, UserPlus, HandCoins, MessageSquare,
  FileText, PenSquare, CreditCard, CircleDollarSign, Dog, PartyPopper,
  Baby, KanbanSquare, Upload, Store, Info,
} from 'lucide-react'
import Link from 'next/link'
import { getNotificationMeta, timeAgo } from '@/lib/notifications/types'
import { useT } from '@/components/i18n/locale-provider'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

interface NotificationsPanelProps {
  open: boolean
  onClose: () => void
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Bell, Calendar, Stethoscope, Trophy, UserPlus, HandCoins, MessageSquare,
  FileText, PenSquare, CreditCard, CircleDollarSign, Dog, PartyPopper,
  Baby, KanbanSquare, Upload, Store, Info,
}

function renderMessage(n: Notification, t: (k: string) => string): string {
  if (n.type === 'import') {
    try {
      const p = JSON.parse(n.message)
      return `${p.createdIds?.length ?? p.count ?? 0} ${t('perros importados')}`
    } catch {
      return n.message
    }
  }
  if (n.type === 'import_draft') return t('Borrador pendiente de confirmar')
  return n.message
}

export default function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const t = useT()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Realtime: mantener panel actualizado aunque esté cerrado (para que el badge funcione)
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      channel = supabase
        .channel('notifs-panel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev])
          },
        )
        .subscribe()
    })
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  // ESC para cerrar + load on open
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    loadNotifications()
  }, [open])

  async function loadNotifications() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data || [])
    setLoading(false)
  }

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    // Avisar al badge del header para que refresque sin esperar realtime
    window.dispatchEvent(new Event('notifs:changed'))
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    window.dispatchEvent(new Event('notifs:changed'))
  }

  const unread = notifications.filter((n) => !n.is_read).length
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-canvas border-l border-hairline shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">{t('Notificaciones')}</h2>
            {unread > 0 && (
              <span className="bg-ink text-on-primary text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-hairline px-5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              filter === 'all'
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:text-body'
            }`}
          >
            {t('Todas')}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              filter === 'unread'
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:text-body'
            }`}
          >
            {t('No leídas')} {unread > 0 && <span className="text-muted">({unread})</span>}
          </button>
          <button
            onClick={markAllRead}
            disabled={unread === 0}
            className="ml-auto self-center text-xs text-muted hover:text-ink transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> {t('Marcar leídas')}
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted px-6 text-center">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-semibold text-ink">
                {filter === 'unread' ? t('¡Todo al día!') : t('Sin notificaciones')}
              </p>
              <p className="text-xs text-muted mt-1">
                {filter === 'unread'
                  ? t('No tienes nada pendiente.')
                  : t('Te avisaremos aquí en tiempo real.')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline-soft">
              {filtered.map((notif) => {
                const meta = getNotificationMeta(notif.type)
                const Icon = ICON_MAP[meta.icon] || Bell
                return (
                  <li
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.id)
                      if (notif.link) {
                        window.location.href = notif.link
                        onClose()
                      }
                    }}
                    className={`px-5 py-3.5 hover:bg-surface-soft transition cursor-pointer ${
                      !notif.is_read ? 'bg-surface-soft/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: meta.color }}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm truncate ${
                              notif.is_read ? 'text-body' : 'font-semibold text-ink'
                            }`}
                          >
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <div className="w-1.5 h-1.5 rounded-full bg-ink flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">
                          {renderMessage(notif, t)}
                        </p>
                        <p className="text-[11px] text-muted mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer: link a página completa */}
        <div className="px-5 py-3 border-t border-hairline flex-shrink-0">
          <Link
            href="/notifications"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink transition"
          >
            {t('Ver centro de notificaciones')}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </>
  )
}
