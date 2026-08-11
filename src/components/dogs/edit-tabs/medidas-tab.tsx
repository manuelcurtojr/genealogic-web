'use client'

import { useState, useEffect, type ElementType } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Ruler, Plus, Pencil, Trash2, X, Loader2, Calendar,
  Scale, Dog, MoveVertical, Heart, Bone, PawPrint, Footprints, Spline, Smile, Stethoscope, Dna, FileText,
} from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

// Una fila de dog_measurements = una TANDA de medidas morfológicas en una fecha
// (patrón 1:N por perro, como vet_records). Aquí registramos y editamos esas
// tandas y mostramos el histórico fechado. Los campos numéricos alimentan la
// predicción del planificador de cruces (media de progenitores); los
// cualitativos se comparan lado a lado.

type Field = { col: string; label: string; kind: 'num' | 'text' }
type Section = { title: string; icon: ElementType; fields: Field[] }

// Secciones y orden exactos de la ficha morfométrica. Las columnas coinciden
// con la migración 20260726_dog_measurements.sql.
const SECTIONS: Section[] = [
  {
    title: 'Generales', icon: Scale, fields: [
      { col: 'weight_kg', label: 'Peso (kg)', kind: 'num' },
      { col: 'height_withers_cm', label: 'Altura a la cruz (cm)', kind: 'num' },
      { col: 'height_rump_cm', label: 'Altura a la grupa (cm)', kind: 'num' },
    ],
  },
  {
    title: 'Cabeza', icon: Dog, fields: [
      { col: 'skull_circumference_cm', label: 'Perímetro craneal (cm)', kind: 'num' },
      { col: 'head_length_cm', label: 'Longitud total de cabeza (cm)', kind: 'num' },
      { col: 'skull_length_cm', label: 'Longitud de cráneo (cm)', kind: 'num' },
      { col: 'muzzle_length_cm', label: 'Longitud de morro (cm)', kind: 'num' },
      { col: 'skull_width_cm', label: 'Ancho de cráneo (cm)', kind: 'num' },
      { col: 'muzzle_width_cm', label: 'Ancho de morro (cm)', kind: 'num' },
      { col: 'inner_canthi_distance_cm', label: 'Distancia entre lagrimales (cm)', kind: 'num' },
      { col: 'ear_length_cm', label: 'Longitud de oreja (cm)', kind: 'num' },
    ],
  },
  {
    title: 'Cuello', icon: MoveVertical, fields: [
      { col: 'neck_length_cm', label: 'Longitud de cuello (cm)', kind: 'num' },
      { col: 'neck_circumference_cm', label: 'Perímetro de cuello (cm)', kind: 'num' },
    ],
  },
  {
    title: 'Tronco', icon: Heart, fields: [
      { col: 'body_length_cm', label: 'Longitud de tronco (cm)', kind: 'num' },
      { col: 'chest_girth_cm', label: 'Perímetro torácico (cm)', kind: 'num' },
      { col: 'abdominal_girth_cm', label: 'Perímetro estomacal (cm)', kind: 'num' },
      { col: 'chest_width_cm', label: 'Ancho de pecho (cm)', kind: 'num' },
      { col: 'shoulder_width_cm', label: 'Ancho de hombros (cm)', kind: 'num' },
    ],
  },
  {
    title: 'Grupa', icon: Bone, fields: [
      { col: 'rump_width_cm', label: 'Ancho de grupa (cm)', kind: 'num' },
      { col: 'rump_length_cm', label: 'Longitud de grupa (cm)', kind: 'num' },
    ],
  },
  {
    title: 'Miembro anterior', icon: PawPrint, fields: [
      { col: 'elbow_to_wrist_cm', label: 'Codo a muñeca (cm)', kind: 'num' },
      { col: 'wrist_to_ground_cm', label: 'Muñeca al suelo (cm)', kind: 'num' },
    ],
  },
  {
    title: 'Miembro posterior', icon: Footprints, fields: [
      { col: 'thigh_length_cm', label: 'Longitud de muslo (cm)', kind: 'num' },
      { col: 'hock_to_ground_cm', label: 'Corvejón al suelo (cm)', kind: 'num' },
    ],
  },
  {
    title: 'Rabo', icon: Spline, fields: [
      { col: 'tail_length_cm', label: 'Longitud de rabo (cm)', kind: 'num' },
    ],
  },
  {
    title: 'Dentición', icon: Smile, fields: [
      { col: 'dentition', label: 'Boca', kind: 'text' },
      { col: 'bite', label: 'Mordida', kind: 'text' },
    ],
  },
  {
    title: 'Salud', icon: Stethoscope, fields: [
      { col: 'hip_grade', label: 'Grado de cadera', kind: 'text' },
      { col: 'elbow_grade', label: 'Grado de codos', kind: 'text' },
      { col: 'laboklin', label: 'Laboklin', kind: 'text' },
    ],
  },
  {
    title: 'Morfología', icon: Dna, fields: [
      { col: 'stop', label: 'Stop', kind: 'text' },
      { col: 'aplomb', label: 'Aplomos', kind: 'text' },
      { col: 'hocks', label: 'Corvejones', kind: 'text' },
      { col: 'eyes', label: 'Ojos', kind: 'text' },
      { col: 'nose', label: 'Trufa', kind: 'text' },
      { col: 'lips', label: 'Belfos', kind: 'text' },
      { col: 'angulations', label: 'Angulaciones', kind: 'text' },
    ],
  },
]

