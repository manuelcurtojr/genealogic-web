'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, X } from 'lucide-react'
import ConfirmDialog from '@/components/ui/confirm-dialog'

const SOURCES = [
  { value: 'form', label: 'Formulario' },
  { value: 'direct', label: 'Directo' },
  { value: 'referral', label: 'Referido' },
  { value: 'social', label: 'Redes sociales' },
  { value: 'web', label: 'Web' },
  { value: 'other', label: 'Otro' },
]

interface ContactFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initialData?: any
  userId: string
}

export default function ContactForm({ open, onClose, onSaved, initialData, userId }: ContactFormProps) {
  const isEdit = !!initialData
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState(() => ({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    city: initialData?.city || '',
    source: initialData?.source || '',
    notes: initialData?.notes || '',
  }))

  useEffect(() => {
    if (open) {
      setForm({
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        city: initialData?.city || '',
        source: initialData?.source || '',
        notes: initialData?.notes || '',
      })
      setError('')
    }
  }, [open, initialData])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      name: form.name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      city: form.city || null,
      source: form.source || null,
      notes: form.notes || null,
    }

    if (isEdit) {
      const { error: err } = await supabase.from('contacts').update(payload).eq('id', initialData.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('contacts').insert({ ...payload, owner_id: userId })
      if (err) { setError(err.message); setLoading(false); return }
    }

    setLoading(false)
    onSaved()
    onClose()
  }

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('contacts').delete().eq('id', initialData.id)
    setDeleting(false)
    setShowDelete(false)
    onSaved()
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      {/* Slide panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-md z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold">{isEdit ? 'Editar contacto' : 'Nuevo contacto'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          <Field label="Nombre *" value={form.name} onChange={(v) => set('name', v)} required autoFocus={open} />
          <Field label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" placeholder="email@ejemplo.com" />
          <Field label="Telefono" value={form.phone} onChange={(v) => set('phone', v)} placeholder="+34 600 000 000" />
          <Field label="Ciudad" value={form.city} onChange={(v) => set('city', v)} />

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Origen</label>
            <select
              value={form.source} onChange={(e) => set('source', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none"
            >
              <option value="">Sin especificar</option>
              {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Notas</label>
            <textarea
              value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none"
              placeholder="Notas sobre el contacto..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 flex-shrink-0">
          {isEdit ? (
            <button type="button" onClick={() => setShowDelete(true)} className="text-sm text-red-400 hover:text-red-300 transition">
              Eliminar
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm bg-white/10 hover:bg-white/15 text-white transition">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={loading || !form.name.trim()}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#D74709] hover:bg-[#c03d07] text-white transition disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        title="Eliminar contacto"
        message="¿Estas seguro? Se eliminaran tambien los negocios asociados."
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
      />
    </>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, required, autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; autoFocus?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} autoFocus={autoFocus}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
    </div>
  )
}
