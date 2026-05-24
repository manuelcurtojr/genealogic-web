/**
 * Centro de notificaciones — vista completa.
 *
 * Mejoras vs versión anterior:
 *  - Filtro por categoría (Reservas, Mensajes, Pagos, Contratos, etc.)
 *  - Agrupación temporal (Hoy, Ayer, Esta semana, Más antiguas)
 *  - Iconos por tipo cubriendo todos los eventos del producto (Fase C)
 *  - Realtime: nuevas notificaciones aparecen sin refrescar
 *  - Borrado individual (soft) + "limpiar leídas" masivo
 *  - Mensaje JSON-encoded (imports) se renderiza humanizado
 */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Bell, Loader2, Check, Trash2,
  // Iconos para getIcon():
  Calendar, Stethoscope, Trophy, UserPlus, HandCoins, MessageSquare,
  FileText, PenSquare, CreditCard, CircleDollarSign, Dog, PartyPopper,
  Baby, KanbanSquare, Upload, Store, Info,
} from 'lucide-react'
import {
  getNotificationMeta,
  getTimeBucket,
  BUCKET_LABELS,
  CATEGORY_LABELS,
  timeAgo,
  type NotificationCategory,
} from '@/lib/notifications/types'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Bell, Calendar, Stethoscope, Trophy, UserPlus, HandCoins, MessageSquare,
  FileText, PenSquare, CreditCard, CircleDollarSign, Dog, PartyPopper,
  Baby, KanbanSquare, Upload, Store, Info,
}