// Columnas derivadas para construir el payload y contar campos rellenos.
const NUM_COLS = SECTIONS.flatMap(s => s.fields.filter(f => f.kind === 'num').map(f => f.col))
const TEXT_COLS = [...SECTIONS.flatMap(s => s.fields.filter(f => f.kind === 'text').map(f => f.col)), 'notes']
const DATA_COLS = [...NUM_COLS, ...TEXT_COLS]

// Medidas "titulares" para el resumen del histórico (primeras 3 disponibles).
const SUMMARY_FIELDS: { col: string; short: string }[] = [
  { col: 'weight_kg', short: 'Peso' },
  { col: 'height_withers_cm', short: 'Alzada' },
  { col: 'chest_girth_cm', short: 'P. torácico' },
  { col: 'body_length_cm', short: 'Tronco' },
  { col: 'head_length_cm', short: 'Cabeza' },
]

const todayISO = () => new Date().toISOString().split('T')[0]

// Formatea YYYY-MM-DD a "8 mar 2026" (es-ES), igual que salud-tab.
function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Número legible: 57.0 → "57", 57.5 → "57.5" (2 decimales máx).
function fmtNum(v: any): string {
  const n = Number(v)
  return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : ''
}

function hasVal(v: any): boolean {
  return v !== null && v !== undefined && v !== ''
}

// Estado del formulario: todo string (numéricos '' cuando null) + meta.
function emptyForm(): Record<string, string> {
  const f: Record<string, string> = { measured_at: todayISO(), age_months: '' }
  for (const c of DATA_COLS) f[c] = ''
  return f
}

