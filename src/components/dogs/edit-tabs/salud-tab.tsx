'use client'

import { useState, useEffect } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { Img } from '@/components/ui/img'
import { createClient } from '@/lib/supabase/client'
import { Stethoscope, Syringe, Bug, Pill, FlaskConical, Scissors, Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff, FileText, Bell, Check, Clock, Calendar } from 'lucide-react'
import FileGallery from './file-gallery'
import { useT } from '@/components/i18n/locale-provider'

const VET_TYPES = [
  { key: 'vaccine', label: 'Vacuna', icon: Syringe, color: '#3498db' },
  { key: 'deworming', label: 'Desparasitación', icon: Bug, color: '#27ae60' },
  { key: 'treatment', label: 'Tratamiento', icon: Pill, color: '#f39c12' },
  { key: 'test', label: 'Prueba médica', icon: FlaskConical, color: '#9b59b6' },
  { key: 'surgery', label: 'Cirugía', icon: Scissors, color: '#e74c3c' },
]

// Config visual de los recordatorios (vet_reminders). Replica TYPE_CONFIG de
// dog-vet-reminders.tsx para que la sección "Próximos recordatorios" tenga el
// mismo lenguaje visual que la ficha pública y /calendar.
const REMINDER_TYPES: Record<string, { label: string; color: string; icon: any }> = {
  vaccine: { label: 'Vacuna', color: '#10B981', icon: Syringe },
  deworming: { label: 'Desparasitación', color: '#F59E0B', icon: Bug },
  checkup: { label: 'Revisión', color: '#3B82F6', icon: Stethoscope },
  custom: { label: 'Otro', color: '#8B5CF6', icon: Calendar },
}

// Mapea el tipo de registro de la cartilla (vet_records.type) al tipo de
// recordatorio (vet_reminders.type). Los recordatorios solo tienen 4 tipos.
function mapRecordTypeToReminderType(recordType: string): string {
  switch (recordType) {
    case 'vaccine': return 'vaccine'
    case 'deworming': return 'deworming'
    case 'test': return 'checkup'
    case 'treatment': return 'custom'
    case 'surgery': return 'custom'
    default: return 'custom'
  }
}

// Sugerencia inteligente de meses hasta el próximo recordatorio según el tipo.
// vaccine → 12 meses, deworming → 3 meses, el resto → sin sugerencia.
function suggestedMonths(recordType: string): number | null {
  if (recordType === 'vaccine') return 12
  if (recordType === 'deworming') return 3
  return null
}

// Suma N meses a una fecha YYYY-MM-DD y devuelve YYYY-MM-DD.
function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

// Suma N días a una fecha YYYY-MM-DD y devuelve YYYY-MM-DD.
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const REMINDER_SELECT = 'id, dog_id, owner_id, template_id, title, type, due_date, completed_date, recurrence_days, auto_generated'

