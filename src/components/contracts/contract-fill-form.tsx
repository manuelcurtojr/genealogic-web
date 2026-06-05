'use client'

/**
 * ContractFillForm — formulario izquierda del fill-form de contratos.
 *
 * Sustituye al editor de markdown que estaba antes en /reservas/[id]/contrato.
 * El criador rellena campos agrupados por sección; cada cambio pushea un
 * autosave debounced que regenera el body del contrato del lado server.
 *
 * Diseño:
 *  - Header sticky con título del contrato + indicador "Guardado/Guardando"
 *  - Secciones plegables (colapsadas por defecto las menos importantes)
 *  - Inputs grandes en móvil (text-base) para evitar zoom auto de iOS
 *  - Sección "Datos del criadero" es read-only (info), con link a settings
 *  - Modo avanzado: link "Editar texto a mano" que dispara onAdvancedMode
 *
 * Se comunica con el preview vía el callback `onValuesChange` — el padre
 * (ContractFillPanel) tiene los dos componentes y pasa los valores en
 * tiempo real, sin esperar al server.
 */

import { useState, useEffect, useRef, useCallback, useTransition, useMemo } from 'react'
import {
  User, Dog, SlidersHorizontal, Euro, Calendar, Building2,
  ChevronDown, ChevronUp, Check, Loader2, AlertCircle,
  Send, FileEdit, Lock, Info, Search, X,
} from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import {
  getFieldSchema,
  type ContractField,
  type ContractSection,
} from '@/lib/contracts/field-schema'
import type { BreedOption } from './contract-fill-panel'

type Values = Record<string, string>

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  reservationId: string
  contractId: string
  kind: 'reservation' | 'delivery'
  /** Valores iniciales — combinación de buildContractVars + template_values guardados. */
  initialValues: Values
  /** Catálogo de razas + colores por raza. Server-loaded via prop drilling
   *  desde la page; el form solo lee, no hace fetch. */
  breedOptions: BreedOption[]
  /** Si true, deshabilita los inputs (porque el criador usó "modo avanzado"
   *  y editó el markdown — ya no podemos garantizar consistencia). */
  manualOverride: boolean
  onValuesChange?: (values: Values) => void
  /** Server action para guardar valores. */
  onSaveAction: (
    reservationId: string,
    contractId: string,
    values: Values,
  ) => Promise<{ ok: true; bodyHtml: string } | { ok: false; error: string }>
  /** Server action para enviar al cliente. */
  onSendAction: (
    reservationId: string,
    contractId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  /** Server action para borrar template_values y entrar en modo avanzado
   *  markdown. */
  onAdvancedMode: () => void
}

const AUTOSAVE_MS = 1200

const ICONS = {
  user: User,
  dog: Dog,
  sliders: SlidersHorizontal,
  euro: Euro,
  calendar: Calendar,
  building: Building2,
} as const