export default function MedidasTab({ dogId, userId }: { dogId: string; userId: string }) {
  const [sets, setSets] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editSet, setEditSet] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>(emptyForm())
  const supabase = createClient()
  const t = useT()

  async function load() {
    const { data } = await supabase
      .from('dog_measurements')
      .select('*')
      .eq('dog_id', dogId)
      .order('measured_at', { ascending: false })
    setSets(data || [])
  }
  useEffect(() => { load() }, [dogId])

  const setField = (col: string, val: string) => setForm(p => ({ ...p, [col]: val }))

  function openAdd() {
    setEditSet(null); setError(null); setForm(emptyForm()); setShowForm(true)
  }
  function openEdit(s: any) {
    setEditSet(s); setError(null)
    const f: Record<string, string> = {
      measured_at: s.measured_at || todayISO(),
      age_months: s.age_months == null ? '' : String(s.age_months),
    }
    for (const c of DATA_COLS) f[c] = hasVal(s[c]) ? String(s[c]) : ''
    setForm(f)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.measured_at) return
    setSaving(true); setError(null)
    // owner_id = userId (RLS: owner_id = auth.uid()). Vacío → null en cada campo.
    const payload: Record<string, any> = {
      dog_id: dogId,
      owner_id: userId,
      measured_at: form.measured_at,
      age_months: form.age_months.trim() === '' ? null : (Number.isFinite(parseInt(form.age_months)) ? parseInt(form.age_months) : null),
    }
    for (const c of NUM_COLS) {
      const raw = (form[c] ?? '').trim()
      const n = parseFloat(raw)
      payload[c] = raw === '' || isNaN(n) ? null : n
    }
    for (const c of TEXT_COLS) {
      const raw = (form[c] ?? '').trim()
      payload[c] = raw === '' ? null : raw
    }
    const { error: err } = editSet
      ? await supabase.from('dog_measurements').update(payload).eq('id', editSet.id)
      : await supabase.from('dog_measurements').insert(payload)
    if (err) { setSaving(false); setError(err.message); return }
    setSaving(false); setShowForm(false); load()
  }

  async function handleDelete(id: string) {
    await supabase.from('dog_measurements').delete().eq('id', id)
    load()
  }

  // Resumen corto de una tanda: primeras 3 medidas titulares disponibles.
  function summarize(s: any): string {
    const parts: string[] = []
    for (const f of SUMMARY_FIELDS) {
      if (parts.length >= 3) break
      if (hasVal(s[f.col])) parts.push(`${t(f.short)} ${fmtNum(s[f.col])}`)
    }
    return parts.join(' · ')
  }
  const countFilled = (s: any) => DATA_COLS.reduce((acc, c) => acc + (hasVal(s[c]) ? 1 : 0), 0)

  const inputBase = 'w-full rounded-lg border border-hairline bg-canvas px-2.5 py-2 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none'

  // Campo numérico: type=number step=0.1, valor '' cuando null.
  const numField = (f: Field) => (
    <div key={f.col}>
      <label className="mb-1 block text-[11px] font-medium text-body">{t(f.label)}</label>
      <input type="number" step="0.1" inputMode="decimal" value={form[f.col] ?? ''}
        onChange={e => setField(f.col, e.target.value)}
        className={`${inputBase} tabular-nums`} />
    </div>
  )
  // Campo cualitativo: texto libre.
  const txtField = (f: Field) => (
    <div key={f.col}>
      <label className="mb-1 block text-[11px] font-medium text-body">{t(f.label)}</label>
      <input type="text" value={form[f.col] ?? ''}
        onChange={e => setField(f.col, e.target.value)}
        className={inputBase} />
    </div>
  )

  const hasSets = sets.length > 0

  return (
    <div className="space-y-5">
      {showForm ? (
        /* ── Formulario (alta / edición de una tanda) ── */
        <div className="rounded-2xl border border-hairline bg-surface-soft p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--brand-soft)' }}>
                <Ruler className="h-3.5 w-3.5" style={{ color: 'var(--brand)' }} />
              </span>
              <p className="text-[13.5px] font-semibold text-ink">{editSet ? t('Editar medidas') : t('Nuevas medidas')}</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-muted hover:text-ink transition p-1"><X className="h-4 w-4" /></button>
          </div>

          {/* Meta: fecha + edad al medir */}
          <div className="rounded-xl border border-hairline bg-canvas p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Fecha')}</label>
              <input type="date" value={form.measured_at} onChange={e => setField('measured_at', e.target.value)}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink focus:border-ink focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Edad al medir (meses)')}</label>
              <input type="number" step="1" min="0" inputMode="numeric" value={form.age_months}
                onChange={e => setField('age_months', e.target.value)} placeholder={t('Opcional')}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none tabular-nums" />
            </div>
          </div>

          {/* Secciones de medidas */}
          {SECTIONS.map(sec => {
            const Icon = sec.icon
            const allNum = sec.fields.every(f => f.kind === 'num')
            const grid = allNum ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
            return (
              <div key={sec.title} className="border-t border-hairline pt-4">
                <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <Icon className="h-3.5 w-3.5" style={{ color: 'var(--brand)' }} /> {t(sec.title)}
                </div>
                <div className={`grid ${grid} gap-x-2.5 gap-y-2.5`}>
                  {sec.fields.map(f => f.kind === 'num' ? numField(f) : txtField(f))}
                </div>
              </div>
            )
          })}

          {/* Notas */}
          <div className="border-t border-hairline pt-4">
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <FileText className="h-3.5 w-3.5" style={{ color: 'var(--brand)' }} /> {t('Notas')}
            </div>
            <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} rows={3} placeholder={t('Opcional')}
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none resize-none" />
          </div>

          {error && <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-[12px] text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-0.5">
            <button onClick={() => setShowForm(false)} className="rounded-lg px-3.5 py-2 text-[13px] text-body hover:text-ink hover:bg-surface-card transition">{t('Cancelar')}</button>
            <button onClick={handleSave} disabled={saving || !form.measured_at}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{editSet ? t('Guardar') : t('Añadir')}
            </button>
          </div>
        </div>
      ) : hasSets ? (
        /* ── Histórico de tandas ── */
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <Ruler className="h-3.5 w-3.5" /> {t('Historial')} ({sets.length})
            </div>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-on-primary transition hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> {t('Nuevas medidas')}
            </button>
          </div>

          <div className="space-y-2">
            {sets.map(s => {
              const summary = summarize(s)
              return (
                <div key={s.id} className="group rounded-2xl border border-hairline bg-canvas p-3.5 flex items-start gap-3 transition hover:border-ink/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: 'var(--brand-soft)' }}>
                    <Ruler className="h-4 w-4" style={{ color: 'var(--brand)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="inline-flex items-center gap-1 text-[14px] font-medium text-ink leading-tight">
                        <Calendar className="h-3 w-3 text-muted" /> {fmtDate(s.measured_at)}
                      </p>
                      {s.age_months != null && (
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: 'var(--brand-soft)', color: 'var(--brand)' }}>
                          {s.age_months} {t('meses')}
                        </span>
                      )}
                      <span className="rounded-full bg-surface-card px-1.5 py-0.5 text-[10px] font-medium text-muted tabular-nums">
                        {countFilled(s)} {t('medidas')}
                      </span>
                    </div>
                    {summary
                      ? <p className="mt-0.5 text-[12.5px] text-muted truncate">{summary}</p>
                      : <p className="mt-0.5 text-[12px] text-muted italic">{t('Sin medidas numéricas')}</p>}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                    <button onClick={() => openEdit(s)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-card hover:text-ink transition" title={t('Editar')}><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(s.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-red-50 hover:text-red-500 transition" title={t('Eliminar')}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* ── Estado vacío ── */
        <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft/40 px-5 py-9 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-card">
            <Ruler className="h-6 w-6 text-muted" />
          </span>
          <p className="text-[14.5px] font-semibold text-ink">{t('Aún no hay medidas registradas')}</p>
          <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-snug text-muted">{t('Anota el peso, la alzada y las medidas morfológicas con su fecha. Verás la evolución del perro y podrás compararla.')}</p>
          <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-on-primary transition hover:opacity-90">
            <Plus className="h-4 w-4" /> {t('Añadir medidas')}
          </button>
        </div>
      )}
    </div>
  )
}
