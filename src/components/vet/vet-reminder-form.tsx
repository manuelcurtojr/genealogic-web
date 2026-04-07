'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initialData?: any
  dogs: any[]
  templates: any[]
  userId: string
}

export default function VetReminderForm({ open, onClose, onSaved, initialData, dogs, templates, userId }: Props) {
  const isEdit = !!initialData
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    dog_id: '',
    template_id: '',
    title: '',
    type: 'custom' as string,
    due_date: '',
    notes: '',
    recurrence_days: '' as string,
  })

  useEffect(() => {
    if (!open) return
    setError('')
    if (initialData) {
      setForm({
        dog_id: initialData.dog_id || '',
        template_id: initialData.template_id || '',
        title: initialData.title || '',
        type: initialData.type || 'custom',
        due_date: initialData.due_date || '',
        notes: initialData.notes || '',
        recurrence_days: initialData.recurrence_days?.toString() || '',
      })
    } else {
      setForm({
        dog_id: '',
        template_id: '',
        title: '',
        type: 'custom',
        due_date: new Date().toISOString().split('T')[0],
        notes: '',
        recurrence_days: '',
      })
    }
  }, [open, initialData])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  // When template is selected, auto-fill type + title + recurrence
  const selectTemplate = (templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId)
    if (tmpl) {
      setForm(prev => ({
        ...prev,
        template_id: templateId,
        title: tmpl.name,
        type: tmpl.type,
        recurrence_days: tmpl.default_interval_days?.toString() || '',
      }))
    } else {
      set('template_id', '')
    }
  }

  const handleSubmit = async () => {
    if (!form.dog_id || !form.title.trim() || !form.due_date) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload: any = {
      dog_id: form.dog_id,
      template_id: form.template_id || null,
      title: form.title.trim(),
      type: form.type,
      due_date: form.due_date,
      notes: form.notes.trim() || null,
      recurrence_days: form.recurrence_days ? parseInt(form.recurrence_days) : null,
    }

    if (isEdit) {
      const { error: err } = await supabase.from('vet_reminders').update(payload).eq('id', initialData.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('vet_reminders').insert({ ...payload, owner_id: userId, auto_generated: false })
      if (err) { setError(err.message); setLoading(false); return }
    }

    setLoading(false)
    onSaved()
    onClose()
  }

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold">{isEdit ? 'Editar recordatorio' : 'Nuevo recordatorio'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Dog */}
          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Perro *</label>
            <select value={form.dog_id} onChange={e => set('dog_id', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
              <option value="">Seleccionar perro...</option>
              {dogs.map(d => <option key={d.id} value={d.id}>{d.name} {d.sex === 'male' ? '♂' : '♀'}</option>)}
            </select>
          </div>

          {/* Template (optional) */}
          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Plantilla (opcional)</label>
            <select value={form.template_id} onChange={e => selectTemplate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
              <option value="">Personalizado</option>
              <optgroup label="Vacunas">
                {templates.filter(t => t.type === 'vaccine').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </optgroup>
              <optgroup label="Desparasitación">
                {templates.filter(t => t.type === 'deworming').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </optgroup>
              <optgroup label="Revisiones">
                {templates.filter(t => t.type === 'checkup').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </optgroup>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Título *</label>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Ej: Vacuna anual polivalente"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
          </div>

          {/* Type + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
                <option value="vaccine">🩺 Vacuna</option>
                <option value="deworming">🪱 Desparasitación</option>
                <option value="checkup">🔍 Revisión</option>
                <option value="custom">📋 Personalizado</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Fecha *</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition" />
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Repetir cada (días)</label>
            <input type="number" min="0" value={form.recurrence_days} onChange={e => set('recurrence_days', e.target.value)}
              placeholder="0 = sin repetición"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
            <p className="text-[10px] text-white/25 mt-1">Al completar un recordatorio recurrente, se creará el siguiente automáticamente</p>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Notas</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={3} placeholder="Notas adicionales..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || !form.dog_id || !form.title.trim() || !form.due_date}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </>
  )
}
