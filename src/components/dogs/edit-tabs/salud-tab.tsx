'use client'

import { useState, useEffect } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { Img } from '@/components/ui/img'
import { createClient } from '@/lib/supabase/client'
import { Stethoscope, Syringe, Bug, Pill, FlaskConical, Scissors, Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff, FileText } from 'lucide-react'
import FileGallery from './file-gallery'
import { useT } from '@/components/i18n/locale-provider'

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
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ type: 'vaccine', title: '', date: new Date().toISOString().split('T')[0], notes: '', is_public: false, files: [] as string[] })
  const supabase = createClient()
  const t = useT()

  async function load() {
    const { data } = await supabase.from('vet_records').select('*').eq('dog_id', dogId).order('date', { ascending: false })
    setRecords(data || [])
  }
  useEffect(() => { load() }, [dogId])

  const counts = VET_TYPES.map(vt => ({ ...vt, count: records.filter(r => r.record_type === vt.key).length }))
  const filtered = filter === 'all' ? records : records.filter(r => r.record_type === filter)

  function parseFiles(fileUrl: string | null): string[] { try { return fileUrl ? JSON.parse(fileUrl) : [] } catch { return fileUrl ? [fileUrl] : [] } }

  function openAdd() { setEditRecord(null); setError(null); setForm({ type: 'vaccine', title: '', date: new Date().toISOString().split('T')[0], notes: '', is_public: false, files: [] }); setShowForm(true) }
  function openEdit(r: any) { setEditRecord(r); setError(null); setForm({ type: r.record_type, title: r.name, date: r.date, notes: r.notes || '', is_public: r.is_public ?? false, files: parseFiles(r.file_url) }); setShowForm(true) }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true); setError(null)
    // La tabla vet_records usa las columnas record_type y name (no type/title).
    const payload = { dog_id: dogId, owner_id: userId, record_type: form.type, name: form.title.trim(), date: form.date, notes: form.notes.trim() || null, is_public: form.is_public, file_url: form.files.length > 0 ? JSON.stringify(form.files) : null }
    const { error: err } = editRecord
      ? await supabase.from('vet_records').update(payload).eq('id', editRecord.id)
      : await supabase.from('vet_records').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowForm(false); load()
  }

  async function handleDelete(id: string) { await supabase.from('vet_records').delete().eq('id', id); load() }
  async function togglePublic(r: any) { await supabase.from('vet_records').update({ is_public: !r.is_public }).eq('id', r.id); load() }

  const selType = VET_TYPES.find(vt => vt.key === form.type) || VET_TYPES[0]

  return (
    <div className="space-y-4">
      {/* Resumen por tipo */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
        {counts.map(vt => { const Icon = vt.icon; return (
          <div key={vt.key} className="flex-shrink-0 rounded-xl border border-hairline bg-canvas px-3 py-2 min-w-[94px]">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: vt.color + '1a' }}><Icon className="h-3.5 w-3.5" style={{ color: vt.color }} /></span>
              <span className="text-[18px] font-semibold tabular-nums leading-none text-ink">{vt.count}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted truncate">{t(vt.label)}</p>
          </div>
        )})}
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter('all')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === 'all' ? 'bg-ink text-on-primary' : 'bg-surface-card text-body hover:text-ink'}`}>{t('Todos')}</button>
        {VET_TYPES.map(vt => <button key={vt.key} onClick={() => setFilter(vt.key)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === vt.key ? 'text-white' : 'bg-surface-card text-body hover:text-ink'}`} style={filter === vt.key ? { backgroundColor: vt.color } : undefined}>{t(vt.label)}</button>)}
      </div>

      {/* Botón añadir */}
      {!showForm && (
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-on-primary transition hover:opacity-90">
          <Plus className="h-4 w-4" /> {t('Añadir registro')}
        </button>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="rounded-2xl border border-hairline bg-surface-soft p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: selType.color + '1a' }}><selType.icon className="h-3.5 w-3.5" style={{ color: selType.color }} /></span>
              <p className="text-[13.5px] font-semibold text-ink">{editRecord ? t('Editar registro') : t('Nuevo registro')}</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-muted hover:text-ink transition p-1"><X className="h-4 w-4" /></button>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Tipo')}</label>
            <div className="flex flex-wrap gap-1.5">
              {VET_TYPES.map(vt => { const Icon = vt.icon; const on = form.type === vt.key; return (
                <button key={vt.key} onClick={() => setForm(p => ({ ...p, type: vt.key }))}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition ${on ? 'text-white' : 'border-hairline text-body hover:text-ink'}`}
                  style={on ? { backgroundColor: vt.color, borderColor: vt.color } : undefined}>
                  <Icon className="h-3 w-3" style={on ? undefined : { color: vt.color }} /> {t(vt.label)}
                </button>
              )})}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Nombre')}</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder={t('Ej: Rabia, Milbemax...')} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Fecha')}</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink focus:border-ink focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Notas')}</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder={t('Opcional')} rows={2} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none resize-none" />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Archivos / Fotos')}</label>
            <FileGallery files={form.files} onChange={f => setForm(p => ({ ...p, files: f }))} folder={`vet/${dogId}`} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-hairline bg-canvas px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              {form.is_public ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted" />}
              <div>
                <p className="text-[13px] font-medium text-ink">{t('Visible en el perfil')}</p>
                <p className="text-[11px] text-muted">{t('Se muestra en la ficha pública del perro.')}</p>
              </div>
            </div>
            <ToggleSwitch value={form.is_public} onChange={(v) => setForm(p => ({ ...p, is_public: v }))} color="bg-emerald-500" />
          </div>

          {error && <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-[12px] text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-0.5">
            <button onClick={() => setShowForm(false)} className="rounded-lg px-3.5 py-2 text-[13px] text-body hover:text-ink hover:bg-surface-card transition">{t('Cancelar')}</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{editRecord ? t('Guardar') : t('Añadir')}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline py-10 text-center text-muted">
          <Stethoscope className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">{t('Sin registros todavía')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(r => {
            const type = VET_TYPES.find(vt => vt.key === r.record_type) || VET_TYPES[0]; const Icon = type.icon
            const ff = parseFiles(r.file_url)
            return (
              <div key={r.id} className="rounded-2xl border border-hairline bg-canvas p-3.5 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: type.color + '1a' }}><Icon className="h-5 w-5" style={{ color: type.color }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-medium text-ink leading-tight">{r.name}</p>
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: type.color + '1a', color: type.color }}>{t(type.label)}</span>
                    {r.is_public && <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600"><Eye className="h-2.5 w-2.5" /> {t('Público')}</span>}
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted">{new Date(r.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  {r.notes && <p className="mt-1 text-[12.5px] text-body leading-snug">{r.notes}</p>}
                  {ff.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ff.map((u: string, i: number) => /\.(jpg|jpeg|png|gif|webp)/i.test(u) ? (
                        <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="h-10 w-10 overflow-hidden rounded-lg border border-hairline"><Img w={120} src={u} alt="" className="h-full w-full object-cover" /></a>
                      ) : (
                        <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-surface-card hover:bg-surface-soft transition"><FileText className="h-4 w-4 text-muted" /></a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => togglePublic(r)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-card hover:text-ink transition" title={r.is_public ? t('Ocultar del perfil') : t('Mostrar en perfil')}>
                    {r.is_public ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-card hover:text-ink transition" title={t('Editar')}><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(r.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-red-50 hover:text-red-500 transition" title={t('Eliminar')}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
