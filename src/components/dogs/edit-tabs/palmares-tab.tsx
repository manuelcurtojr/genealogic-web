'use client'

import { useState, useEffect } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { Img } from '@/components/ui/img'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Award, Medal, Crown, Ribbon, Star, Sparkles, Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff, FileText, Calendar, Gavel } from 'lucide-react'
import FileGallery from './file-gallery'
import { useT } from '@/components/i18n/locale-provider'

// Tipos de premio. Las columnas de `awards` (award_type) usan estas claves —
// NO renombrar. Añadimos icono por tipo (mismo lenguaje visual que salud-tab)
// y conservamos los colores existentes. `prestige` marca los logros de relumbrón
// que aparecen en la tira de destacados.
const AWARD_TYPES: { key: string; label: string; color: string; icon: any; prestige?: boolean }[] = [
  { key: 'CAC', label: 'CAC', color: '#f39c12', icon: Award },
  { key: 'CACIB', label: 'CACIB', color: '#f39c12', icon: Medal, prestige: true },
  { key: 'BOB', label: 'BOB', color: '#3498db', icon: Ribbon, prestige: true },
  { key: 'BOS', label: 'BOS', color: '#e84393', icon: Star },
  { key: 'BOG', label: 'BOG', color: '#27ae60', icon: Crown },
  { key: 'BIS', label: 'BIS', color: '#f1c40f', icon: Trophy, prestige: true },
  { key: 'other', label: 'Otro', color: '#95a5a6', icon: Award },
]

// Atajos de alta rápida (un toque pre-rellena el formulario con el tipo y un
// placeholder de evento sensato). Hardcoded a propósito: cubren los logros más
// habituales de un palmarés de exposición.
const QUICK_ADD: { label: string; type: string; placeholder: string }[] = [
  { label: 'CAC', type: 'CAC', placeholder: 'Ej: Exposición Nacional' },
  { label: 'CACIB', type: 'CACIB', placeholder: 'Ej: Exposición Internacional' },
  { label: 'Excelente 1º', type: 'other', placeholder: 'Ej: Exposición Monográfica' },
  { label: 'BOB', type: 'BOB', placeholder: 'Ej: Mejor de Raza' },
]

