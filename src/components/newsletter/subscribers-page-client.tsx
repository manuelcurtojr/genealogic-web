'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Mail, Upload, UserMinus, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SubscriberFormPanel from './subscriber-form-panel'
import { useT } from '@/components/i18n/locale-provider'

interface Subscriber {
  id: string
  email: string
  full_name: string | null
  source: string
  tags: string[] | null
  is_active: boolean
  subscribed_at: string
  unsubscribed_at: string | null
}

interface Props {
  kennelId: string
  kennelName: string
  initialSubscribers: Subscriber[]
}

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manual', import: 'Importado', web_form: 'Formulario web',
  reservation: 'Reserva', contract: 'Contrato',
}

export default function SubscribersPageClient({ kennelId, kennelName, initialSubscribers }: Props) {
  const t = useT()
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Subscriber | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)

  const stats = useMemo(() => ({
    total: subscribers.length,
    active: subscribers.filter(s => s.is_active).length,
    inactive: subscribers.filter(s => !s.is_active).length,
  }), [subscribers])

  const filtered = useMemo(() => {
    let result = subscribers
    if (statusFilter === 'active') result = result.filter(s => s.is_active)
    if (statusFilter === 'inactive') result = result.filter(s => !s.is_active)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(s =>
        s.email.toLowerCase().includes(q) ||
        s.full_name?.toLowerCase().includes(q)
      )
    }
    return result
  }, [subscribers, statusFilter, query])

  function handleSaved(updated: Subscriber) {
    setSubscribers(arr => {
      const idx = arr.findIndex(s => s.id === updated.id)
      if (idx >= 0) {
        const copy = [...arr]
        copy[idx] = updated
        return copy
      }
      return [updated, ...arr]
    })
    setPanelOpen(false)
    setEditing(null)
  }
  function handleDeleted(id: string) {
    setSubscribers(arr => arr.filter(s => s.id !== id))
    setPanelOpen(false)
    setEditing(null)
  }

  async function handleImport() {
    const emails = importText
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    if (emails.length === 0) {
      alert(t('No se detectaron emails válidos'))
      return
    }
    const emailWord = emails.length === 1 ? t('email') : t('emails')
    if (!confirm(`${t('¿Importar')} ${emails.length} ${emailWord} ${t('a la lista?')}`)) return
    setImporting(true)
    try {
      const res = await fetch('/api/newsletter/subscribers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId, emails }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('Error en import'))
      // refrescar lista
      setSubscribers(prev => {
        const existingEmails = new Set(prev.map(s => s.email))
        const newOnes = (data.created || []).filter((s: Subscriber) => !existingEmails.has(s.email))
        return [...newOnes, ...prev]
      })
      alert(`✓ ${t('Importados:')} ${data.created?.length || 0}\n${t('Duplicados ignorados:')} ${data.skipped || 0}`)
      setImportText('')
      setImportOpen(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Newsletter</h1>
          <p className="text-sm text-muted mt-0.5">
            {kennelName} · {stats.total} {stats.total === 1 ? t('suscriptor') : t('suscriptores')} · {stats.active} {stats.active === 1 ? t('activo') : t('activos')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setImportOpen(true)} variant="secondary" size="md">
            <Upload className="w-4 h-4" />
            {t('Importar')}
          </Button>
          <Button onClick={() => { setEditing(null); setPanelOpen(true) }} variant="primary" size="md">
            <Plus className="w-4 h-4" />
            {t('Nuevo')}
          </Button>
        </div>
      </div>

      {/* Info bar */}
      <div className="rounded-xl border border-hairline bg-surface-card p-4 mb-6 flex items-start gap-3">
        <Mail className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />
        <div className="text-sm text-body leading-relaxed">
          {t('Aquí gestionas tu lista de suscriptores. El envío de campañas (newsletter, avisos de camada) llega en la próxima fase con plantillas y métricas de apertura. Por ahora puedes construir y limpiar tu lista — importar emails desde otras herramientas o añadir manualmente.')}
        </div>
      </div>

      {/* Filter + search */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {([
          { key: 'active', label: `${t('Activos')} (${stats.active})` },
          { key: 'inactive', label: `${t('Bajas')} (${stats.inactive})` },
          { key: 'all', label: `${t('Todos')} (${stats.total})` },
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
            placeholder={t('Buscar por email o nombre…')}
            className="w-full pl-9 pr-3 py-2 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-ink transition"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-hairline rounded-xl bg-canvas">
          <p className="text-sm text-muted">
            {subscribers.length === 0
              ? t('Sin suscriptores aún. Añade el primero o importa desde otra herramienta.')
              : t('Ningún suscriptor coincide con el filtro.')}
          </p>
        </div>
      ) : (
        <div className="border border-hairline rounded-xl bg-canvas overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-hairline">
              <tr className="text-left">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Email</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted hidden md:table-cell">{t('Nombre')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted hidden lg:table-cell">{t('Origen')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted text-right">{t('Estado')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr
                  key={s.id}
                  onClick={() => { setEditing(s); setPanelOpen(true) }}
                  className={`cursor-pointer hover:bg-surface-soft transition ${idx > 0 ? 'border-t border-hairline' : ''} ${!s.is_active ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-ink">{s.email}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-body">{s.full_name || <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-[11px] bg-surface-card rounded-full px-2 py-0.5">
                      {SOURCE_LABEL[s.source] ? t(SOURCE_LABEL[s.source]) : s.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                        <UserCheck className="w-3 h-3" /> {t('Activo')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                        <UserMinus className="w-3 h-3" /> {t('Baja')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SubscriberFormPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditing(null) }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        editing={editing}
        kennelId={kennelId}
      />

      {/* Import dialog (simple inline modal) */}
      {importOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4"
          onClick={() => !importing && setImportOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-hairline shadow-xl w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink mb-1">{t('Importar suscriptores')}</h2>
            <p className="text-sm text-muted mb-4">
              {t('Pega emails separados por línea, coma o punto y coma. Los duplicados se ignoran automáticamente.')}
            </p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="maria@ejemplo.com&#10;juan@otro.com, ana@dominio.es"
              className="w-full min-h-[180px] px-3 py-2 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-ink"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setImportOpen(false)} disabled={importing}>{t('Cancelar')}</Button>
              <Button variant="primary" size="sm" onClick={handleImport} disabled={importing || !importText.trim()}>
                {importing ? t('Importando…') : t('Importar')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
