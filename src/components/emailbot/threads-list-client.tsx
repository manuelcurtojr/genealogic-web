'use client'

import { useState, useMemo } from 'react'
import { Search, Mail, ArrowLeft, AlertTriangle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import ThreadDetailPanel from './thread-detail-panel'
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

interface Props {
  kennelName: string
  initialThreads: Thread[]
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  active: { label: 'Activo', tone: 'bg-ink text-on-primary' },
  derived_to_human: { label: 'Derivado', tone: 'bg-surface-card text-ink border border-hairline' },
  closed: { label: 'Cerrado', tone: 'bg-surface-card text-muted' },
}

function relativeDate(iso: string, t: (k: string) => string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('ahora')
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function ThreadsListClient({ kennelName, initialThreads }: Props) {
  const t = useT()
  const [threads] = useState<Thread[]>(initialThreads)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'derived_to_human' | 'closed'>('all')
  const [selected, setSelected] = useState<Thread | null>(null)

  const stats = useMemo(() => ({
    total: threads.length,
    active: threads.filter(th => th.status === 'active').length,
    derived: threads.filter(th => th.status === 'derived_to_human').length,
    closed: threads.filter(th => th.status === 'closed').length,
  }), [threads])

  const filtered = useMemo(() => {
    let r = threads
    if (statusFilter !== 'all') r = r.filter(th => th.status === statusFilter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      r = r.filter(th =>
        th.contact_email.toLowerCase().includes(q) ||
        th.contact_name?.toLowerCase().includes(q) ||
        th.subject?.toLowerCase().includes(q)
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
            {t('Hilos')}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {kennelName} · {stats.total} {stats.total === 1 ? t('hilo') : t('hilos')} ·
            {' '}{stats.active} {stats.active === 1 ? t('activo') : t('activos')}
            {stats.derived > 0 && <> · <span className="text-ink font-medium">{stats.derived} {stats.derived === 1 ? t('derivado') : t('derivados')}</span></>}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {([
          { key: 'all', label: `${t('Todos')} (${stats.total})` },
          { key: 'active', label: `${t('Activos')} (${stats.active})` },
          { key: 'derived_to_human', label: `${t('Derivados')} (${stats.derived})` },
          { key: 'closed', label: `${t('Cerrados')} (${stats.closed})` },
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
            placeholder={t('Buscar email, nombre o asunto…')}
            className="w-full pl-9 pr-3 py-2 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-ink transition"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-hairline rounded-xl bg-canvas">
          <Mail className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">
            {threads.length === 0
              ? t('Aún no hay hilos. Cuando el Emailbot reciba un email, aparecerá aquí.')
              : t('Ningún hilo coincide con el filtro.')}
          </p>
        </div>
      ) : (
        <div className="border border-hairline rounded-xl bg-canvas overflow-hidden">
          {filtered.map((th, i) => {
            const status = STATUS_LABEL[th.status] || STATUS_LABEL.active
            return (
              <button
                key={th.id}
                onClick={() => setSelected(th)}
                className={`w-full text-left flex items-start gap-3 p-4 hover:bg-surface-soft transition ${i > 0 ? 'border-t border-hairline' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.06em] rounded-full px-2 py-0.5 ${status.tone}`}>
                      {t(status.label)}
                    </span>
                    {th.status === 'derived_to_human' && (
                      <AlertTriangle className="w-3 h-3 text-ink" />
                    )}
                    <span className="text-[11px] text-muted ml-auto">{relativeDate(th.last_message_at, t)}</span>
                  </div>
                  <p className="text-sm font-semibold text-ink truncate">
                    {th.contact_name || th.contact_email}
                  </p>
                  {th.contact_name && (
                    <p className="text-[11px] text-muted truncate">{th.contact_email}</p>
                  )}
                  {th.subject && (
                    <p className="text-[12px] text-body truncate mt-1">{th.subject}</p>
                  )}
                  <p className="text-[10px] text-muted mt-1.5">
                    {th.bot_replies_count} {th.bot_replies_count === 1 ? t('respuesta del bot') : t('respuestas del bot')}
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
