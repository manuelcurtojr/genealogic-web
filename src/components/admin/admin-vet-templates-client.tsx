'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, Check, X, Syringe, Bug, Stethoscope, Calendar } from 'lucide-react'

interface Props { templates: any[] }

const TYPE_OPTIONS = [
  { value: 'vaccine', label: 'Vacuna', icon: Syringe, color: '#10B981' },
  { value: 'deworming', label: 'Desparasitación', icon: Bug, color: '#F59E0B' },
  { value: 'checkup', label: 'Revisión', icon: Stethoscope, color: '#3B82F6' },
  { value: 'custom', label: 'Personalizado', icon: Calendar, color: '#8B5CF6' },
]

const APPLIES_OPTIONS = [
  { value: 'puppy', label: 'Cachorro' },
  { value: 'adult', label: 'Adulto' },
  { value: 'both', label: 'Ambos' },
]

export default function AdminVetTemplatesClient({ templates: init }: Props) {
  const [templates, setTemplates] = useState(init)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', type: 'vaccine', default_interval_days: '365', applies_to: 'both' })

  const refresh = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('vet_reminder_templates').select('*').eq('is_system', true).order('type, name')
    setTemplates(data || [])
  }

  const set = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }))

  const addTemplate = async () => {
    if (!form.name.trim()) return
    const supabase = createClient()
    await supabase.from('vet_reminder_templates').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: form.type,
      default_interval_days: parseInt(form.default_interval_days) || 365,
      applies_to: form.applies_to,
      is_system: true,
      owner_id: null,
    })
    setForm({ name: '', description: '', type: 'vaccine', default_interval_days: '365', applies_to: 'both' })
    setShowAdd(false)
    refresh()
  }

  const startEdit = (t: any) => {
    setEditId(t.id)
    setForm({ name: t.name, description: t.description || '', type: t.type, default_interval_days: t.default_interval_days.toString(), applies_to: t.applies_to })
  }

  const saveEdit = async () => {
    if (!editId || !form.name.trim()) return
    const supabase = createClient()
    await supabase.from('vet_reminder_templates').update({
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: form.type,
      default_interval_days: parseInt(form.default_interval_days) || 365,
      applies_to: form.applies_to,
    }).eq('id', editId)
    setEditId(null)
    refresh()
  }

  const deleteTemplate = async (id: string) => {
    const supabase = createClient()
    await supabase.from('vet_reminder_templates').delete().eq('id', id)
    refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Plantillas veterinarias</h1>
          <p className="text-fg-mute text-sm">Plantillas del sistema para auto-generar recordatorios</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: '', description: '', type: 'vaccine', default_interval_days: '365', applies_to: 'both' }) }}
          className="bg-paper-50 text-ink-900 hover:opacity-90 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition">
          <Plus className="w-4 h-4" /> Nueva plantilla
        </button>
      </div>

      {/* Add form */}
      {(showAdd || editId) && (
        <div className="bg-chip border border-[#D74709]/20 rounded-xl p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre *"
              className="bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none" />
            <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descripción"
              className="bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none appearance-none">
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input type="number" value={form.default_interval_days} onChange={e => set('default_interval_days', e.target.value)} placeholder="Intervalo (días)"
              className="bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none" />
            <select value={form.applies_to} onChange={e => set('applies_to', e.target.value)}
              className="bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none appearance-none">
              {APPLIES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={editId ? saveEdit : addTemplate} disabled={!form.name.trim()}
              className="bg-paper-50 text-ink-900 hover:opacity-90 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
              {editId ? 'Guardar' : 'Crear'}
            </button>
            <button onClick={() => { setShowAdd(false); setEditId(null) }}
              className="text-fg-dim hover:text-fg px-4 py-2 rounded-lg text-sm transition">Cancelar</button>
          </div>
        </div>
      )}

      {/* Templates list */}
      <div className="bg-chip border border-hair rounded-xl overflow-hidden divide-y divide-white/5">
        {templates.map(t => {
          const typeConf = TYPE_OPTIONS.find(o => o.value === t.type) || TYPE_OPTIONS[3]
          const TypeIcon = typeConf.icon
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-800 transition">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: typeConf.color + '15' }}>
                <TypeIcon className="w-4 h-4" style={{ color: typeConf.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-[10px] text-fg-mute">{t.description}</p>
              </div>
              <span className="text-[10px] text-fg-mute bg-chip px-2 py-0.5 rounded-full">{t.applies_to === 'puppy' ? 'Cachorro' : t.applies_to === 'adult' ? 'Adulto' : 'Ambos'}</span>
              <span className="text-xs text-fg-mute">{t.default_interval_days}d</span>
              <button onClick={() => startEdit(t)} className="text-fg-mute hover:text-fg-dim transition"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => deleteTemplate(t.id)} className="text-fg-mute hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )
        })}
        {templates.length === 0 && <p className="text-center py-8 text-fg-mute text-sm">Sin plantillas</p>}
      </div>
    </div>
  )
}
