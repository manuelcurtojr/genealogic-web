'use client'

import { useState, useEffect } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { Stethoscope, Syringe, Bug, Pill, FlaskConical, Scissors, Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff, FileText } from 'lucide-react'
import FileGallery from './file-gallery'

const VET_TYPES = [
  { key: 'vaccine', label: 'Vacuna', icon: Syringe, color: '#3498db' },
  { key: 'deworming', label: 'Desparasitación', icon: Bug, color: '#27ae60' },
  { key: 'treatment', label: 'Tratamiento', icon: Pill, color: '#f39c12' },
  { key: 'test', label: 'Prueba médica', icon: FlaskConical, color: '#9b59b6' },
  { key: 'surgery', label: 'Cirugía', icon: Scissors, color: '#e74c3c' },
]

export default function SaludTab({ dogId, userId }: { dogId: string; userId: string }) {
  const [records, setRecords] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'vaccine', title: '', date: new Date().toISOString().split('T')[0], notes: '', is_public: false, files: [] as string[] })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('vet_records').select('*').eq('dog_id', dogId).order('date', { ascending: false })
    setRecords(data || [])
  }
  useEffect(() => { load() }, [dogId])

  const counts = VET_TYPES.map(t => ({ ...t, count: records.filter(r => r.type === t.key).length }))
  const filtered = filter === 'all' ? records : records.filter(r => r.type === filter)

  function parseFiles(fileUrl: string | null): string[] { try { return fileUrl ? JSON.parse(fileUrl) : [] } catch { return fileUrl ? [fileUrl] : [] } }

  function openAdd() { setEditRecord(null); setForm({ type: 'vaccine', title: '', date: new Date().toISOString().split('T')[0], notes: '', is_public: false, files: [] }); setShowForm(true) }
  function openEdit(r: any) { setEditRecord(r); setForm({ type: r.type, title: r.title, date: r.date, notes: r.notes || '', is_public: r.is_public ?? false, files: parseFiles(r.file_url) }); setShowForm(true) }

  async function handleSave() {
    if (!form.title.trim()) return; setSaving(true)
    const payload = { dog_id: dogId, owner_id: userId, type: form.type, title: form.title.trim(), date: form.date, notes: form.notes.trim() || null, is_public: form.is_public, file_url: form.files.length > 0 ? JSON.stringify(form.files) : null }
    if (editRecord) await supabase.from('vet_records').update(payload).eq('id', editRecord.id)
    else await supabase.from('vet_records').insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  async function handleDelete(id: string) { await supabase.from('vet_records').delete().eq('id', id); load() }
  async function togglePublic(r: any) { await supabase.from('vet_records').update({ is_public: !r.is_public }).eq('id', r.id); load() }

  const selType = VET_TYPES.find(t => t.key === form.type) || VET_TYPES[0]

  return (
    <div className="space-y-4">
      {/* Resumen por tipo */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
        {counts.map(t => { const Icon = t.icon; return (
          <div key={t.key} className="flex-shrink-0 rounded-xl border border-hairline bg-canvas px-3 py-2 min-w-[94px]">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: t.color + '1a' }}><Icon className="h-3.5 w-3.5" style={{ color: t.color }} /></span>
              <span className="text-[18px] font-semibold tabular-nums leading-none text-ink">{t.count}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted truncate">{t.label}</p>
          </div>
        )})}
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter('all')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === 'all' ? 'bg-ink text-on-primary' : 'bg-surface-card text-body hover:text-ink'}`}>Todos</button>
        {VET_TYPES.map(t => <button key={t.key} onClick={() => setFilter(t.key)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === t.key ? 'text-white' : 'bg-surface-card text-body hover:text-ink'}`} style={filter === t.key ? { backgroundColor: t.color } : undefined}>{t.label}</button>)}
      </div>

      {/* Botón añadir */}
      {!showForm && (
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-on-primary transition hover:opacity-90">
          <Plus className="h-4 w-4" /> Añadir registro
        </button>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="rounded-2xl border border-hairline bg-surface-soft p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: selType.color + '1a' }}><selType.icon className="h-3.5 w-3.5" style={{ color: selType.color }} /></span>
              <p className="text-[13.5px] font-semibold text-ink">{editRecord ? 'Editar registro' : 'Nuevo registro'}</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-muted hover:text-ink transition p-1"><X className="h-4 w-4" /></button>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">Tipo</label>
            <div className="flex flex-wrap gap-1.5">
              {VET_TYPES.map(t => { const Icon = t.icon; const on = form.type === t.key; return (
                <button key={t.key} onClick={() => setForm(p => ({ ...p, type: t.key }))}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition ${on ? 'text-white' : 'border-hairline text-body hover:text-ink'}`}
                  style={on ? { backgroundColor: t.color, borderColor: t.color } : undefined}>
                  <Icon className="h-3 w-3" style={on ? undefined : { color: t.color }} /> {t.label}
                </button>
              )})}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">Nombre</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Rabia, Milbemax..." className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">Fecha</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink focus:border-ink focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">Notas</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Opcional" rows={2} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none resize-none" />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">Archivos / Fotos</label>
            <FileGallery files={form.files} onChange={f => setForm(p => ({ ...p, files: f }))} folder={`vet/${dogId}`} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-hairline bg-canvas px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              {form.is_public ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted" />}
              <div>
                <p className="text-[13px] font-medium text-ink">Visible en el perfil</p>
                <p className="text-[11px] text-muted">Se muestra en la ficha pública del perro.</p>
              </div>
            </div>
            <ToggleSwitch value={form.is_public} onChange={(v) => setForm(p => ({ ...p, is_public: v }))} color="bg-emerald-500" />
          </div>

          <div className="flex justify-end gap-2 pt-0.5">
            <button onClick={() => setShowForm(false)} className="rounded-lg px-3.5 py-2 text-[13px] text-body hover:text-ink hover:bg-surface-card transition">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{editRecord ? 'Guardar' : 'Añadir'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline py-10 text-center text-muted">
          <Stethoscope className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">Sin registros todavía</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(r => {
            const type = VET_TYPES.find(t => t.key === r.type) || VET_TYPES[0]; const Icon = type.icon
            const ff = parseFiles(r.file_url)
            return (
              <div key={r.id} className="rounded-2xl border border-hairline bg-canvas p-3.5 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: type.color + '1a' }}><Icon className="h-5 w-5" style={{ color: type.color }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-medium text-ink leading-tight">{r.title}</p>
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: type.color + '1a', color: type.color }}>{type.label}</span>
                    {r.is_public && <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600"><Eye className="h-2.5 w-2.5" /> Público</span>}
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted">{new Date(r.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  {r.notes && <p className="mt-1 text-[12.5px] text-body leading-snug">{r.notes}</p>}
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
                  <button onClick={() => togglePublic(r)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-card hover:text-ink transition" title={r.is_public ? 'Ocultar del perfil' : 'Mostrar en perfil'}>
                    {r.is_public ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-card hover:text-ink transition" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(r.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-red-50 hover:text-red-500 transition" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
