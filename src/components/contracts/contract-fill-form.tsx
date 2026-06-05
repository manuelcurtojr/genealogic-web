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

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import {
  User, Dog, SlidersHorizontal, Euro, Calendar, Building2,
  ChevronDown, ChevronUp, Check, Loader2, AlertCircle,
  Send, FileEdit, Lock, Info,
} from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import {
  getFieldSchema,
  type ContractField,
  type ContractSection,
} from '@/lib/contracts/field-schema'

type Values = Record<string, string>

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  reservationId: string
  contractId: string
  kind: 'reservation' | 'delivery'
  /** Valores iniciales — combinación de buildContractVars + template_values guardados. */
  initialValues: Values
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

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header sticky con estado de guardado + acciones ─── */}
      <div className="sticky top-0 z-10 bg-canvas/95 backdrop-blur border-b border-hairline px-1 py-2.5 mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <SaveBadge state={saveState} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!confirm(t('Cambiar a modo avanzado te permite editar el texto del contrato a mano (markdown). Una vez activado, el formulario se bloquea para evitar inconsistencias. ¿Continuar?'))) return
              onAdvancedMode()
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-canvas text-body hover:text-ink hover:border-ink/30 px-3 py-1.5 text-[12px] font-medium transition-colors"
            title={t('Edita el texto markdown directamente (avanzado)')}
          >
            <FileEdit className="h-3.5 w-3.5" />
            {t('Modo avanzado')}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink text-on-primary hover:opacity-90 px-3.5 py-1.5 text-[12.5px] font-semibold disabled:opacity-50 transition-opacity"
          >
            <Send className="h-3.5 w-3.5" />
            {t('Enviar al cliente')}
          </button>
        </div>
      </div>

      {/* Banner manual-override */}
      {manualOverride && (
        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900 flex items-start gap-2.5">
          <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{t('Modo avanzado activo')}</p>
            <p className="mt-0.5 text-amber-800">
              {t('Editaste el texto del contrato a mano. El formulario queda deshabilitado para no sobrescribir tus cambios. Cancela el contrato para volver a este modo.')}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-[13px] text-rose-900 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Secciones ─── */}
      <div className="space-y-3 flex-1 overflow-y-auto pb-4">
        {schema.map((sec) => (
          <SectionBlock
            key={sec.id}
            section={sec}
            collapsed={collapsed[sec.id]}
            onToggle={() => toggleSection(sec.id)}
            values={values}
            onChange={setValue}
            disabled={manualOverride}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Sección plegable ─────────────────────────────────────────────────────

function SectionBlock({
  section, collapsed, onToggle, values, onChange, disabled, t,
}: {
  section: ContractSection
  collapsed: boolean
  onToggle: () => void
  values: Values
  onChange: (token: string, value: string) => void
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

  return (
    <section className="rounded-xl border border-hairline bg-canvas overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-soft/50 transition-colors text-left"
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-surface-soft text-ink">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14px] text-ink">{t(section.title)}</p>
          <p className="text-[11.5px] text-muted">
            {filledCount}/{totalCount} {t('campos rellenos')}
            {isKennelInfo && ` · ${t('solo lectura')}`}
          </p>
        </div>
        {collapsed
          ? <ChevronDown className="h-4 w-4 text-muted flex-shrink-0" />
          : <ChevronUp className="h-4 w-4 text-muted flex-shrink-0" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-hairline">
          {section.hint && (
            <p className="text-[12px] text-muted leading-snug mt-3">{t(section.hint)}</p>
          )}
          {isKennelInfo && (
            <a
              href="/kennel/legal"
              className="inline-flex items-center gap-1 text-[12px] text-ink underline hover:text-[#FE6620] transition-colors"
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
  field, value, onChange, disabled, t,
}: {
  field: ContractField
  value: string
  onChange: (v: string) => void
  disabled: boolean
  t: (k: string) => string
}) {
  const id = `f-${field.token}`
  const baseClass = `w-full rounded-lg border bg-canvas px-3 py-2.5 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:bg-surface-soft disabled:text-muted disabled:cursor-not-allowed transition-colors ${
    value ? 'border-hairline' : 'border-hairline'
  } focus:border-ink/30`

  return (
    <div>
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
        <div className="relative">
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
            className={baseClass + ' pr-10'}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted pointer-events-none">€</span>
        </div>
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
      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('Guardando…')}
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-emerald-700">
        <Check className="h-3.5 w-3.5" />
        {t('Guardado')}
      </span>
    )
  }
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-rose-700">
        <AlertCircle className="h-3.5 w-3.5" />
        {t('Error al guardar')}
      </span>
    )
  }
  return (
    <span className="text-[12px] text-muted">{t('Autosave activo')}</span>
  )
}