export default function ContractFillForm({
  reservationId,
  contractId,
  kind,
  initialValues,
  breedOptions,
  manualOverride,
  onValuesChange,
  onSaveAction,
  onSendAction,
  onAdvancedMode,
}: Props) {
  const t = useT()
  const [values, setValues] = useState<Values>(initialValues)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>(JSON.stringify(initialValues))
  const schema = getFieldSchema(kind)

  // Secciones colapsadas por defecto: kennel-info (read-only) + las menos
  // críticas. Las importantes (client, money, puppy si delivery) abiertas.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const s of schema) {
      init[s.id] = s.id === 'kennel-info' || s.id === 'dates' || s.id === 'prefs'
    }
    return init
  })

  // Notify preview on every value change (no debounce, sincronía visual)
  useEffect(() => {
    onValuesChange?.(values)
  }, [values, onValuesChange])

  // Autosave debounced
  const doSave = useCallback(
    (next: Values) => {
      const serialized = JSON.stringify(next)
      if (serialized === lastSavedRef.current) return
      setSaveState('saving')
      setError(null)
      startTransition(async () => {
        const res = await onSaveAction(reservationId, contractId, next)
        if (res.ok) {
          lastSavedRef.current = serialized
          setSaveState('saved')
          setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1800)
        } else {
          setSaveState('error')
          setError(res.error)
        }
      })
    },
    [onSaveAction, reservationId, contractId],
  )

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSave(values), AUTOSAVE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [values, doSave])

  // Auto-calcular finalAmount cuando cambian total o señal
  useEffect(() => {
    const total = parseFloat(values.totalPrice || '')
    const dep = parseFloat(values.depositAmount || '')
    if (!isNaN(total) && !isNaN(dep) && total >= dep) {
      const final = (total - dep).toFixed(2).replace(/\.00$/, '')
      if (values.finalAmount !== final) {
        setValues((v) => ({ ...v, finalAmount: final }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.totalPrice, values.depositAmount])

  function setValue(token: string, value: string) {
    setValues((v) => ({ ...v, [token]: value }))
  }

  function toggleSection(id: string) {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }))
  }

  // Validar required al "Enviar al cliente"
  function getMissingRequired(): string[] {
    const missing: string[] = []
    for (const sec of schema) {
      for (const f of sec.fields) {
        if (!f.required) continue
        if (f.from === 'kennel') continue // kennel info no se rellena aquí
        const v = values[f.token]
        if (!v || String(v).trim() === '') missing.push(f.label)
      }
    }
    return missing
  }

  function handleSend() {
    const missing = getMissingRequired()
    if (missing.length > 0) {
      alert(
        t('Faltan campos obligatorios:') + '\n\n• ' + missing.join('\n• ') +
        '\n\n' + t('Rellénalos antes de enviar el contrato al cliente.'),
      )
      return
    }
    if (!confirm(t('¿Enviar el contrato al cliente? Después de enviar no podrás editar los campos (sí puedes cancelar y volver a editar).'))) return
    setError(null)
    startTransition(async () => {
      // Guarda primero por si hay cambios pendientes
      await onSaveAction(reservationId, contractId, values)
      const res = await onSendAction(reservationId, contractId)
      if (!res.ok) setError(res.error)
    })
  }

  // Conteo total para badge de progreso en el header
  const totalFields = schema.reduce((n, s) =>
    n + s.fields.filter((f) => f.from !== 'kennel' && f.from !== 'auto').length, 0)
  const filledTotal = schema.reduce((n, s) =>
    n + s.fields.filter((f) => {
      if (f.from === 'kennel' || f.from === 'auto') return false
      const v = values[f.token]
      return v != null && String(v).trim() !== ''
    }).length, 0)
  const progressPct = totalFields > 0 ? Math.round((filledTotal / totalFields) * 100) : 0

  return (
    <div className="flex flex-col min-w-0">
      {/* ─── Header sticky con estado de guardado + acciones ─── */}
      <div className="sticky top-0 z-10 bg-canvas border-b border-hairline px-4 sm:px-5 py-3 min-w-0">
        <div className="flex items-center justify-between gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ProgressRing pct={progressPct} />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink leading-tight">{t('Formulario')}</p>
              <SaveBadge state={saveState} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!confirm(t('Cambiar a modo avanzado te permite editar el texto del contrato a mano (markdown). Una vez activado, el formulario se bloquea para evitar inconsistencias. ¿Continuar?'))) return
                onAdvancedMode()
              }}
              className="inline-flex items-center gap-1.5 rounded-lg text-body hover:text-ink hover:bg-surface-soft px-2.5 py-1.5 text-[12px] font-medium transition-colors"
              title={t('Edita el texto markdown directamente (avanzado)')}
            >
              <FileEdit className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('Avanzado')}</span>
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary hover:opacity-90 px-3 py-1.5 text-[12.5px] font-semibold disabled:opacity-50 transition-opacity"
            >
              <Send className="h-3.5 w-3.5" />
              {t('Enviar')}
            </button>
          </div>
        </div>
      </div>

      {/* Banners */}
      {(manualOverride || error) && (
        <div className="px-4 sm:px-5 pt-3 space-y-2 min-w-0">
          {manualOverride && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-900 flex items-start gap-2 min-w-0">
              <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{t('Modo avanzado activo')}</p>
                <p className="mt-0.5 text-amber-800">
                  {t('Cancela el contrato para volver al formulario.')}
                </p>
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2.5 text-[12.5px] text-rose-900 flex items-start gap-2 min-w-0">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="min-w-0 break-words">{error}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── Secciones (el scroll lo gestiona el wrapper en ContractFillPanel) ─── */}
      <div className="px-4 sm:px-5 py-4 space-y-2 min-w-0">
        {schema.map((sec) => (
          <SectionBlock
            key={sec.id}
            section={sec}
            collapsed={collapsed[sec.id]}
            onToggle={() => toggleSection(sec.id)}
            values={values}
            onChange={setValue}
            breedOptions={breedOptions}
            disabled={manualOverride}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}

// ─── BreedCombobox ────────────────────────────────────────────────────────
// Typeahead sencillo sobre el catálogo de razas. Sin lib externa: input +
// dropdown filtrado. Guarda el NOMBRE (no el id) porque la plantilla
// interpola `{{breed}}` como string.
function BreedCombobox({
  id, value, options, disabled, placeholder, onChange, t,
}: {
  id: string
  value: string
  options: BreedOption[]
  disabled: boolean
  placeholder: string
  onChange: (name: string) => void
  t: (k: string) => string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Sincroniza el input visible si el value cambia desde fuera (reset al
  // cambiar de raza, restore de saved values, etc.).
  useEffect(() => { setQuery(value) }, [value])

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  const filtered = useMemo(() => {
    const q = norm(query.trim())
    if (!q) return options.slice(0, 80)
    return options
      .filter((o) => norm(o.name).includes(q))
      .slice(0, 80)
  }, [query, options])

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <div className={`flex items-center min-w-0 rounded-lg border border-hairline bg-canvas focus-within:ring-2 focus-within:ring-ink/10 focus-within:border-ink/30 transition-colors ${disabled ? 'bg-surface-soft' : ''}`}>
        <Search className="h-4 w-4 text-muted ml-3 flex-shrink-0" />
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => !disabled && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent px-2.5 py-2.5 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none disabled:text-muted disabled:cursor-not-allowed"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => { onChange(''); setQuery(''); setOpen(false) }}
            className="px-2 text-muted hover:text-ink"
            aria-label={t('Quitar selección')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && !disabled && (
        <div className="absolute z-20 mt-1 left-0 right-0 max-h-60 overflow-y-auto rounded-lg border border-hairline bg-canvas shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-[12.5px] text-muted">{t('Sin resultados')}</div>
          ) : (
            <ul className="py-1">
              {filtered.map((o) => {
                const selected = o.name === value
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(o.name); setQuery(o.name); setOpen(false) }}
                      className={`w-full text-left px-3 py-2 text-[13.5px] flex items-center justify-between gap-2 transition-colors ${
                        selected ? 'bg-surface-soft text-ink font-semibold' : 'text-body hover:bg-surface-soft/60'
                      }`}
                    >
                      <span className="truncate">{o.name}</span>
                      {selected && <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ColorMultiSelect ─────────────────────────────────────────────────────
// Multi-select de colores filtrado por la raza actual. Guarda el resultado
// como string CSV ("Bardino, atigrado") para que el contrato lo interpole
// directo. Si no hay raza seleccionada, muestra hint.
function ColorMultiSelect({
  value, breedName, options, disabled, onChange, t,
}: {
  value: string
  breedName: string
  options: BreedOption[]
  disabled: boolean
  onChange: (csv: string) => void
  t: (k: string) => string
}) {
  // Colores de la raza actual
  const breed = useMemo(
    () => options.find((o) => o.name === breedName) || null,
    [options, breedName],
  )
  const breedColors = breed?.colors || []

  // Valor actual como array de nombres
  const selected = useMemo(() => {
    return value
      ? value.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  }, [value])

  function toggle(name: string) {
    const lower = name.toLowerCase()
    const isSelected = selected.some((s) => s.toLowerCase() === lower)
    const next = isSelected
      ? selected.filter((s) => s.toLowerCase() !== lower)
      : [...selected, name]
    onChange(next.join(', '))
  }

  if (!breedName) {
    return (
      <div className="rounded-lg border border-dashed border-hairline bg-surface-soft/40 px-3 py-4 text-[12.5px] text-muted text-center">
        {t('Selecciona una raza arriba para ver los colores disponibles')}
      </div>
    )
  }

  if (breedColors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-hairline bg-surface-soft/40 px-3 py-4 text-[12.5px] text-muted text-center">
        {t('Esta raza no tiene colores catalogados — escríbelos a mano:')}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={t('Ej: bardino, leonado…')}
          className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-[13px] text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30"
        />
      </div>
    )
  }

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex flex-wrap gap-1.5">
        {breedColors.map((c) => {
          const isSel = selected.some((s) => s.toLowerCase() === c.name.toLowerCase())
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => !disabled && toggle(c.name)}
              disabled={disabled}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isSel
                  ? 'border-ink bg-ink text-on-primary'
                  : 'border-hairline bg-canvas text-body hover:border-ink/40 hover:bg-surface-soft/60'
              }`}
            >
              {c.hex_code && (
                <span
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10 flex-shrink-0"
                  style={{ backgroundColor: c.hex_code }}
                  aria-hidden
                />
              )}
              <span className="truncate">{c.name}</span>
              {isSel && <Check className="h-3 w-3 flex-shrink-0" />}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-[11px] text-muted">
          {t('Seleccionados')}: <span className="text-ink font-medium">{selected.join(', ')}</span>
        </p>
      )}
    </div>
  )
}

/** Ring de progreso pequeño (28x28). Visual de cuántos campos faltan. */
function ProgressRing({ pct }: { pct: number }) {
  const radius = 12
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const color = pct >= 100 ? '#10b981' : pct >= 50 ? '#FE6620' : '#9ca3af'
  return (
    <div className="relative flex-shrink-0">
      <svg width={28} height={28} className="-rotate-90">
        <circle cx={14} cy={14} r={radius} stroke="#e5e7eb" strokeWidth={2.5} fill="none" />
        <circle
          cx={14} cy={14} r={radius}
          stroke={color}
          strokeWidth={2.5}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 250ms ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-ink">
        {pct}
      </span>
    </div>
  )
}

// ─── Sección plegable ─────────────────────────────────────────────────────

function SectionBlock({
  section, collapsed, onToggle, values, onChange, breedOptions, disabled, t,
}: {
  section: ContractSection
  collapsed: boolean
  onToggle: () => void
  values: Values
  onChange: (token: string, value: string) => void
  breedOptions: BreedOption[]
  disabled: boolean
  t: (k: string) => string
}) {
  const Icon = section.icon ? ICONS[section.icon] : Info
  const isKennelInfo = section.id === 'kennel-info'

  // Conteo de campos rellenos vs total (visible aunque esté colapsada)
  const filledCount = section.fields.filter((f) => {
    const v = values[f.token]
    return v != null && String(v).trim() !== ''
  }).length
  const totalCount = section.fields.length

  // Completitud visual: full / parcial / vacío
  const completionTone =
    filledCount === totalCount
      ? 'emerald'
      : filledCount > 0
      ? 'amber'
      : 'muted'

  return (
    <section className={`rounded-xl bg-surface-soft/40 transition-colors overflow-hidden min-w-0 ${
      !collapsed ? 'ring-1 ring-hairline' : 'hover:bg-surface-soft/70'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left min-w-0"
      >
        <div className={`flex items-center justify-center h-8 w-8 rounded-lg flex-shrink-0 ${
          completionTone === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
          completionTone === 'amber' ? 'bg-amber-100 text-amber-700' :
          'bg-canvas text-muted border border-hairline'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13.5px] text-ink truncate">{t(section.title)}</p>
          <p className="text-[11px] text-muted">
            {filledCount}/{totalCount} {t('rellenos')}
            {isKennelInfo && ` · ${t('solo lectura')}`}
          </p>
        </div>
        {collapsed
          ? <ChevronDown className="h-4 w-4 text-muted flex-shrink-0" />
          : <ChevronUp className="h-4 w-4 text-muted flex-shrink-0" />}
      </button>

      {!collapsed && (
        <div className="px-3.5 pb-4 pt-1 space-y-3 min-w-0">
          {section.hint && (
            <p className="text-[11.5px] text-muted leading-snug mt-2 px-0.5">{t(section.hint)}</p>
          )}
          {isKennelInfo && (
            <a
              href="/kennel/legal"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-ink hover:text-[#FE6620] transition-colors"
            >
              {t('Editar datos legales del criadero')} →
            </a>
          )}
          {section.fields.map((field) => (
            <FieldInput
              key={field.token}
              field={field}
              value={values[field.token] || ''}
              onChange={(v) => onChange(field.token, v)}
              currentBreedName={values.breed || ''}
              breedOptions={breedOptions}
              onBreedChange={(breedName) => {
                // Al cambiar la raza, RESETEA el color (los colores
                // disponibles cambian con la raza).
                onChange('breed', breedName)
                if (values.color) onChange('color', '')
              }}
              disabled={disabled || isKennelInfo || field.from === 'auto'}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Input individual ─────────────────────────────────────────────────────

function FieldInput({
  field, value, onChange, currentBreedName, breedOptions, onBreedChange, disabled, t,
}: {
  field: ContractField
  value: string
  onChange: (v: string) => void
  /** Nombre de la raza actualmente seleccionada (values.breed). Lo necesita
   *  el color-multi para filtrar opciones. */
  currentBreedName: string
  breedOptions: BreedOption[]
  /** Handler especial para el breed-select que también resetea el color. */
  onBreedChange: (breedName: string) => void
  disabled: boolean
  t: (k: string) => string
}) {
  const id = `f-${field.token}`
  const baseClass = 'w-full min-w-0 rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 disabled:bg-surface-soft disabled:text-muted disabled:cursor-not-allowed transition-colors'

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block mb-1 text-[12px] font-medium text-body">
        {t(field.label)}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ? t(field.placeholder) : undefined}
          disabled={disabled}
          rows={2}
          className={baseClass + ' resize-y min-h-[68px]'}
        />
      ) : field.type === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={baseClass}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{t(opt.label)}</option>
          ))}
        </select>
      ) : field.type === 'currency' ? (
        // Layout flex con el € como add-on a la derecha, NO absolute. Así
        // el value y el símbolo no se pisan en widths pequeños y el wrapper
        // respeta su contenedor (min-w-0).
        <div className={`flex items-stretch min-w-0 rounded-lg border border-hairline bg-canvas overflow-hidden focus-within:ring-2 focus-within:ring-ink/10 focus-within:border-ink/30 transition-colors ${disabled ? 'bg-surface-soft' : ''}`}>
          <input
            id={id}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none disabled:text-muted disabled:cursor-not-allowed"
          />
          <span className="flex items-center px-3 text-[13px] text-muted border-l border-hairline bg-surface-soft/50 select-none">€</span>
        </div>
      ) : field.type === 'breed-select' ? (
        <BreedCombobox
          id={id}
          value={value}
          options={breedOptions}
          disabled={disabled}
          placeholder={field.placeholder ? t(field.placeholder) : t('Busca una raza…')}
          onChange={onBreedChange}
          t={t}
        />
      ) : field.type === 'color-multi' ? (
        <ColorMultiSelect
          value={value}
          breedName={currentBreedName}
          options={breedOptions}
          disabled={disabled}
          onChange={onChange}
          t={t}
        />
      ) : (
        <input
          id={id}
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ? t(field.placeholder) : undefined}
          disabled={disabled}
          className={baseClass}
        />
      )}

      {field.help && (
        <p className="mt-1 text-[11px] text-muted leading-snug">{t(field.help)}</p>
      )}
    </div>
  )
}

// ─── Badge de estado de guardado ──────────────────────────────────────────

function SaveBadge({ state }: { state: SaveState }) {
  const t = useT()
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t('Guardando…')}
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
        <Check className="h-3 w-3" />
        {t('Guardado')}
      </span>
    )
  }
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-rose-700">
        <AlertCircle className="h-3 w-3" />
        {t('Error al guardar')}
      </span>
    )
  }
  return (
    <span className="text-[11px] text-muted">{t('Autosave activo')}</span>
  )
}
