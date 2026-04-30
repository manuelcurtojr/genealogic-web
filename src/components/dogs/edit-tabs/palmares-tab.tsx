'use client'

import { useState, useEffect } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff, FileText } from 'lucide-react'
import FileGallery from './file-gallery'

const AWARD_TYPES = [
  { key: 'CAC', label: 'CAC', color: '#f39c12' },
  { key: 'CACIB', label: 'CACIB', color: '#f39c12' },
  { key: 'BOB', label: 'BOB', color: '#3498db' },
  { key: 'BOS', label: 'BOS', color: '#e84393' },
  { key: 'BOG', label: 'BOG', color: '#27ae60' },
  { key: 'BIS', label: 'BIS', color: '#f1c40f' },
  { key: 'other', label: 'Otro', color: '#95a5a6' },
]

export default function PalmaresTab({ dogId, userId }: { dogId: string; userId: string }) {
  const [awards, setAwards] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editAward, setEditAward] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ award_type: 'CAC', event_name: '', date: new Date().toISOString().split('T')[0], judge: '', notes: '', is_public: false, files: [] as string[] })
  const supabase = createClient()

  async function load() { const { data } = await supabase.from('awards').select('*').eq('dog_id', dogId).order('date', { ascending: false }); setAwards(data || []) }
  useEffect(() => { load() }, [dogId])

  const counts = AWARD_TYPES.map(t => ({ ...t, count: awards.filter(a => a.award_type === t.key).length }))
  const filtered = filter === 'all' ? awards : awards.filter(a => a.award_type === filter)

  function parseFiles(fileUrl: string | null): string[] { try { return fileUrl ? JSON.parse(fileUrl) : [] } catch { return fileUrl ? [fileUrl] : [] } }

  function openAdd() { setEditAward(null); setForm({ award_type: 'CAC', event_name: '', date: new Date().toISOString().split('T')[0], judge: '', notes: '', is_public: false, files: [] }); setShowForm(true) }
  function openEdit(a: any) { setEditAward(a); setForm({ award_type: a.award_type, event_name: a.event_name, date: a.date, judge: a.judge || '', notes: a.notes || '', is_public: a.is_public ?? false, files: parseFiles(a.file_url) }); setShowForm(true) }

  async function handleSave() {
    if (!form.event_name.trim()) return; setSaving(true)
    const payload = { dog_id: dogId, owner_id: userId, award_type: form.award_type, event_name: form.event_name.trim(), date: form.date, judge: form.judge.trim() || null, notes: form.notes.trim() || null, is_public: form.is_public, file_url: form.files.length > 0 ? JSON.stringify(form.files) : null }
    if (editAward) await supabase.from('awards').update(payload).eq('id', editAward.id)
    else await supabase.from('awards').insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  async function handleDelete(id: string) { await supabase.from('awards').delete().eq('id', id); load() }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {counts.map(t => <div key={t.key} className="flex-shrink-0 bg-chip border border-hair rounded-lg px-3 py-2 min-w-[80px]">
          <span className="text-xs font-bold" style={{ color: t.color }}>{t.label}</span>
          <p className="text-[11px] text-fg-mute">{t.count} titulos</p>
        </div>)}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === 'all' ? 'bg-[#D74709] text-white' : 'bg-chip text-fg-dim hover:bg-chip'}`}>Todos</button>
        {AWARD_TYPES.map(t => <button key={t.key} onClick={() => setFilter(t.key)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === t.key ? 'text-white' : 'bg-chip text-fg-dim hover:bg-chip'}`} style={filter === t.key ? { backgroundColor: t.color } : undefined}>{t.label}</button>)}
      </div>

      <button onClick={openAdd} className="flex items-center gap-1.5 text-sm text-[#D74709] hover:text-[#c03d07] transition font-medium"><Plus className="w-4 h-4" /> Añadir titulo</button>

      {showForm && (
        <div className="bg-chip border border-hair rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold">{editAward ? 'Editar titulo' : 'Nuevo titulo'}</p><button onClick={() => setShowForm(false)} className="text-fg-mute hover:text-fg"><X className="w-4 h-4" /></button></div>
          <div className="flex gap-1.5 flex-wrap">
            {AWARD_TYPES.map(t => <button key={t.key} onClick={() => setForm(p => ({ ...p, award_type: t.key }))} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${form.award_type === t.key ? 'text-white' : 'border-hair text-fg-mute'}`} style={form.award_type === t.key ? { backgroundColor: t.color, borderColor: t.color } : undefined}>{t.label}</button>)}
          </div>
          <input value={form.event_name} onChange={e => setForm(p => ({ ...p, event_name: e.target.value }))} placeholder="Nombre del evento" className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none" />
            <input value={form.judge} onChange={e => setForm(p => ({ ...p, judge: e.target.value }))} placeholder="Juez" className="bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none" />
          </div>
          {/* Files */}
          <div>
            <p className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1">Certificados / Fotos</p>
            <FileGallery files={form.files} onChange={f => setForm(p => ({ ...p, files: f }))} folder={`awards/${dogId}`} />
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-fg-dim">Visible en perfil</span>
            <ToggleSwitch value={form.is_public} onChange={(v) => setForm(p => ({ ...p, is_public: v }))} />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-fg-dim">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.event_name.trim()} className="bg-paper-50 text-ink-900 hover:opacity-90 px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}{editAward ? 'Guardar' : 'Añadir'}
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-fg-mute"><Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Sin titulos</p></div>
      ) : filtered.map(a => {
        const type = AWARD_TYPES.find(t => t.key === a.award_type) || AWARD_TYPES[6]
        return (
          <div key={a.id} className="bg-chip border border-hair rounded-lg p-3 flex items-start gap-3 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: type.color + '20' }}><Trophy className="w-4 h-4" style={{ color: type.color }} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{a.event_name}</p>
              <p className="text-xs text-fg-mute">{type.label} · {new Date(a.date).toLocaleDateString('es-ES')}{a.judge && ` · ${a.judge}`}</p>
              {a.file_url && (() => { const ff = parseFiles(a.file_url); return ff.length > 0 ? (
                <div className="flex gap-1.5 mt-1.5">
                  {ff.map((u: string, i: number) => /\.(jpg|jpeg|png|gif|webp)/i.test(u) ? (
                    <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded overflow-hidden"><img src={u} alt="" className="w-full h-full object-cover" /></a>
                  ) : (
                    <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded bg-chip flex items-center justify-center hover:bg-chip"><FileText className="w-3.5 h-3.5 text-[#D74709]" /></a>
                  ))}
                </div>
              ) : null })()}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition items-center">
              <button onClick={async () => { await supabase.from('awards').update({ is_public: !a.is_public }).eq('id', a.id); load() }} className="p-1 text-fg-mute hover:text-fg" title={a.is_public ? 'Ocultar' : 'Mostrar'}>
                {a.is_public ? <Eye className="w-3.5 h-3.5 text-green-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => openEdit(a)} className="p-1 text-fg-mute hover:text-fg"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(a.id)} className="p-1 text-fg-mute hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
