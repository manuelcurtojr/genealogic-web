'use client'

import { useEffect, useState } from 'react'
import SlidePanel from '@/components/ui/slide-panel'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

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
  open: boolean
  onClose: () => void
  onSaved: (o: Owner) => void
  onDeleted: (id: string) => void
  editing: Owner | null
  kennelId: string
}

export default function OwnerFormPanel({ open, onClose, onSaved, onDeleted, editing, kennelId }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [idDocType, setIdDocType] = useState('')
  const [idDocNumber, setIdDocNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (editing) {
      setFullName(editing.full_name)
      setEmail(editing.email || '')
      setPhone(editing.phone || '')
      setCity(editing.city || '')
      setCountry(editing.country || '')
      // address, id_doc_* no vienen en la lista — los cargamos lazy si hace falta
      setAddress('')
      setIdDocType('')
      setIdDocNumber('')
      setNotes('')
    } else {
      setFullName(''); setEmail(''); setPhone(''); setAddress('')
      setCity(''); setCountry(''); setIdDocType(''); setIdDocNumber(''); setNotes('')
    }
  }, [editing, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      alert('El nombre es obligatorio')
      return
    }
    setSaving(true)
    const body = {
      kennel_id: kennelId,
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      id_doc_type: idDocType.trim() || null,
      id_doc_number: idDocNumber.trim() || null,
      notes: notes.trim() || null,
    }
    try {
      const url = editing ? `/api/owners/${editing.id}` : '/api/owners'
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
      onSaved(data.owner)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editing) return
    if (!confirm('¿Eliminar este cliente? Sus reservas no se borrarán pero quedarán sin cliente asignado.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/owners/${editing.id}`, { method: 'DELETE' })
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
    <SlidePanel open={open} onClose={onClose} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Nombre completo *">
          <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="input" placeholder="María García López" />
        </Field>

        <div className="grid grid-cols-1 gap-3">
          <Field label="Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="maria@ejemplo.com" />
          </Field>
          <Field label="Teléfono">
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+34 600 000 000" />
          </Field>
        </div>

        <Field label="Dirección">
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="input" placeholder="Calle, número, piso" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Ciudad">
            <input type="text" value={city} onChange={e => setCity(e.target.value)} className="input" placeholder="A Coruña" />
          </Field>
          <Field label="País">
            <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="input" placeholder="España" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo doc.">
            <select value={idDocType} onChange={e => setIdDocType(e.target.value)} className="input">
              <option value="">—</option>
              <option value="dni">DNI</option>
              <option value="nie">NIE</option>
              <option value="passport">Pasaporte</option>
            </select>
          </Field>
          <Field label="Número doc.">
            <input type="text" value={idDocNumber} onChange={e => setIdDocNumber(e.target.value)} className="input" placeholder="12345678X" />
          </Field>
        </div>

        <Field label="Notas internas">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input min-h-[80px]" placeholder="Información privada que solo verás tú: preferencias, conversaciones previas, alergias del cliente, etc." />
        </Field>

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
