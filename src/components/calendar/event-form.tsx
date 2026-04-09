'use client'

import { useState, useEffect } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { Loader2, X, Trash2 } from 'lucide-react'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import SearchableSelect from '@/components/ui/searchable-select'

const EVENT_TYPES = [
  { value: 'breeding', label: 'Cria', color: '#9b59b6' },
  { value: 'birth', label: 'Parto', color: '#e84393' },
  { value: 'vet', label: 'Veterinario', color: '#3498db' },
  { value: 'show', label: 'Exposicion', color: '#f39c12' },
  { value: 'health', label: 'Salud', color: '#27ae60' },
  { value: 'other', label: 'Otro', color: '#95a5a6' },
]

interface EventFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initialData?: any
  defaultDate?: string
  userId: string
}

export default function EventForm({ open, onClose, onSaved, initialData, defaultDate, userId }: EventFormProps) {
  const isEdit = !!initialData
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [dogs, setDogs] = useState<{ value: string; label: string }[]>([])
  const [litters, setLitters] = useState<{ value: string; label: string }[]>([])
  const [contacts, setContacts] = useState<{ value: string; label: string }[]>([])
  const [deals, setDeals] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    async function loadEntities() {
      const supabase = createClient()
      const [d, l, c, dl] = await Promise.all([
        supabase.from('dogs').select('id, name').eq('owner_id', userId).order('name'),
        supabase.from('litters').select('id, breed:breeds(name)').eq('owner_id', userId),
        supabase.from('contacts').select('id, name').eq('owner_id', userId).order('name'),
        supabase.from('deals').select('id, title').eq('owner_id', userId).order('title'),
      ])
      setDogs((d.data || []).map((x: any) => ({ value: x.id, label: x.name, image: null })))
      setLitters((l.data || []).map((x: any) => ({ value: x.id, label: `Camada ${x.breed?.name || ''}` })))
      setContacts((c.data || []).map((x: any) => ({ value: x.id, label: x.name })))
      setDeals((dl.data || []).map((x: any) => ({ value: x.id, label: x.title })))
    }
    if (open && userId) loadEntities()
  }, [open, userId])

  const [form, setForm] = useState(() => ({
    title: initialData?.title || '',
    event_type: initialData?.event_type || 'other',
    start_date: initialData?.start_date?.slice(0, 16) || (defaultDate ? defaultDate + 'T09:00' : ''),
    end_date: initialData?.end_date?.slice(0, 16) || '',
    all_day: initialData?.all_day ?? true,
    color: initialData?.color || EVENT_TYPES.find(t => t.value === (initialData?.event_type || 'other'))?.color || '#95a5a6',
    notes: initialData?.notes || '',
    is_completed: initialData?.is_completed ?? false,
    dog_id: initialData?.dog_id || '',
    litter_id: initialData?.litter_id || '',
    contact_id: initialData?.contact_id || '',
    deal_id: initialData?.deal_id || '',
  }))

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleTypeChange = (type: string) => {
    const found = EVENT_TYPES.find(t => t.value === type)
    set('event_type', type)
    if (found) set('color', found.color)
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      title: form.title.trim(),
      event_type: form.event_type,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      all_day: form.all_day,
      color: form.color,
      notes: form.notes || null,
      is_completed: form.is_completed,
      dog_id: form.dog_id || null,
      litter_id: form.litter_id || null,
      contact_id: form.contact_id || null,
      deal_id: form.deal_id || null,
    }

    if (isEdit) {
      const { error: err } = await supabase.from('events').update(payload).eq('id', initialData.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('events').insert({ ...payload, owner_id: userId })
      if (err) { setError(err.message); setLoading(false); return }
    }

    setLoading(false)
    onSaved()
    onClose()
  }

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('events').delete().eq('id', initialData.id)
    setDeleting(false)
    setShowDelete(false)
    onSaved()
    onClose()
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-lg z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Fixed header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold">{isEdit ? 'Editar evento' : 'Nuevo evento'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Titulo *</label>
            <input
              type="text" value={form.title} onChange={(e) => set('title', e.target.value)} autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
              placeholder="Ej: Visita al veterinario"
            />
          </div>

          {/* Event type */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value} type="button" onClick={() => handleTypeChange(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    form.event_type === t.value ? 'text-white' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                  style={form.event_type === t.value ? { borderColor: t.color, backgroundColor: t.color + '25', color: t.color } : undefined}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Inicio</label>
              <input
                type={form.all_day ? 'date' : 'datetime-local'} value={form.all_day ? form.start_date?.slice(0, 10) : form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Fin (opcional)</label>
              <input
                type={form.all_day ? 'date' : 'datetime-local'} value={form.all_day ? form.end_date?.slice(0, 10) : form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition"
              />
            </div>
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Todo el dia</span>
            <ToggleSwitch value={form.all_day} onChange={(v) => set('all_day', v)} />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Color</label>
            <div className="flex gap-2">
              {['#D74709', '#9b59b6', '#e84393', '#3498db', '#f39c12', '#27ae60', '#95a5a6', '#e74c3c'].map((c) => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={`w-7 h-7 rounded-full transition ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Notas</label>
            <textarea
              value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Entity linking */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Vincular a (opcional)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dogs.length > 0 && (
                <SearchableSelect options={dogs} value={form.dog_id} onChange={v => set('dog_id', v)} placeholder="Perro..." label="Perro" />
              )}
              {litters.length > 0 && (
                <SearchableSelect options={litters} value={form.litter_id} onChange={v => set('litter_id', v)} placeholder="Camada..." label="Camada" />
              )}
              {contacts.length > 0 && (
                <SearchableSelect options={contacts} value={form.contact_id} onChange={v => set('contact_id', v)} placeholder="Contacto..." label="Contacto" />
              )}
              {deals.length > 0 && (
                <SearchableSelect options={deals} value={form.deal_id} onChange={v => set('deal_id', v)} placeholder="Negocio..." label="Negocio" />
              )}
            </div>
          </div>

          {/* Completed (edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Completado</span>
              <ToggleSwitch value={form.is_completed} onChange={(v) => set('is_completed', v)} color="bg-green-500" />
            </div>
          )}
        </div>

        {/* Fixed footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 flex-shrink-0 gap-2">
          {isEdit ? (
            <button type="button" onClick={() => setShowDelete(true)} className="text-sm text-red-400 hover:text-red-300 transition flex items-center gap-1.5 py-2">
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-3 sm:px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={loading || !form.title.trim()}
              className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
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
        title="Eliminar evento"
        message="Este evento se eliminara permanentemente."
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
      />
    </>
  )
}
