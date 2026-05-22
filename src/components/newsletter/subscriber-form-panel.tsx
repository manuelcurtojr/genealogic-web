'use client'

import { useEffect, useState } from 'react'
import SlidePanel from '@/components/ui/slide-panel'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

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
  open: boolean
  onClose: () => void
  onSaved: (s: Subscriber) => void
  onDeleted: (id: string) => void
  editing: Subscriber | null
  kennelId: string
}

export default function SubscriberFormPanel({ open, onClose, onSaved, onDeleted, editing, kennelId }: Props) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [source, setSource] = useState('manual')
  const [tagsText, setTagsText] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (editing) {
      setEmail(editing.email)
      setFullName(editing.full_name || '')
      setSource(editing.source)
      setTagsText((editing.tags || []).join(', '))
      setIsActive(editing.is_active)
    } else {
      setEmail('')
      setFullName('')
      setSource('manual')
      setTagsText('')
      setIsActive(true)
    }
  }, [editing, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return alert('Email es obligatorio')
    setSaving(true)
    const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean)
    try {
      const url = editing ? `/api/newsletter/subscribers/${editing.id}` : '/api/newsletter/subscribers'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kennel_id: kennelId,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim() || null,
          source, tags, is_active: isActive,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al guardar')
      }
      const data = await res.json()
      onSaved(data.subscriber)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editing) return
    if (!confirm('¿Eliminar este suscriptor? Si solo quieres marcarlo como baja, desactiva el checkbox de activo en su lugar.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/newsletter/subscribers/${editing.id}`, { method: 'DELETE' })
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
    <SlidePanel open={open} onClose={onClose} title={editing ? 'Editar suscriptor' : 'Nuevo suscriptor'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email *">
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="input" placeholder="familia@ejemplo.com"
            disabled={!!editing}
          />
          {editing && <span className="block text-[11px] text-muted mt-1">El email no se puede editar.</span>}
        </Field>

        <Field label="Nombre">
          <input
            type="text" value={fullName} onChange={e => setFullName(e.target.value)}
            className="input" placeholder="María García (opcional)"
          />
        </Field>

        <Field label="Origen">
          <select value={source} onChange={e => setSource(e.target.value)} className="input">
            <option value="manual">Manual</option>
            <option value="import">Importado</option>
            <option value="web_form">Formulario web</option>
            <option value="reservation">Reserva</option>
            <option value="contract">Contrato</option>
          </select>
        </Field>

        <Field label="Etiquetas (separadas por coma)">
          <input
            type="text" value={tagsText} onChange={e => setTagsText(e.target.value)}
            className="input" placeholder="cliente, monográfica-madrid, lista-espera"
          />
        </Field>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-body">Suscripción activa</span>
        </label>

        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          {editing ? (
            <button
              type="button" onClick={handleDelete} disabled={deleting}
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
        :global(.input:focus) { border-color: var(--ink, #0f0f0f); }
        :global(.input:disabled) { background: var(--surface-card, #f7f7f7); color: var(--muted, #8a8a8a); }
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
