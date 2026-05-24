/**
 * Catálogo unificado de tipos de notificación con icon, color, categoría.
 * Importable desde client y server.
 *
 * Si llega un type desconocido, se usa el fallback (Bell + gray + 'Otros').
 */

export type NotificationCategory =
  | 'reservas'
  | 'mensajes'
  | 'pagos'
  | 'contratos'
  | 'genealogia'
  | 'sistema'
  | 'otros'

export type NotificationTypeMeta = {
  /** Nombre del icono lucide-react (resolved en el componente) */
  icon: string
  /** Color HEX para badge del icono */
  color: string
  /** Categoría para agrupar/filtrar */
  category: NotificationCategory
  /** Label genérico si no hay título específico */
  fallbackTitle?: string
}

export const NOTIFICATION_TYPES: Record<string, NotificationTypeMeta> = {
  // ── Reservas ─────────────────────────────────────────────────────────
  reservation_new:    { icon: 'KanbanSquare',  color: '#0ea5e9', category: 'reservas' },
  reservation_status: { icon: 'KanbanSquare',  color: '#6366f1', category: 'reservas' },
  reservation_dog:    { icon: 'Dog',           color: '#10b981', category: 'reservas' },
  dog_received:       { icon: 'PartyPopper',   color: '#10b981', category: 'reservas' },

  // ── Mensajes ─────────────────────────────────────────────────────────
  message_new:        { icon: 'MessageSquare', color: '#8b5cf6', category: 'mensajes' },

  // ── Contratos ────────────────────────────────────────────────────────
  contract_sent:      { icon: 'FileText',      color: '#0ea5e9', category: 'contratos' },
  contract_signed:    { icon: 'PenSquare',     color: '#10b981', category: 'contratos' },

  // ── Pagos ────────────────────────────────────────────────────────────
  payment_new:        { icon: 'CreditCard',    color: '#f59e0b', category: 'pagos' },
  payment_paid:       { icon: 'CircleDollarSign', color: '#10b981', category: 'pagos' },
  deal:               { icon: 'HandCoins',     color: '#f59e0b', category: 'pagos' },

  // ── Documentos del perro ─────────────────────────────────────────────
  document_new:       { icon: 'FileText',      color: '#6366f1', category: 'genealogia' },

  // ── Genealogía / cría ────────────────────────────────────────────────
  litter_new:         { icon: 'Baby',          color: '#ec4899', category: 'genealogia' },
  vet:                { icon: 'Stethoscope',   color: '#3b82f6', category: 'genealogia' },
  calendar:           { icon: 'Calendar',      color: '#8b5cf6', category: 'genealogia' },
  award:              { icon: 'Trophy',        color: '#f59e0b', category: 'genealogia' },

  // ── CRM legacy ───────────────────────────────────────────────────────
  contact:            { icon: 'UserPlus',      color: '#34d399', category: 'reservas' },

  // ── Sistema / imports ────────────────────────────────────────────────
  import:             { icon: 'Upload',        color: '#6b7280', category: 'sistema' },
  import_draft:       { icon: 'Upload',        color: '#f59e0b', category: 'sistema' },
  kennel:             { icon: 'Store',         color: '#6366f1', category: 'sistema' },
  info:               { icon: 'Info',          color: '#6b7280', category: 'sistema' },
}

export function getNotificationMeta(type: string): NotificationTypeMeta {
  return NOTIFICATION_TYPES[type] || {
    icon: 'Bell',
    color: '#6b7280',
    category: 'otros',
  }
}

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  reservas:   'Reservas',
  mensajes:   'Mensajes',
  pagos:      'Pagos',
  contratos:  'Contratos',
  genealogia: 'Genealogía',
  sistema:    'Sistema',
  otros:      'Otros',
}

/**
 * Agrupa por bloque temporal (Hoy, Ayer, Esta semana, Más antiguas).
 */
export function getTimeBucket(dateStr: string): 'today' | 'yesterday' | 'week' | 'older' {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  ) return 'today'
  const yest = new Date(now); yest.setDate(yest.getDate() - 1)
  if (
    d.getFullYear() === yest.getFullYear() &&
    d.getMonth() === yest.getMonth() &&
    d.getDate() === yest.getDate()
  ) return 'yesterday'
  if (diffDays < 7) return 'week'
  return 'older'
}

export const BUCKET_LABELS: Record<'today' | 'yesterday' | 'week' | 'older', string> = {
  today:     'Hoy',
  yesterday: 'Ayer',
  week:      'Esta semana',
  older:     'Más antiguas',
}

export function timeAgo(dateStr: string): string {
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
