'use client'

import { useState, useMemo } from 'react'
import { Plus, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReservationFormPanel from './reservation-form-panel'

interface Reservation {
  id: string
  status: string
  owner_id: string | null
  litter_id: string | null
  dog_id: string | null
  preference_sex: string | null
  preference_color: string | null
  preference_notes: string | null
  deposit_amount_cents: number | null
  total_price_cents: number | null
  currency: string
  position_in_queue: number | null
  created_at: string
  updated_at: string
}

interface Owner {
  id: string
  full_name: string
  email: string | null
  phone: string | null
}

interface Litter {
  id: string
  expected_date: string | null
  father_id: string | null
  mother_id: string | null
}

interface Dog {
  id: string
  name: string
  sex: string
}

interface Props {
  kennelId: string
  kennelName: string
  initialReservations: Reservation[]
  owners: Owner[]
  litters: Litter[]
  dogs: Dog[]
}

const COLUMNS = [
  { key: 'interested', label: 'Interesado', tone: 'bg-surface-card' },
  { key: 'waitlisted', label: 'Lista de espera', tone: 'bg-surface-card' },
  { key: 'deposit_paid', label: 'Depósito pagado', tone: 'bg-surface-card' },
  { key: 'assigned', label: 'Cachorro asignado', tone: 'bg-surface-card' },
  { key: 'contract_signed', label: 'Contrato firmado', tone: 'bg-surface-card' },
  { key: 'paid_in_full', label: 'Pago total', tone: 'bg-surface-card' },
  { key: 'delivered', label: 'Entregado', tone: 'bg-surface-card' },
]

function fmtPrice(cents: number | null, currency: string) {
  if (cents == null) return null
  return `${(cents / 100).toFixed(0)} ${currency}`
}

function daysSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'hoy'
  if (days === 1) return 'hace 1 día'
  if (days < 30) return `hace ${days} días`
  const months = Math.floor(days / 30)
  return `hace ${months} mes${months > 1 ? 'es' : ''}`
}

export default function ReservationsBoard({
  kennelId,
  kennelName,
  initialReservations,
  owners,
  litters,
  dogs,
}: Props) {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Reservation | null>(null)

  const ownerById = useMemo(() => {
    const m = new Map<string, Owner>()
    owners.forEach(o => m.set(o.id, o))
    return m
  }, [owners])

  const dogById = useMemo(() => {
    const m = new Map<string, Dog>()
    dogs.forEach(d => m.set(d.id, d))
    return m
  }, [dogs])

  const reservationsByStatus = useMemo(() => {
    const map: Record<string, Reservation[]> = {}
    for (const col of COLUMNS) map[col.key] = []
    for (const r of reservations) {
      if (map[r.status]) map[r.status].push(r)
    }
    return map
  }, [reservations])

  async function moveTo(id: string, newStatus: string) {
    const prev = reservations
    setReservations(rs => rs.map(r => r.id === id ? { ...r, status: newStatus, updated_at: new Date().toISOString() } : r))
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      setReservations(prev)
      const err = await res.json().catch(() => ({}))
      alert(`Error al mover: ${err.error || 'desconocido'}`)
    }
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleDragOver(e: React.DragEvent, col: string) {
    e.preventDefault()
    setDragOverCol(col)
  }
  function handleDrop(e: React.DragEvent, col: string) {
    e.preventDefault()
    setDragOverCol(null)
    if (draggingId) {
      const cur = reservations.find(r => r.id === draggingId)
      if (cur && cur.status !== col) moveTo(draggingId, col)
    }
    setDraggingId(null)
  }

  function handleCardClick(r: Reservation) {
    setEditing(r)
    setPanelOpen(true)
  }

  function handleNew() {
    setEditing(null)
    setPanelOpen(true)
  }

  function handleSaved(updated: Reservation) {
    setReservations(rs => {
      const idx = rs.findIndex(r => r.id === updated.id)
      if (idx >= 0) {
        const copy = [...rs]
        copy[idx] = updated
        return copy
      }
      return [updated, ...rs]
    })
    setPanelOpen(false)
    setEditing(null)
  }

  function handleDeleted(id: string) {
    setReservations(rs => rs.filter(r => r.id !== id))
    setPanelOpen(false)
    setEditing(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Reservas</h1>
          <p className="text-sm text-muted mt-0.5">{kennelName} · {reservations.length} reserva{reservations.length === 1 ? '' : 's'}</p>
        </div>
        <Button onClick={handleNew} size="md" variant="primary">
          <Plus className="w-4 h-4" />
          Nueva reserva
        </Button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
        {COLUMNS.map(col => {
          const items = reservationsByStatus[col.key] || []
          const isOver = dragOverCol === col.key
          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`flex-shrink-0 w-72 rounded-xl border bg-canvas ${isOver ? 'border-ink' : 'border-hairline'} transition`}
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-hairline">
                <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink">{col.label}</h3>
                <span className="text-[11px] text-muted bg-surface-card rounded-full px-2 py-0.5">{items.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {items.length === 0 && (
                  <p className="text-xs text-muted text-center py-8 px-3">Arrastra aquí o crea una reserva</p>
                )}
                {items.map(r => {
                  const owner = r.owner_id ? ownerById.get(r.owner_id) : null
                  const dog = r.dog_id ? dogById.get(r.dog_id) : null
                  return (
                    <button
                      key={r.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, r.id)}
                      onClick={() => handleCardClick(r)}
                      className={`w-full text-left rounded-lg border border-hairline bg-canvas p-3 hover:border-ink/30 hover:shadow-sm transition cursor-grab active:cursor-grabbing ${draggingId === r.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-muted mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">
                            {owner?.full_name || 'Sin cliente'}
                          </p>
                          {dog ? (
                            <p className="text-[12px] text-body mt-0.5 truncate">{dog.name}</p>
                          ) : (
                            <p className="text-[12px] text-muted mt-0.5">
                              {r.preference_sex === 'male' ? 'Macho' : r.preference_sex === 'female' ? 'Hembra' : 'Indistinto'}
                              {r.preference_color ? ` · ${r.preference_color}` : ''}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-muted">
                            <span>{daysSince(r.created_at)}</span>
                            {r.total_price_cents != null && (
                              <>
                                <span>·</span>
                                <span className="font-medium text-body">{fmtPrice(r.total_price_cents, r.currency)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Form panel */}
      <ReservationFormPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditing(null) }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        editing={editing}
        kennelId={kennelId}
        owners={owners}
        litters={litters}
        dogs={dogs}
      />
    </div>
  )
}
