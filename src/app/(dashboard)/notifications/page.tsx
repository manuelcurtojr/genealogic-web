'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Calendar, Stethoscope, Trophy, UserPlus, HandCoins, Loader2, Check } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

const NOTIF_CONFIG: Record<string, { icon: any; color: string }> = {
  vet: { icon: Stethoscope, color: '#3b82f6' },
  calendar: { icon: Calendar, color: '#8b5cf6' },
  contact: { icon: UserPlus, color: '#34d399' },
  deal: { icon: HandCoins, color: '#f59e0b' },
  award: { icon: Trophy, color: '#f59e0b' },
}

function getNotifConfig(type: string) {
  return NOTIF_CONFIG[type] || { icon: Bell, color: '#6b7280' }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => { loadNotifications() }, [])

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
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    const supabase = createClient()
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unread = notifications.filter(n => !n.is_read).length
  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Centro</p>
          <h1 className="mt-1.5 flex items-center gap-3 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
            Notificaciones
            {unread > 0 && (
              <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-ink px-2 text-[12px] font-medium text-on-primary">
                {unread}
              </span>
            )}
          </h1>
        </div>
        <button
          onClick={markAllRead}
          disabled={unread === 0}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink disabled:opacity-40"
        >
          <Check className="h-3.5 w-3.5" /> Marcar leídas
        </button>
      </div>

      {/* Tabs */}
      <div className="inline-flex gap-1 rounded-lg bg-surface-card p-1">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
            filter === 'all' ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'text-muted hover:text-ink'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
            filter === 'unread' ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'text-muted hover:text-ink'
          }`}
        >
          No leídas {unread > 0 && <span className="ml-1 text-muted">({unread})</span>}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <Bell className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">
            {filter === 'unread' ? 'No tienes notificaciones sin leer.' : 'No tienes notificaciones.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
          <ul className="divide-y divide-hairline-soft">
            {filtered.map(notif => {
              const { icon: Icon, color } = getNotifConfig(notif.type)
              return (
                <li
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) markAsRead(notif.id)
                    if (notif.link) window.location.href = notif.link
                  }}
                  className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-soft ${
                    !notif.is_read ? 'bg-surface-soft/40' : ''
                  }`}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-[14px] ${notif.is_read ? 'text-body' : 'font-semibold text-ink'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ink" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted">{notif.message}</p>
                    <p className="mt-1 text-[11.5px] text-muted">{timeAgo(notif.created_at)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
