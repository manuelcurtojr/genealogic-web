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

function getNotifIcon(type: string) {
  switch (type) {
    case 'vet': return Stethoscope
    case 'calendar': return Calendar
    case 'award': return Trophy
    case 'contact': return UserPlus
    case 'deal': return HandCoins
    default: return Bell
  }
}

function getNotifColor(type: string) {
  switch (type) {
    case 'vet': return 'bg-blue-500/15 text-blue-400'
    case 'calendar': return 'bg-purple-500/15 text-purple-400'
    case 'contact': return 'bg-green-500/15 text-green-400'
    case 'deal': return 'bg-orange-500/15 text-orange-400'
    case 'award': return 'bg-yellow-500/15 text-yellow-400'
    default: return 'bg-white/10 text-white/40'
  }
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
  if (days < 7) return `Hace ${days} dias`
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Notificaciones</h1>
          {unread > 0 && (
            <span className="bg-[#D74709] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unread}</span>
          )}
        </div>
        <button
          onClick={markAllRead}
          disabled={unread === 0}
          className="text-xs text-[#D74709] hover:text-[#c03d07] transition font-medium disabled:opacity-30 flex items-center gap-1"
        >
          <Check className="w-3 h-3" /> Marcar leidas
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${filter === 'all' ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40'}`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${filter === 'unread' ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40'}`}
        >
          No leidas ({unread})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-white/20" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <Bell className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">{filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(notif => {
            const Icon = getNotifIcon(notif.type)
            const iconClass = getNotifColor(notif.type)
            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) markAsRead(notif.id)
                  if (notif.link) window.location.href = notif.link
                }}
                className={`flex items-start gap-3 p-3 rounded-xl transition cursor-pointer border ${!notif.is_read ? 'bg-white/[0.04] border-white/10' : 'bg-transparent border-transparent'} hover:bg-white/[0.06]`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${notif.is_read ? 'text-white/60' : 'text-white'}`}>{notif.title}</p>
                    {!notif.is_read && <div className="w-2 h-2 rounded-full bg-[#D74709] flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{notif.message}</p>
                  <p className="text-[11px] text-white/25 mt-1">{timeAgo(notif.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
