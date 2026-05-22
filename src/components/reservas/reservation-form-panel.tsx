'use client'

import { useEffect, useState } from 'react'
import SlidePanel from '@/components/ui/slide-panel'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

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

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (r: Reservation) => void
  onDeleted: (id: string) => void
  editing: Reservation | null
  kennelId: string
  owners: { id: string; full_name: string }[]
  litters: { id: string; expected_date: string | null }[]
  dogs: { id: string; name: string; sex: string }[]
}

const STATUS_OPTIONS = [
  { value: 'interested', label: 'Interesado' },
  { value: 'waitlisted', label: 'Lista de espera' },
  { value: 'deposit_paid', label: 'Depósito pagado' },
  { value: 'assigned', label: 'Cachorro asignado' },
  { value: 'contract_signed', label: 'Contrato firmado' },
  { value: 'paid_in_full', label: 'Pago total' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
]

export default function ReservationFormPanel({
  open, onClose, onSaved, onDeleted, editing, kennelId,
  owners, litters, dogs,
}: Props) {
  const [status, setStatus] = useState('interested')
  const [ownerId, setOwnerId] = useState<string>('')
  const [litterId, setLitterId] = useState<string>('')
  const [dogId, setDogId] = useState<string>('')
  const [prefSex, setPrefSex] = useState<string>('any')
  const [prefColor, setPrefColor] = useState('')
  const [prefNotes, setPrefNotes] = useState('')
  const [depositEur, setDepositEur] = useState('')
  const [totalEur, setTotalEur] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (editing) {
      setStatus(editing.status)
      setOwnerId(editing.owner_id || '')
      setLitterId(editing.litter_id || '')
      setDogId(editing.dog_id || '')
      setPrefSex(editing.preference_sex || 'any')
      setPrefColor(editing.preference_color || '')
      setPrefNotes(editing.preference_notes || '')
      setDepositEur(editing.deposit_amount_cents != null ? String(editing.deposit_amount_cents / 100) : '')
      setTotalEur(editing.total_price_cents != null ? String(editing.total_price_cents / 100) : '')
    } else {
      setStatus('interested')
      setOwnerId('')
      setLitterId('')
      setDogId('')
      setPrefSex('any')
      setPrefColor('')
      setPrefNotes('')
      setDepositEur('')
      setTotalEur('')
    }
  }, [editing, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const body = {
      kennel_id: kennelId,
      status,
      owner_id: ownerId || null,
      litter_id: litterId || null,
      dog_id: dogId || null,
      preference_sex: prefSex === 'any' ? null : prefSex,
      preference_color: prefColor.trim() || null,
      preference_notes: prefNotes.trim() || null,
      deposit_amount_cents: depositEur ? Math.round(parseFloat(depositEur) * 100) : null,
      total_price_cents: totalEur ? Math.round(parseFloat(totalEur) * 100) : null,
    }
    try {
      const url = editing ? `/api/reservations/${editing.id}` : '/api/reservations'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al guardar')
      }
      const data = await res.json()
      onSaved(data.reservation)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editing) return
    if (!confirm('¿Eliminar esta reserva? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/reservations/${editing.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al eliminar')
      }
      onDeleted(editing.id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <SlidePanel open={open} onClose={onClose} title={editing ? 'Editar reserva' : 'Nueva reserva'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Estado">
          <select value={status} onChange={e => setStatus(e.target.value)} className="input">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>

        <Field label="Cliente">
          <select value={ownerId} onChange={e => setOwnerId(e.target.value)} className="input">
            <option value="">— Sin asignar —</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
          </select>
        </Field>

        <Field label="Camada (opcional)">
          <select value={litterId} onChange={e => setLitterId(e.target.value)} className="input">
            <option value="">— Sin asignar —</option>
            {litters.map(l => (
              <option key={l.id} value={l.id}>
                {l.expected_date ? `Camada ${l.expected_date}` : `Camada ${l.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cachorro asignado (opcional)">
          <select value={dogId} onChange={e => setDogId(e.target.value)} className="input">
            <option value="">— Sin asignar —</option>
            {dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>

        <Field label="Preferencia sexo">
          <select value={prefSex} onChange={e => setPrefSex(e.target.value)} className="input">
            <option value="any">Indistinto</option>
            <option value="male">Macho</option>
            <option value="female">Hembra</option>
          </select>
        </Field>

        <Field label="Preferencia color">
          <input type="text" value={prefColor} onChange={e => setPrefColor(e.target.value)} className="input" placeholder="Atigrado, leonado, negro…" />
        </Field>

        <Field label="Notas">
          <textarea value={prefNotes} onChange={e => setPrefNotes(e.target.value)} className="input min-h-[80px]" placeholder="Notas internas sobre el cliente, preferencias específicas, etc." />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Depósito (€)">
            <input type="number" step="0.01" value={depositEur} onChange={e => setDepositEur(e.target.value)} className="input" placeholder="500" />
          </Field>
          <Field label="Precio total (€)">
            <input type="number" step="0.01" value={totalEur} onChange={e => setTotalEur(e.target.value)} className="input" placeholder="2000" />
          </Field>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          {editing ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-muted hover:text-[color:var(--error)] transition inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" size="sm" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : (editing ? 'Guardar' : 'Crear')}
            </Button>
          </div>
        </div>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--hairline, #e5e5e5);
          border-radius: 8px;
          background: #fff;
          font-size: 14px;
          color: var(--ink, #0f0f0f);
          outline: none;
          transition: border-color 0.15s;
        }
        :global(.input:focus) {
          border-color: var(--ink, #0f0f0f);
        }
      `}</style>
    </SlidePanel>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mb-1.5">{label}</span>
      {children}
    </label>
  )
}
