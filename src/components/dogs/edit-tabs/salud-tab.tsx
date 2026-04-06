'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Stethoscope, Syringe, Bug, Pill, FlaskConical, Scissors, Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff } from 'lucide-react'

const VET_TYPES = [
  { key: 'vaccine', label: 'Vacuna', icon: Syringe, color: '#3498db' },
  { key: 'deworming', label: 'Desparasitacion', icon: Bug, color: '#27ae60' },
  { key: 'treatment', label: 'Tratamiento', icon: Pill, color: '#f39c12' },
  { key: 'test', label: 'Prueba medica', icon: FlaskConical, color: '#9b59b6' },
  { key: 'surgery', label: 'Cirugia', icon: Scissors, color: '#e74c3c' },
]

export default function SaludTab({ dogId, userId }: { dogId: string; userId: string }) {
  const [records, setRecords] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'vaccine', title: '', date: new Date().toISOString().split('T')[0], notes: '', is_public: false })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('vet_records').select('*').eq('dog_id', dogId).order('date', { ascending: false })
    setRecords(data || [])
  }
  useEffect(() => { load() }, [dogId])

  const counts = VET_TYPES.map(t => ({ ...t, count: records.filter(r => r.type === t.key).length }))
  const filtered = filter === 'all' ? records : records.filter(r => r.type === filter)

  function openAdd() { setEditRecord(null); setForm({ type: 'vaccine', title: '', date: new Date().toISOString().split('T')[0], notes: '', is_public: false }); setShowForm(true) }
  function openEdit(r: any) { setEditRecord(r); setForm({ type: r.type, title: r.title, date: r.date, notes: r.notes || '', is_public: r.is_public ?? false }); setShowForm(true) }

  async function handleSave() {
    if (!form.title.trim()) return; setSaving(true)
    const payload = { dog_id: dogId, owner_id: userId, type: form.type, title: form.title.trim(), date: form.date, notes: form.notes.trim() || null, is_public: form.is_public }
    if (editRecord) await supabase.from('vet_records').update(payload).eq('id', editRecord.id)
    else await supabase.from('vet_records').insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  async function handleDelete(id: string) { await supabase.from('vet_records').delete().eq('id', id); load() }
  async function togglePublic(r: any) { await supabase.from('vet_records').update({ is_public: !r.is_public }).eq('id', r.id); load() }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {counts.map(t => { const Icon = t.icon; return (
          <div key={t.key} className="flex-shrink-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[110px]">
            <div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5" style={{ color: t.color }} /><span className="text-xs font-semibold">{t.label}</span></div>
            <p className="text-[11px] text-white/40 mt-0.5">{t.count} registros</p>
          </div>
        )})}
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === 'all' ? 'bg-[#D74709] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>Todos</button>
        {VET_TYPES.map(t => <button key={t.key} onClick={() => setFilter(t.key)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === t.key ? 'text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`} style={filter === t.key ? { backgroundColor: t.color } : undefined}>{t.label}</button>)}
      </div>

      {/* Add button */}
      <button onClick={openAdd} className="flex items-center gap-1.5 text-sm text-[#D74709] hover:text-[#c03d07] transition font-medium"><Plus className="w-4 h-4" /> Anadir registro</button>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{editRecord ? 'Editar registro' : 'Nuevo registro'}</p>
            <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {VET_TYPES.map(t => <button key={t.key} onClick={() => setForm(p => ({ ...p, type: t.key }))} className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${form.type === t.key ? 'text-white' : 'border-white/10 text-white/40'}`} style={form.type === t.key ? { backgroundColor: t.color, borderColor: t.color } : undefined}>{t.label}</button>)}
          </div>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Nombre (ej: Rabia, Milbemax...)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none" />
            <div />
          </div>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notas" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none resize-none" />
          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Visible en perfil</span>
            <button type="button" onClick={() => setForm(p => ({ ...p, is_public: !p.is_public }))}
              className={`w-9 h-5 rounded-full transition relative ${form.is_public ? 'bg-[#D74709]' : 'bg-white/20'}`}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition ${form.is_public ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-white/50 hover:text-white transition">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}{editRecord ? 'Guardar' : 'Anadir'}
            </button>
          </div>
        </div>
      )}

      {/* Records list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-white/30"><Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Sin registros</p></div>
      ) : filtered.map(r => {
        const type = VET_TYPES.find(t => t.key === r.type) || VET_TYPES[0]; const Icon = type.icon
        return (
          <div key={r.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-3 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: type.color + '20' }}><Icon className="w-4 h-4" style={{ color: type.color }} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{r.title}</p>
              <p className="text-xs text-white/40">{new Date(r.date).toLocaleDateString('es-ES')}</p>
              {r.notes && <p className="text-xs text-white/30 mt-0.5">{r.notes}</p>}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition items-center">
              <button onClick={() => togglePublic(r)} className="p-1 text-white/30 hover:text-white" title={r.is_public ? 'Ocultar del perfil' : 'Mostrar en perfil'}>
                {r.is_public ? <Eye className="w-3.5 h-3.5 text-green-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => openEdit(r)} className="p-1 text-white/30 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(r.id)} className="p-1 text-white/30 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
