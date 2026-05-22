'use client'

import { useEffect, useState } from 'react'
import SlidePanel from '@/components/ui/slide-panel'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { CATEGORIES } from './knowledge-page-client'

interface Entry {
  id: string
  category: string
  title: string
  content: string
  position: number
  is_active: boolean
  updated_at: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (e: Entry) => void
  onDeleted: (id: string) => void
  editing: Entry | null
  kennelId: string
}

export default function KnowledgeFormPanel({ open, onClose, onSaved, onDeleted, editing, kennelId }: Props) {
  const [category, setCategory] = useState('general')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (editing) {
      setCategory(editing.category)
      setTitle(editing.title)
      setContent(editing.content)
      setIsActive(editing.is_active)
    } else {
      setCategory('general')
      setTitle('')
      setContent('')
      setIsActive(true)
    }
  }, [editing, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('Título y contenido son obligatorios')
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/knowledge/${editing.id}` : '/api/knowledge'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kennel_id: kennelId,
          category, title: title.trim(), content: content.trim(),
          is_active: isActive,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al guardar')
      }
      const data = await res.json()
      onSaved(data.entry)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editing) return
    if (!confirm('¿Eliminar esta entrada? El Emailbot dejará de usarla como contexto.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/knowledge/${editing.id}`, { method: 'DELETE' })
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
    <SlidePanel open={open} onClose={onClose} title={editing ? 'Editar entrada' : 'Nueva entrada'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Categoría">
          <select value={category} onChange={e => setCategory(e.target.value)} className="input">
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>

        <Field label="Título *">
          <input
            type="text" required value={title} onChange={e => setTitle(e.target.value)}
            className="input" placeholder="Precio del cachorro · Política de reserva · ¿Qué incluye la entrega?"
          />
        </Field>

        <Field label="Contenido *">
          <textarea
            required value={content} onChange={e => setContent(e.target.value)}
            className="input min-h-[200px]" placeholder="Cuenta aquí todo lo que el Emailbot necesita saber sobre este tema. Sé natural, en tu tono. Puedes usar varias líneas."
          />
          <span className="block text-[11px] text-muted mt-1">{content.length} caracteres</span>
        </Field>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-body">
            Activa — el Emailbot la usa como contexto
          </span>
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
          font-family: inherit;
        }
        :global(.input:focus) { border-color: var(--ink, #0f0f0f); }
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
