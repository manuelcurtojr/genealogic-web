'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n/locale-provider'
import OwnerFormPanel from './owner-form-panel'

interface Owner {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  created_at: string
  updated_at: string
}

interface Props {
  kennelId: string
  kennelName: string
  initialOwners: Owner[]
  reservationsByOwner: Record<string, { total: number; active: number }>
}

export default function ClientesPageClient({
  kennelId, kennelName, initialOwners, reservationsByOwner,
}: Props) {
  const t = useT()
  const [owners, setOwners] = useState<Owner[]>(initialOwners)
  const [query, setQuery] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Owner | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return owners
    const q = query.trim().toLowerCase()
    return owners.filter(o =>
      o.full_name.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.phone?.includes(q) ||
      o.city?.toLowerCase().includes(q)
    )
  }, [owners, query])

  function handleNew() {
    setEditing(null)
    setPanelOpen(true)
  }
  function handleEdit(o: Owner) {
    setEditing(o)
    setPanelOpen(true)
  }
  function handleSaved(updated: Owner) {
    setOwners(os => {
      const idx = os.findIndex(o => o.id === updated.id)
      if (idx >= 0) {
        const copy = [...os]
        copy[idx] = updated
        return copy
      }
      return [updated, ...os].sort((a, b) => a.full_name.localeCompare(b.full_name))
    })
    setPanelOpen(false)
    setEditing(null)
  }
  function handleDeleted(id: string) {
    setOwners(os => os.filter(o => o.id !== id))
    setPanelOpen(false)
    setEditing(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{t('Clientes')}</h1>
          <p className="text-sm text-muted mt-0.5">{kennelName} · {owners.length} {owners.length === 1 ? t('cliente') : t('clientes')}</p>
        </div>
        <Button onClick={handleNew} size="md" variant="primary">
          <Plus className="w-4 h-4" />
          {t('Nuevo cliente')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('Buscar por nombre, email, teléfono…')}
          className="w-full pl-9 pr-3 py-2 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-ink transition"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-hairline rounded-xl bg-canvas">
          <p className="text-sm text-muted">
            {owners.length === 0
              ? t('Aún no tienes clientes. Crea el primero para empezar a gestionar reservas.')
              : t('Ningún cliente coincide con la búsqueda.')}
          </p>
        </div>
      ) : (
        <div className="border border-hairline rounded-xl bg-canvas overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-hairline">
              <tr className="text-left">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{t('Cliente')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted hidden md:table-cell">{t('Contacto')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted hidden lg:table-cell">{t('Ubicación')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted text-right">{t('Reservas')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, idx) => {
                const r = reservationsByOwner[o.id] || { total: 0, active: 0 }
                return (
                  <tr
                    key={o.id}
                    onClick={() => handleEdit(o)}
                    className={`cursor-pointer hover:bg-surface-soft transition ${idx > 0 ? 'border-t border-hairline' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{o.full_name}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {o.email && (
                          <span className="text-[12px] text-body inline-flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-muted" />
                            {o.email}
                          </span>
                        )}
                        {o.phone && (
                          <span className="text-[12px] text-body inline-flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-muted" />
                            {o.phone}
                          </span>
                        )}
                        {!o.email && !o.phone && <span className="text-[12px] text-muted">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {(o.city || o.country) ? (
                        <span className="text-[12px] text-body inline-flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-muted" />
                          {[o.city, o.country].filter(Boolean).join(', ')}
                        </span>
                      ) : <span className="text-[12px] text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {r.active > 0 && (
                          <span className="text-[11px] font-semibold bg-ink text-on-primary rounded-full px-2 py-0.5">
                            {r.active} {r.active === 1 ? t('activa') : t('activas')}
                          </span>
                        )}
                        <span className="text-[11px] text-muted">{r.total} {t('total')}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <OwnerFormPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditing(null) }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        editing={editing}
        kennelId={kennelId}
      />
    </div>
  )
}
