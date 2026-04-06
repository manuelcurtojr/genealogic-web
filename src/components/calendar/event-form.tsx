'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import Modal from '@/components/ui/modal'
import ConfirmDialog from '@/components/ui/confirm-dialog'

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

  const [form, setForm] = useState(() => ({
    title: initialData?.title || '',
    event_type: initialData?.event_type || 'other',
    start_date: initialData?.start_date?.slice(0, 16) || (defaultDate ? defaultDate + 'T09:00' : ''),
    end_date: initialData?.end_date?.slice(0, 16) || '',
    all_day: initialData?.all_day ?? true,
    color: initialData?.color || EVENT_TYPES.find(t => t.value === (initialData?.event_type || 'other'))?.color || '#95a5a6',
    notes: initialData?.notes || '',
    is_completed: initialData?.is_completed ?? false,
  }))

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleTypeChange = (type: string) => {
    const found = EVENT_TYPES.find(t => t.value === type)
    set('event_type', type)
    if (found) set('color', found.color)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  return (
    <>
      <Modal open={open} onClose={onClose} title={isEdit ? 'Editar evento' : 'Nuevo evento'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Titulo *</label>
            <input
              type="text" value={form.title} onChange={(e) => set('title', e.target.value)} required autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Inicio</label>
              <input
                type={form.all_day ? 'date' : 'datetime-local'} value={form.all_day ? form.start_date?.slice(0, 10) : form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Fin (opcional)</label>
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
            <button type="button" onClick={() => set('all_day', !form.all_day)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.all_day ? 'bg-[#D74709]' : 'bg-white/20'}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${form.all_day ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
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
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Notas</label>
            <textarea
              value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Completed (edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Completado</span>
              <button type="button" onClick={() => set('is_completed', !form.is_completed)}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.is_completed ? 'bg-green-500' : 'bg-white/20'}`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${form.is_completed ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {isEdit ? (
              <button type="button" onClick={() => setShowDelete(true)} className="text-sm text-red-400 hover:text-red-300 transition">
                Eliminar evento
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/15 text-white transition">
                Cancelar
              </button>
              <button type="submit" disabled={loading || !form.title.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#D74709] hover:bg-[#c03d07] text-white transition disabled:opacity-50 flex items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={showDelete}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        title="Eliminar evento"
        message="¿Estas seguro de que quieres eliminar este evento?"
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
      />
    </>
  )
}