export default function SaludTab({ dogId, userId }: { dogId: string; userId: string }) {
  const [records, setRecords] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    type: 'vaccine',
    title: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    is_public: false,
    files: [] as string[],
    // Próximo recordatorio (opcional): si reminderDate está vacío, no se crea.
    reminderDate: '',
    reminderMonths: '' as string, // meses; '' = sin repetición
  })
  // ¿El usuario ha tocado manualmente los campos del recordatorio? Si no, al
  // cambiar de tipo aplicamos la sugerencia automática; si sí, la respetamos.
  const [reminderTouched, setReminderTouched] = useState(false)
  const supabase = createClient()
  const t = useT()

  async function load() {
    const [recRes, remRes] = await Promise.all([
      supabase.from('vet_records').select('*').eq('dog_id', dogId).order('date', { ascending: false }),
      supabase.from('vet_reminders').select(REMINDER_SELECT).eq('dog_id', dogId).is('completed_date', null).order('due_date', { ascending: true }),
    ])
    setRecords(recRes.data || [])
    setReminders(remRes.data || [])
  }
  useEffect(() => { load() }, [dogId])

  const counts = VET_TYPES.map(vt => ({ ...vt, count: records.filter(r => r.type === vt.key).length }))
  const filtered = filter === 'all' ? records : records.filter(r => r.type === filter)

  function parseFiles(fileUrl: string | null): string[] { try { return fileUrl ? JSON.parse(fileUrl) : [] } catch { return fileUrl ? [fileUrl] : [] } }

  // Aplica la sugerencia de recordatorio para un tipo+fecha dados.
  function applySuggestion(type: string, date: string) {
    const months = suggestedMonths(type)
    if (months == null) return { reminderDate: '', reminderMonths: '' }
    return { reminderDate: addMonths(date, months), reminderMonths: String(months) }
  }

  function openAdd() {
    setEditRecord(null); setError(null); setReminderTouched(false)
    const date = new Date().toISOString().split('T')[0]
    const sug = applySuggestion('vaccine', date)
    setForm({ type: 'vaccine', title: '', date, notes: '', is_public: false, files: [], ...sug })
    setShowForm(true)
  }
  function openEdit(r: any) {
    setEditRecord(r); setError(null); setReminderTouched(false)
    // En edición NO pre-rellenamos el recordatorio: solo se crea uno si el
    // usuario lo añade explícitamente en este submit (evita duplicados).
    setForm({ type: r.type, title: r.title, date: r.date, notes: r.notes || '', is_public: r.is_public ?? false, files: parseFiles(r.file_url), reminderDate: '', reminderMonths: '' })
    setShowForm(true)
  }

  // Cambio de tipo: si el usuario no ha tocado el recordatorio (y estamos
  // creando), reaplicamos la sugerencia del nuevo tipo.
  function onTypeChange(type: string) {
    setForm(p => {
      if (reminderTouched || editRecord) return { ...p, type }
      const sug = applySuggestion(type, p.date)
      return { ...p, type, ...sug }
    })
  }

  // Cambio de fecha del registro: si la sugerencia sigue activa, recalculamos
  // la fecha del recordatorio para que quede a N meses de la nueva fecha.
  function onDateChange(date: string) {
    setForm(p => {
      if (reminderTouched || editRecord || !p.reminderMonths) return { ...p, date }
      return { ...p, date, reminderDate: addMonths(date, parseInt(p.reminderMonths)) }
    })
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true); setError(null)
    // La tabla vet_records usa las columnas type y title (no record_type/name).
    const payload = { dog_id: dogId, owner_id: userId, type: form.type, title: form.title.trim(), date: form.date, notes: form.notes.trim() || null, is_public: form.is_public, file_url: form.files.length > 0 ? JSON.stringify(form.files) : null }
    const { error: err } = editRecord
      ? await supabase.from('vet_records').update(payload).eq('id', editRecord.id)
      : await supabase.from('vet_records').insert(payload)
    if (err) { setSaving(false); setError(err.message); return }

    // Si hay fecha de próximo recordatorio, creamos una fila en vet_reminders.
    // Una fila nueva por submit con reminderDate — no sincronizamos los antiguos.
    if (form.reminderDate) {
      const months = form.reminderMonths ? parseInt(form.reminderMonths) : 0
      const { error: remErr } = await supabase.from('vet_reminders').insert({
        dog_id: dogId,
        owner_id: userId,
        title: form.title.trim(),
        type: mapRecordTypeToReminderType(form.type),
        due_date: form.reminderDate,
        recurrence_days: months > 0 ? months * 30 : null,
        auto_generated: false,
      })
      // El registro ya se guardó; si falla solo el recordatorio, avisamos pero
      // no bloqueamos (el dato principal de la cartilla está a salvo).
      if (remErr) { setSaving(false); setError(t('El registro se guardó, pero no se pudo crear el recordatorio.') + ' ' + remErr.message); load(); return }
    }

    setSaving(false)
    setShowForm(false); load()
  }

  async function handleDelete(id: string) { await supabase.from('vet_records').delete().eq('id', id); load() }
  async function togglePublic(r: any) { await supabase.from('vet_records').update({ is_public: !r.is_public }).eq('id', r.id); load() }

  // Completa un recordatorio. Si es recurrente, crea el siguiente a
  // due_date + recurrence_days (misma lógica que dog-vet-reminders.tsx).
  async function completeReminder(rem: any) {
    setCompletingId(rem.id)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('vet_reminders').update({ completed_date: today }).eq('id', rem.id)
    if (rem.recurrence_days) {
      await supabase.from('vet_reminders').insert({
        dog_id: dogId,
        template_id: rem.template_id ?? null,
        owner_id: userId,
        title: rem.title,
        type: rem.type,
        due_date: addDays(rem.due_date, rem.recurrence_days),
        auto_generated: true,
        recurrence_days: rem.recurrence_days,
      })
    }
    setCompletingId(null)
    load()
  }

  const selType = VET_TYPES.find(vt => vt.key === form.type) || VET_TYPES[0]
  const todayISO = new Date().toISOString().split('T')[0]

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

      {/* Próximos recordatorios (vet_reminders pendientes de este perro) */}
      {reminders.length > 0 && (
        <div className="rounded-2xl border border-hairline bg-canvas p-3.5">
          <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <Bell className="h-3.5 w-3.5" /> {t('Próximos recordatorios')} ({reminders.length})
          </h3>
          <div className="space-y-1.5">
            {reminders.map(rem => {
              const conf = REMINDER_TYPES[rem.type] || REMINDER_TYPES.custom
              const Icon = conf.icon
              const isOverdue = rem.due_date < todayISO
              const isDueToday = rem.due_date === todayISO
              const isSoon = !isOverdue && !isDueToday && rem.due_date <= addDays(todayISO, 14)
              const highlight = isOverdue || isDueToday || isSoon
              return (
                <div key={rem.id} className={`flex items-center gap-2.5 rounded-lg p-2.5 border ${highlight ? 'bg-amber-500/5 border-amber-500/30' : 'bg-surface-card border-hairline'}`}>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0" style={{ background: conf.color + '15' }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: conf.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink truncate">{rem.title}</p>
                    <p className={`flex items-center gap-1 text-[11px] ${highlight ? 'text-amber-700' : 'text-muted'}`}>
                      <Clock className="h-2.5 w-2.5" />
                      {isOverdue ? `${t('Vencido')} · ` : isDueToday ? `${t('Hoy')} · ` : isSoon ? `${t('Pronto')} · ` : ''}
                      {new Date(rem.due_date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                      {rem.recurrence_days ? ` · ↻ ${Math.round(rem.recurrence_days / 30)} ${t('meses')}` : ''}
                    </p>
                  </div>
                  <button onClick={() => completeReminder(rem)} disabled={completingId === rem.id}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition flex-shrink-0 disabled:opacity-50"
                    title={t('Marcar como hecho')}>
                    {completingId === rem.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
                <button key={vt.key} onClick={() => onTypeChange(vt.key)}
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
              <input type="date" value={form.date} onChange={e => onDateChange(e.target.value)} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink focus:border-ink focus:outline-none" />
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

          {/* Próximo recordatorio (opcional) — crea una fila en vet_reminders y
              aparece en /calendar, dashboard y la ficha del perro. */}
          <div className="rounded-xl border border-hairline bg-canvas p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-muted" />
              <p className="text-[12.5px] font-medium text-ink">{t('Próximo recordatorio')}</p>
              <span className="text-[11px] text-muted">{t('(opcional)')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Fecha del aviso')}</label>
                <input type="date" value={form.reminderDate}
                  onChange={e => { setReminderTouched(true); setForm(p => ({ ...p, reminderDate: e.target.value })) }}
                  className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink focus:border-ink focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Repetir cada (meses)')}</label>
                <input type="number" min="0" value={form.reminderMonths}
                  onChange={e => { setReminderTouched(true); setForm(p => ({ ...p, reminderMonths: e.target.value })) }}
                  placeholder={t('0 = sin repetición')}
                  className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
              </div>
            </div>
            {form.reminderDate ? (
              <button type="button" onClick={() => { setReminderTouched(true); setForm(p => ({ ...p, reminderDate: '', reminderMonths: '' })) }}
                className="text-[11px] text-muted hover:text-ink transition">{t('Quitar recordatorio')}</button>
            ) : (
              <p className="text-[10.5px] text-muted">{t('Añade una fecha para recibir un aviso (en el calendario y por email).')}</p>
            )}
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

      {/* Lista (la cartilla — privada por defecto) */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline py-10 text-center text-muted">
          <Stethoscope className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">{t('Sin registros todavía')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(r => {
            const type = VET_TYPES.find(vt => vt.key === r.type) || VET_TYPES[0]; const Icon = type.icon
            const ff = parseFiles(r.file_url)
            return (
              <div key={r.id} className="rounded-2xl border border-hairline bg-canvas p-3.5 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: type.color + '1a' }}><Icon className="h-5 w-5" style={{ color: type.color }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-medium text-ink leading-tight">{r.title}</p>
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
