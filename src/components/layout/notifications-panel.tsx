'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Bell, Calendar, Stethoscope, Trophy, UserPlus, HandCoins, Loader2, Check, Link2 } from 'lucide-react'

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

function getNotifIcon(type: string) {
  switch (type) {
    case 'vet': return Stethoscope
    case 'calendar': return Calendar
    case 'award': return Trophy
    case 'contact': return UserPlus
    case 'deal': return HandCoins
    case 'import': return Link2
    case 'import_draft': return Link2
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
    case 'import': return 'bg-[#D74709]/15 text-[#D74709]'
    case 'import_draft': return 'bg-yellow-500/15 text-yellow-400'
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

export default function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
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
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Notificaciones</h2>
            {unread > 0 && (
              <span className="bg-[#D74709] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unread}</span>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${filter === 'all' ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40 hover:text-white/60'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${filter === 'unread' ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40 hover:text-white/60'}`}
          >
            No leidas ({unread})
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-white/20" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">{filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
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
                    className={`px-6 py-4 hover:bg-white/[0.03] transition cursor-pointer ${!notif.is_read ? 'bg-white/[0.02]' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${notif.is_read ? 'text-white/60' : 'text-white'}`}>{notif.title}</p>
                          {!notif.is_read && <div className="w-2 h-2 rounded-full bg-[#D74709] flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{notif.type === 'import' ? (() => { try { const p = JSON.parse(notif.message); return `${p.createdIds?.length || 0} perros importados` } catch { return '' } })() : notif.type === 'import_draft' ? 'Borrador pendiente de confirmar' : notif.message}</p>
                        <p className="text-[11px] text-white/25 mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={markAllRead}
            disabled={unread === 0}
            className="text-xs text-[#D74709] hover:text-[#c03d07] transition font-medium disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> Marcar todas como leidas
          </button>
        </div>
      </div>
    </>
  )
}
