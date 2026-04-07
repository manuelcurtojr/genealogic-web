'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, Check, Trash2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initialData?: any
  /** If provided, uses these. If not, fetches own data (for standalone use from calendar). */
  dogs?: any[]
  templates?: any[]
  userId?: string
  /** If provided, load this vet_reminder ID from DB (for calendar click). */
  reminderId?: string
}

export default function VetReminderForm({ open, onClose, onSaved, initialData, dogs: propDogs, templates: propTemplates, userId: propUserId, reminderId }: Props) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')
  const [selfLoading, setSelfLoading] = useState(false)

  // Self-loaded data when opened standalone (from calendar)
  const [selfDogs, setSelfDogs] = useState<any[]>([])
  const [selfTemplates, setSelfTemplates] = useState<any[]>([])
  const [selfUserId, setSelfUserId] = useState('')
  const [loadedReminder, setLoadedReminder] = useState<any>(null)

  const dogs = propDogs || selfDogs
  const templates = propTemplates || selfTemplates
  const userId = propUserId || selfUserId
  const editData = initialData || loadedReminder
  const isEdit = !!editData

  const [form, setForm] = useState({
    dog_id: '',
    template_id: '',
    title: '',
    type: 'custom' as string,
    due_date: '',
    notes: '',
    recurrence_days: '' as string,
  })

  // Load own data if dogs/templates not provided (standalone mode)
  useEffect(() => {
    if (!open) return
    if (propDogs && propTemplates && propUserId) return // Already have data

    setSelfLoading(true)
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSelfLoading(false); return }
      setSelfUserId(user.id)

      const [dogsRes, templatesRes] = await Promise.all([
        supabase.from('dogs').select('id, name, sex, thumbnail_url, birth_date').eq('owner_id', user.id).order('name'),
        supabase.from('vet_reminder_templates').select('*').or(`is_system.eq.true,owner_id.eq.${user.id}`).order('type, name'),
      ])
      setSelfDogs(dogsRes.data || [])
      setSelfTemplates(templatesRes.data || [])

      // Load reminder by ID if provided
      if (reminderId) {
        const { data } = await supabase.from('vet_reminders').select('*').eq('id', reminderId).single()
        if (data) setLoadedReminder(data)
      }

      setSelfLoading(false)
    }
    load()
  }, [open, propDogs, propTemplates, propUserId, reminderId])

  // Fill form when data available
  useEffect(() => {
    if (!open) return
    setError('')
    if (editData) {
      setForm({
        dog_id: editData.dog_id || '',
        template_id: editData.template_id || '',
        title: editData.title || '',
        type: editData.type || 'custom',
        due_date: editData.due_date || '',
        notes: editData.notes || '',
        recurrence_days: editData.recurrence_days?.toString() || '',
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
  }, [open, editData])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Cleanup loaded data on close
  useEffect(() => {
    if (!open) { setLoadedReminder(null) }
  }, [open])

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

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
      const { error: err } = await supabase.from('vet_reminders').update(payload).eq('id', editData.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('vet_reminders').insert({ ...payload, owner_id: userId, auto_generated: false })
      if (err) { setError(err.message); setLoading(false); return }
    }

    setLoading(false)
    onSaved()
    onClose()
  }

  const handleComplete = async () => {
    if (!editData?.id) return
    setCompleting(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('vet_reminders').update({ completed_date: today }).eq('id', editData.id)

    // Auto-create next if recurrent
    if (editData.recurrence_days) {
      const nextDate = new Date(today)
      nextDate.setDate(nextDate.getDate() + editData.recurrence_days)
      await supabase.from('vet_reminders').insert({
        dog_id: editData.dog_id,
        template_id: editData.template_id,
        owner_id: userId,
        title: editData.title,
        type: editData.type,
        due_date: nextDate.toISOString().split('T')[0],
        auto_generated: true,
        recurrence_days: editData.recurrence_days,
      })
    }

    setCompleting(false)
    onSaved()
    onClose()
  }

  const handleDelete = async () => {
    if (!editData?.id) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('vet_reminders').delete().eq('id', editData.id)
    setDeleting(false)
    onSaved()
    onClose()
  }

  const isCompleted = !!editData?.completed_date

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold">{isEdit ? 'Editar recordatorio' : 'Nuevo recordatorio'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {selfLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

            {/* Completed banner */}
            {isCompleted && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Completado el {new Date(editData.completed_date).toLocaleDateString('es-ES')}</span>
              </div>
            )}

            {/* Dog */}
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Perro *</label>
              <select value={form.dog_id} onChange={e => set('dog_id', e.target.value)} disabled={isCompleted}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none disabled:opacity-50">
                <option value="">Seleccionar perro...</option>
                {dogs.map(d => <option key={d.id} value={d.id}>{d.name} {d.sex === 'male' ? '♂' : '♀'}</option>)}
              </select>
            </div>

            {/* Template (optional) */}
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Plantilla (opcional)</label>
              <select value={form.template_id} onChange={e => selectTemplate(e.target.value)} disabled={isCompleted}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none disabled:opacity-50">
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
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)} disabled={isCompleted}
                placeholder="Ej: Vacuna anual polivalente"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition disabled:opacity-50" />
            </div>

            {/* Type + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Tipo</label>
                <select value={form.type} onChange={e => set('type', e.target.value)} disabled={isCompleted}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none disabled:opacity-50">
                  <option value="vaccine">🩺 Vacuna</option>
                  <option value="deworming">🪱 Desparasitación</option>
                  <option value="checkup">🔍 Revisión</option>
                  <option value="custom">📋 Personalizado</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Fecha *</label>
                <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} disabled={isCompleted}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition disabled:opacity-50" />
              </div>
            </div>

            {/* Recurrence */}
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Repetir cada (días)</label>
              <input type="number" min="0" value={form.recurrence_days} onChange={e => set('recurrence_days', e.target.value)} disabled={isCompleted}
                placeholder="0 = sin repetición"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition disabled:opacity-50" />
              <p className="text-[10px] text-white/25 mt-1">Al completar un recordatorio recurrente, se creará el siguiente automáticamente</p>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Notas</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} disabled={isCompleted}
                rows={3} placeholder="Notas adicionales..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none disabled:opacity-50" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            {isEdit && (
              <button onClick={handleDelete} disabled={deleting}
                className="text-sm text-red-400 hover:text-red-300 transition flex items-center gap-1.5 disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isEdit && !isCompleted && (
              <button onClick={handleComplete} disabled={completing}
                className="bg-green-500/15 text-green-400 hover:bg-green-500/25 font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 text-sm">
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {completing ? 'Completando...' : 'Completar'}
              </button>
            )}
            {!isCompleted && (
              <button onClick={handleSubmit} disabled={loading || !form.dog_id || !form.title.trim() || !form.due_date || selfLoading}
                className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
              </button>
            )}
            {isCompleted && (
              <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">Cerrar</button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