/** Humaniza el message si viene en JSON (imports). */
function renderMessage(n: Notification): string {
  if (n.type === 'import') {
    try {
      const p = JSON.parse(n.message)
      const count = p.createdIds?.length ?? p.count ?? 0
      return `${count} perros importados`
    } catch {
      return n.message
    }
  }
  if (n.type === 'import_draft') {
    return n.message?.includes('{')
      ? 'Borrador de importación pendiente'
      : n.message
  }
  return n.message
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all')

  useEffect(() => {
    loadNotifications()
    const supabase = createClient()
    // Realtime: escuchar inserts en notifications del user actual
    let channel: ReturnType<typeof supabase.channel> | null = null
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      channel = supabase
        .channel('notifs-page')
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

  async function loadNotifications() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setNotifications(data || [])
    setLoading(false)
  }

  function notifyBadge() {
    // Avisa al badge de la campana para que refresque sin esperar realtime
    window.dispatchEvent(new Event('notifs:changed'))
  }

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    notifyBadge()
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    notifyBadge()
  }

  async function deleteNotif(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('id', id)
    notifyBadge()
  }

  async function clearAllRead() {
    const readIds = notifications.filter((n) => n.is_read).map((n) => n.id)
    if (readIds.length === 0) return
    if (!confirm(`¿Borrar ${readIds.length} notificaciones leídas? No se puede deshacer.`)) return
    setNotifications((prev) => prev.filter((n) => !n.is_read))
    const supabase = createClient()
    await supabase.from('notifications').delete().in('id', readIds)
    notifyBadge()
  }

  const unread = notifications.filter((n) => !n.is_read).length

  // Categorías presentes en las notifs cargadas (para el filtro)
  const presentCategories = useMemo(() => {
    const set = new Set<NotificationCategory>()
    for (const n of notifications) set.add(getNotificationMeta(n.type).category)
    return Array.from(set)
  }, [notifications])

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread' && n.is_read) return false
      if (categoryFilter !== 'all' && getNotificationMeta(n.type).category !== categoryFilter) return false
      return true
    })
  }, [notifications, filter, categoryFilter])

  // Agrupar por bucket temporal manteniendo orden
  const grouped = useMemo(() => {
    const buckets: { key: 'today' | 'yesterday' | 'week' | 'older'; items: Notification[] }[] = [
      { key: 'today', items: [] },
      { key: 'yesterday', items: [] },
      { key: 'week', items: [] },
      { key: 'older', items: [] },
    ]
    for (const n of filtered) {
      const b = getTimeBucket(n.created_at)
      buckets.find((bb) => bb.key === b)!.items.push(n)
    }
    return buckets.filter((b) => b.items.length > 0)
  }, [filtered])

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            Centro
          </p>
          <h1 className="mt-1.5 flex items-center gap-3 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
            Notificaciones
            {unread > 0 && (
              <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-ink px-2 text-[12px] font-medium text-on-primary">
                {unread}
              </span>
            )}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllRead}
            disabled={unread === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" /> Marcar leídas
          </button>
          <button
            onClick={clearAllRead}
            disabled={notifications.every((n) => !n.is_read)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
            title="Borrar notificaciones leídas"
          >
            <Trash2 className="h-3.5 w-3.5" /> Limpiar
          </button>
        </div>
      </div>

      {/* Tab leídas/no leídas */}
      <div className="inline-flex gap-1 rounded-lg bg-surface-card p-1">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
            filter === 'all'
              ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
              : 'text-muted hover:text-ink'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
              : 'text-muted hover:text-ink'
          }`}
        >
          No leídas {unread > 0 && <span className="ml-1 text-muted">({unread})</span>}
        </button>
      </div>

      {/* Chips de categoría */}
      {presentCategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <CategoryChip
            label="Todas"
            active={categoryFilter === 'all'}
            onClick={() => setCategoryFilter('all')}
          />
          {presentCategories.map((cat) => (
            <CategoryChip
              key={cat}
              label={CATEGORY_LABELS[cat]}
              active={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
            />
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} hasAny={notifications.length > 0} />
      ) : (
        <div className="space-y-6">
          {grouped.map((bucket) => (
            <section key={bucket.key}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-2 px-1">
                {BUCKET_LABELS[bucket.key]}
              </h2>
              <ul className="overflow-hidden rounded-xl border border-hairline bg-canvas divide-y divide-hairline-soft">
                {bucket.items.map((n) => (
                  <NotifRow
                    key={n.id}
                    notif={n}
                    onRead={() => markAsRead(n.id)}
                    onDelete={() => deleteNotif(n.id)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[12px] font-medium transition ${
        active
          ? 'border-ink bg-ink text-on-primary'
          : 'border-hairline bg-canvas text-body hover:border-ink/30 hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}

function NotifRow({
  notif,
  onRead,
  onDelete,
}: {
  notif: Notification
  onRead: () => void
  onDelete: () => void
}) {
  const meta = getNotificationMeta(notif.type)
  const Icon = ICON_MAP[meta.icon] || Bell

  function handleClick() {
    if (!notif.is_read) onRead()
    if (notif.link) window.location.href = notif.link
  }

  return (
    <li
      onClick={handleClick}
      className={`group flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-soft ${
        !notif.is_read ? 'bg-surface-soft/40' : ''
      }`}
    >
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: meta.color }}
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
        <p className="mt-0.5 text-[13px] text-muted line-clamp-2">{renderMessage(notif)}</p>
        <p className="mt-1 text-[11.5px] text-muted">{timeAgo(notif.created_at)}</p>
      </div>
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notif.is_read && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRead()
            }}
            title="Marcar como leída"
            className="p-1.5 rounded text-muted hover:text-ink hover:bg-canvas"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          title="Borrar"
          className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-canvas"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  )
}

function EmptyState({ filter, hasAny }: { filter: 'all' | 'unread'; hasAny: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
      <Bell className="mx-auto h-10 w-10 text-muted" />
      <p className="mt-3 text-[14px] font-semibold text-ink">
        {filter === 'unread'
          ? hasAny
            ? '¡Todo al día!'
            : 'Sin notificaciones'
          : 'Sin notificaciones'}
      </p>
      <p className="mt-1 text-[13px] text-muted max-w-md mx-auto">
        {filter === 'unread'
          ? 'No tienes notificaciones sin leer. Te avisaremos aquí cuando haya nuevas solicitudes, mensajes o pagos.'
          : 'Cuando alguien envíe una reserva, mensaje, firme un contrato o pague algo, lo verás aquí en tiempo real.'}
      </p>
    </div>
  )
}
