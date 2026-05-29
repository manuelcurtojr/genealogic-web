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
  async function togglePublic(a: any) { await supabase.from('awards').update({ is_public: !a.is_public }).eq('id', a.id); load() }

  const selType = AWARD_TYPES.find(t => t.key === form.award_type) || AWARD_TYPES[0]

  return (
    <div className="space-y-4">
      {/* Resumen por tipo */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
        {counts.map(t => (
          <div key={t.key} className="flex-shrink-0 rounded-xl border border-hairline bg-canvas px-3 py-2 min-w-[80px]">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: t.color + '1a' }}><Trophy className="h-3 w-3" style={{ color: t.color }} /></span>
              <span className="text-[18px] font-semibold tabular-nums leading-none text-ink">{t.count}</span>
            </div>
            <p className="mt-1 text-[11px] font-semibold truncate" style={{ color: t.color }}>{t.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter('all')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === 'all' ? 'bg-ink text-on-primary' : 'bg-surface-card text-body hover:text-ink'}`}>Todos</button>
        {AWARD_TYPES.map(t => <button key={t.key} onClick={() => setFilter(t.key)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === t.key ? 'text-white' : 'bg-surface-card text-body hover:text-ink'}`} style={filter === t.key ? { backgroundColor: t.color } : undefined}>{t.label}</button>)}
      </div>

      {/* Botón añadir */}
      {!showForm && (
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-on-primary transition hover:opacity-90">
          <Plus className="h-4 w-4" /> Añadir título
        </button>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="rounded-2xl border border-hairline bg-surface-soft p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: selType.color + '1a' }}><Trophy className="h-3.5 w-3.5" style={{ color: selType.color }} /></span>
              <p className="text-[13.5px] font-semibold text-ink">{editAward ? 'Editar título' : 'Nuevo título'}</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-muted hover:text-ink transition p-1"><X className="h-4 w-4" /></button>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">Tipo de premio</label>
            <div className="flex flex-wrap gap-1.5">
              {AWARD_TYPES.map(t => { const on = form.award_type === t.key; return (
                <button key={t.key} onClick={() => setForm(p => ({ ...p, award_type: t.key }))}
                  className={`rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition ${on ? 'text-white' : 'border-hairline text-body hover:text-ink'}`}
                  style={on ? { backgroundColor: t.color, borderColor: t.color } : undefined}>{t.label}</button>
              )})}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">Evento</label>
            <input value={form.event_name} onChange={e => setForm(p => ({ ...p, event_name: e.target.value }))} placeholder="Ej: Exposición Internacional de Madrid" className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">Fecha</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink focus:border-ink focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">Juez</label>
              <input value={form.judge} onChange={e => setForm(p => ({ ...p, judge: e.target.value }))} placeholder="Opcional" className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">Notas</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Opcional" rows={2} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none resize-none" />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">Certificados / Fotos</label>
            <FileGallery files={form.files} onChange={f => setForm(p => ({ ...p, files: f }))} folder={`awards/${dogId}`} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-hairline bg-canvas px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              {form.is_public ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted" />}
              <div>
                <p className="text-[13px] font-medium text-ink">Visible en el perfil</p>
                <p className="text-[11px] text-muted">Se muestra en el palmarés público del perro.</p>
              </div>
            </div>
            <ToggleSwitch value={form.is_public} onChange={(v) => setForm(p => ({ ...p, is_public: v }))} color="bg-emerald-500" />
          </div>

          <div className="flex justify-end gap-2 pt-0.5">
            <button onClick={() => setShowForm(false)} className="rounded-lg px-3.5 py-2 text-[13px] text-body hover:text-ink hover:bg-surface-card transition">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.event_name.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{editAward ? 'Guardar' : 'Añadir'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline py-10 text-center text-muted">
          <Trophy className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">Sin títulos todavía</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(a => {
            const type = AWARD_TYPES.find(t => t.key === a.award_type) || AWARD_TYPES[6]
            const ff = parseFiles(a.file_url)
            return (
              <div key={a.id} className="rounded-2xl border border-hairline bg-canvas p-3.5 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: type.color + '1a' }}><Trophy className="h-5 w-5" style={{ color: type.color }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-medium text-ink leading-tight">{a.event_name}</p>
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: type.color + '1a', color: type.color }}>{type.label}</span>
                    {a.is_public && <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600"><Eye className="h-2.5 w-2.5" /> Público</span>}
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {new Date(a.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}{a.judge && ` · Juez: ${a.judge}`}
                  </p>
                  {a.notes && <p className="mt-1 text-[12.5px] text-body leading-snug">{a.notes}</p>}
                  {ff.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ff.map((u: string, i: number) => /\.(jpg|jpeg|png|gif|webp)/i.test(u) ? (
                        <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="h-10 w-10 overflow-hidden rounded-lg border border-hairline"><img src={u} alt="" className="h-full w-full object-cover" /></a>
                      ) : (
                        <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-surface-card hover:bg-surface-soft transition"><FileText className="h-4 w-4 text-muted" /></a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => togglePublic(a)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-card hover:text-ink transition" title={a.is_public ? 'Ocultar del perfil' : 'Mostrar en perfil'}>
                    {a.is_public ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => openEdit(a)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-card hover:text-ink transition" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(a.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-red-50 hover:text-red-500 transition" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
