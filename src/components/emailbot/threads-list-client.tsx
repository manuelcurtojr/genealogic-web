'use client'

import { useState, useMemo } from 'react'
import { Search, Mail, ArrowLeft, AlertTriangle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import ThreadDetailPanel from './thread-detail-panel'

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

interface Props {
  kennelName: string
  initialThreads: Thread[]
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  active: { label: 'Activo', tone: 'bg-ink text-on-primary' },
  derived_to_human: { label: 'Derivado', tone: 'bg-surface-card text-ink border border-hairline' },
  closed: { label: 'Cerrado', tone: 'bg-surface-card text-muted' },
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function ThreadsListClient({ kennelName, initialThreads }: Props) {
  const [threads] = useState<Thread[]>(initialThreads)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'derived_to_human' | 'closed'>('all')
  const [selected, setSelected] = useState<Thread | null>(null)

  const stats = useMemo(() => ({
    total: threads.length,
    active: threads.filter(t => t.status === 'active').length,
    derived: threads.filter(t => t.status === 'derived_to_human').length,
    closed: threads.filter(t => t.status === 'closed').length,
  }), [threads])

  const filtered = useMemo(() => {
    let r = threads
    if (statusFilter !== 'all') r = r.filter(t => t.status === statusFilter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      r = r.filter(t =>
        t.contact_email.toLowerCase().includes(q) ||
        t.contact_name?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q)
      )
    }
    return r
  }, [threads, statusFilter, query])

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/emailbot" className="text-xs font-medium text-muted hover:text-ink inline-flex items-center gap-1 transition">
              <ArrowLeft className="w-3 h-3" /> Emailbot
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-muted" />
            Hilos
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {kennelName} · {stats.total} hilo{stats.total === 1 ? '' : 's'} ·
            {' '}{stats.active} activo{stats.active === 1 ? '' : 's'}
            {stats.derived > 0 && <> · <span className="text-ink font-medium">{stats.derived} derivado{stats.derived === 1 ? '' : 's'}</span></>}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {([
          { key: 'all', label: `Todos (${stats.total})` },
          { key: 'active', label: `Activos (${stats.active})` },
          { key: 'derived_to_human', label: `Derivados (${stats.derived})` },
          { key: 'closed', label: `Cerrados (${stats.closed})` },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
              statusFilter === f.key
                ? 'bg-ink text-on-primary'
                : 'border border-hairline text-body hover:text-ink hover:bg-surface-soft'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="relative flex-1 max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar email, nombre o asunto…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-ink transition"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-hairline rounded-xl bg-canvas">
          <Mail className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">
            {threads.length === 0
              ? 'Aún no hay hilos. Cuando el Emailbot reciba un email, aparecerá aquí.'
              : 'Ningún hilo coincide con el filtro.'}
          </p>
        </div>
      ) : (
        <div className="border border-hairline rounded-xl bg-canvas overflow-hidden">
          {filtered.map((t, i) => {
            const status = STATUS_LABEL[t.status] || STATUS_LABEL.active
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`w-full text-left flex items-start gap-3 p-4 hover:bg-surface-soft transition ${i > 0 ? 'border-t border-hairline' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.06em] rounded-full px-2 py-0.5 ${status.tone}`}>
                      {status.label}
                    </span>
                    {t.status === 'derived_to_human' && (
                      <AlertTriangle className="w-3 h-3 text-ink" />
                    )}
                    <span className="text-[11px] text-muted ml-auto">{relativeDate(t.last_message_at)}</span>
                  </div>
                  <p className="text-sm font-semibold text-ink truncate">
                    {t.contact_name || t.contact_email}
                  </p>
                  {t.contact_name && (
                    <p className="text-[11px] text-muted truncate">{t.contact_email}</p>
                  )}
                  {t.subject && (
                    <p className="text-[12px] text-body truncate mt-1">{t.subject}</p>
                  )}
                  <p className="text-[10px] text-muted mt-1.5">
                    {t.bot_replies_count} respuesta{t.bot_replies_count === 1 ? '' : 's'} del bot
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <ThreadDetailPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        thread={selected}
      />
    </div>
  )
}