// Formatea YYYY-MM-DD a "8 mar 2026" (es-ES), igual que salud-tab.
function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PalmaresTab({ dogId, userId }: { dogId: string; userId: string }) {
  const [awards, setAwards] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editAward, setEditAward] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [eventPlaceholder, setEventPlaceholder] = useState('Ej: Exposición Internacional de Madrid')
  const [form, setForm] = useState({ award_type: 'CAC', event_name: '', date: new Date().toISOString().split('T')[0], judge: '', notes: '', is_public: false, files: [] as string[] })
  const supabase = createClient()
  const t = useT()

  async function load() { const { data } = await supabase.from('awards').select('*').eq('dog_id', dogId).order('date', { ascending: false }); setAwards(data || []) }
  useEffect(() => { load() }, [dogId])

  const counts = AWARD_TYPES.map(at => ({ ...at, count: awards.filter(a => a.award_type === at.key).length }))
  const filtered = filter === 'all' ? awards : awards.filter(a => a.award_type === filter)

  // Destacados: total + los logros de relumbrón que tengan al menos uno.
  const prestige = AWARD_TYPES.filter(at => at.prestige).map(at => ({ ...at, count: awards.filter(a => a.award_type === at.key).length })).filter(at => at.count > 0)

  function parseFiles(fileUrl: string | null): string[] { try { return fileUrl ? JSON.parse(fileUrl) : [] } catch { return fileUrl ? [fileUrl] : [] } }

  function openAdd() {
    setEditAward(null)
    setEventPlaceholder('Ej: Exposición Internacional de Madrid')
    setForm({ award_type: 'CAC', event_name: '', date: new Date().toISOString().split('T')[0], judge: '', notes: '', is_public: false, files: [] })
    setShowForm(true)
  }
  function openEdit(a: any) {
    setEditAward(a)
    setEventPlaceholder('Ej: Exposición Internacional de Madrid')
    setForm({ award_type: a.award_type, event_name: a.event_name, date: a.date, judge: a.judge || '', notes: a.notes || '', is_public: a.is_public ?? false, files: parseFiles(a.file_url) })
    setShowForm(true)
  }

  // Atajo de alta rápida: abre el formulario ya con el tipo seleccionado y un
  // placeholder de evento acorde al preset. Solo prefill — el usuario rellena.
  function openPreset(p: { type: string; placeholder: string }) {
    setEditAward(null)
    setEventPlaceholder(p.placeholder)
    setForm({ award_type: p.type, event_name: '', date: new Date().toISOString().split('T')[0], judge: '', notes: '', is_public: false, files: [] })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.event_name.trim()) return; setSaving(true)
    const payload = { dog_id: dogId, owner_id: userId, award_type: form.award_type, event_name: form.event_name.trim(), date: form.date, judge: form.judge.trim() || null, notes: form.notes.trim() || null, is_public: form.is_public, file_url: form.files.length > 0 ? JSON.stringify(form.files) : null }
    if (editAward) await supabase.from('awards').update(payload).eq('id', editAward.id)
    else await supabase.from('awards').insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  async function handleDelete(id: string) { await supabase.from('awards').delete().eq('id', id); load() }
  async function togglePublic(a: any) { await supabase.from('awards').update({ is_public: !a.is_public }).eq('id', a.id); load() }

  const selType = AWARD_TYPES.find(at => at.key === form.award_type) || AWARD_TYPES[0]
  const SelIcon = selType.icon
  const hasAwards = awards.length > 0

  // Agrupa los logros filtrados por año (clave número) preservando el orden
  // (ya vienen ordenados por fecha desc desde load()).
  const groupedByYear: { year: number; items: any[] }[] = []
  for (const a of filtered) {
    const year = new Date(a.date + 'T00:00:00').getFullYear()
    const last = groupedByYear[groupedByYear.length - 1]
    if (last && last.year === year) last.items.push(a)
    else groupedByYear.push({ year, items: [a] })
  }

  // Bloque de atajos de alta rápida (reutilizado en cabecera y empty state).
  const quickAddRow = (
    <div className="flex flex-wrap gap-1.5">
      {QUICK_ADD.map(p => {
        const at = AWARD_TYPES.find(a => a.key === p.type) || AWARD_TYPES[0]
        const Icon = at.icon
        return (
          <button key={p.label} type="button" onClick={() => openPreset(p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-2.5 py-1.5 text-[12px] font-medium text-body transition hover:border-ink hover:text-ink">
            <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: at.color + '1a' }}>
              <Icon className="h-2.5 w-2.5" style={{ color: at.color }} />
            </span>
            {t(p.label)}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* ── Acción primaria: añadir + atajos rápidos ── */}
      {!showForm && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <Sparkles className="h-3 w-3" /> {t('Añadir al palmarés')}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-on-primary transition hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> {t('Nuevo logro')}
            </button>
            {quickAddRow}
          </div>
        </div>
      )}

      {/* ── Destacados del palmarés: lectura rápida de la trayectoria ── */}
      {!showForm && hasAwards && (
        <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] to-amber-500/[0.02] p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700/80">
            <Trophy className="h-3.5 w-3.5" /> {t('Trayectoria')}
          </div>
          <div className="mt-3 flex flex-wrap items-stretch gap-2.5">
            {/* Total de logros */}
            <div className="flex items-center gap-2.5 rounded-xl bg-canvas/70 px-3.5 py-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15">
                <Trophy className="h-4.5 w-4.5 text-amber-600" />
              </span>
              <div className="leading-none">
                <p className="text-[20px] font-bold tabular-nums text-ink">{awards.length}</p>
                <p className="mt-1 text-[11px] font-medium text-muted">{awards.length === 1 ? t('logro') : t('logros')}</p>
              </div>
            </div>
            {/* Stat chips de los logros de relumbrón */}
            {prestige.map(at => { const Icon = at.icon; return (
              <div key={at.key} className="flex items-center gap-2 rounded-xl bg-canvas/70 px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: at.color + '20' }}>
                  <Icon className="h-4 w-4" style={{ color: at.color }} />
                </span>
                <div className="leading-none">
                  <p className="text-[17px] font-bold tabular-nums text-ink">{at.count}</p>
                  <p className="mt-0.5 text-[10.5px] font-semibold" style={{ color: at.color }}>{t(at.label)}</p>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {/* ── Formulario (alta / edición) ── */}
      {showForm && (
        <div className="rounded-2xl border border-hairline bg-surface-soft p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: selType.color + '1a' }}><SelIcon className="h-3.5 w-3.5" style={{ color: selType.color }} /></span>
              <p className="text-[13.5px] font-semibold text-ink">{editAward ? t('Editar logro') : t('Nuevo logro')}</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-muted hover:text-ink transition p-1"><X className="h-4 w-4" /></button>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Tipo de premio')}</label>
            <div className="flex flex-wrap gap-1.5">
              {AWARD_TYPES.map(at => { const Icon = at.icon; const on = form.award_type === at.key; return (
                <button key={at.key} onClick={() => setForm(p => ({ ...p, award_type: at.key }))}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition ${on ? 'text-white' : 'border-hairline text-body hover:text-ink'}`}
                  style={on ? { backgroundColor: at.color, borderColor: at.color } : undefined}>
                  <Icon className="h-3 w-3" style={on ? undefined : { color: at.color }} /> {t(at.label)}
                </button>
              )})}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Evento')}</label>
            <input value={form.event_name} onChange={e => setForm(p => ({ ...p, event_name: e.target.value }))} placeholder={t(eventPlaceholder)} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Fecha')}</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink focus:border-ink focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Juez')}</label>
              <input value={form.judge} onChange={e => setForm(p => ({ ...p, judge: e.target.value }))} placeholder={t('Opcional')} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Notas')}</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder={t('Opcional')} rows={2} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none resize-none" />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">{t('Certificados / Fotos')}</label>
            <FileGallery files={form.files} onChange={f => setForm(p => ({ ...p, files: f }))} folder={`awards/${dogId}`} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-hairline bg-canvas px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              {form.is_public ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted" />}
              <div>
                <p className="text-[13px] font-medium text-ink">{t('Visible en el perfil')}</p>
                <p className="text-[11px] text-muted">{t('Se muestra en el palmarés público del perro.')}</p>
              </div>
            </div>
            <ToggleSwitch value={form.is_public} onChange={(v) => setForm(p => ({ ...p, is_public: v }))} color="bg-emerald-500" />
          </div>

          <div className="flex justify-end gap-2 pt-0.5">
            <button onClick={() => setShowForm(false)} className="rounded-lg px-3.5 py-2 text-[13px] text-body hover:text-ink hover:bg-surface-card transition">{t('Cancelar')}</button>
            <button onClick={handleSave} disabled={saving || !form.event_name.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{editAward ? t('Guardar') : t('Añadir')}
            </button>
          </div>
        </div>
      )}

      {/* ── El palmarés: filtros por tipo + timeline ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <Trophy className="h-3.5 w-3.5" /> {t('Palmarés')}{hasAwards ? ` (${awards.length})` : ''}
        </div>

        {/* Filtros por tipo (chip con icono + recuento; activo on-brand) */}
        {hasAwards && (
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilter('all')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${filter === 'all' ? 'bg-ink text-on-primary' : 'border border-hairline bg-canvas text-body hover:text-ink'}`}>
              {t('Todos')} <span className="tabular-nums opacity-70">{awards.length}</span>
            </button>
            {counts.filter(at => at.count > 0).map(at => { const Icon = at.icon; const on = filter === at.key; return (
              <button key={at.key} onClick={() => setFilter(at.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${on ? 'text-white' : 'border border-hairline bg-canvas text-body hover:text-ink'}`}
                style={on ? { backgroundColor: at.color } : undefined}>
                <Icon className="h-3 w-3" style={on ? undefined : { color: at.color }} />
                {t(at.label)} <span className="tabular-nums opacity-70">{at.count}</span>
              </button>
            )})}
          </div>
        )}

        {/* Timeline (o estado vacío) */}
        {!hasAwards ? (
          <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft/40 px-5 py-9 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <Trophy className="h-6 w-6 text-amber-600" />
            </span>
            <p className="text-[14.5px] font-semibold text-ink">{t('El palmarés está vacío')}</p>
            <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-snug text-muted">{t('Registra los logros de tu perro en exposición: CAC, CACIB, BOB, títulos de campeón… y construye su trayectoria.')}</p>
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-on-primary transition hover:opacity-90">
              <Plus className="h-4 w-4" /> {t('Añadir primer logro')}
            </button>
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-[11px] text-muted">{t('o empieza por uno de estos:')}</p>
              <div className="flex justify-center">{quickAddRow}</div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline py-9 text-center text-muted">
            <p className="text-[13px]">{t('No hay logros de este tipo.')}</p>
            <button onClick={() => setFilter('all')} className="mt-1 text-[12px] font-medium text-ink underline-offset-2 hover:underline">{t('Ver todos')}</button>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedByYear.map(group => (
              <div key={group.year}>
                {/* Cabecera de año (solo si hay más de un año para no recargar) */}
                {groupedByYear.length > 1 && (
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted tabular-nums">{group.year}</p>
                )}
                {/* Línea de tiempo vertical */}
                <div className="relative space-y-2.5 pl-5 before:absolute before:left-[7px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-hairline">
                  {group.items.map(a => {
                    const type = AWARD_TYPES.find(at => at.key === a.award_type) || AWARD_TYPES[6]; const Icon = type.icon
                    const ff = parseFiles(a.file_url)
                    return (
                      <div key={a.id} className="group relative">
                        {/* Nodo en la línea, con el color del tipo */}
                        <span className="absolute -left-5 top-3 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-canvas" style={{ backgroundColor: type.color }} />
                        <div className="rounded-2xl border border-hairline bg-canvas p-3.5 flex items-start gap-3 transition hover:border-ink/20">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: type.color + '1a' }}><Icon className="h-4.5 w-4.5" style={{ color: type.color }} /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[14px] font-medium text-ink leading-tight">{a.event_name}</p>
                              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: type.color + '1a', color: type.color }}>{t(type.label)}</span>
                              <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${a.is_public ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-card text-muted'}`}>
                                {a.is_public ? <><Eye className="h-2.5 w-2.5" /> {t('Público')}</> : <><EyeOff className="h-2.5 w-2.5" /> {t('Privado')}</>}
                              </span>
                            </div>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(a.date)}</span>
                              {a.judge && <span className="inline-flex items-center gap-1"><Gavel className="h-3 w-3" /> {a.judge}</span>}
                            </p>
                            {a.notes && <p className="mt-1 text-[12.5px] text-body leading-snug">{a.notes}</p>}
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
                          {/* Acciones: visibles en móvil, hover en desktop */}
                          <div className="flex items-center gap-0.5 flex-shrink-0 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                            <button onClick={() => togglePublic(a)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-card hover:text-ink transition" title={a.is_public ? t('Ocultar del perfil') : t('Mostrar en perfil')}>
                              {a.is_public ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => openEdit(a)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-card hover:text-ink transition" title={t('Editar')}><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(a.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-red-50 hover:text-red-500 transition" title={t('Eliminar')}><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
