'use client'

import { useState } from 'react'
import { Send, X, Loader2, Check } from 'lucide-react'
import { getEffectiveConfig, validateForm, type ContactFormConfig, type FormField } from '@/lib/kennel/contact-form'

interface Props {
  kennelId: string
  kennelName: string
  /** Config del form publicado del kennel. Si null, usa TEMPLATE_GENERIC. */
  config?: ContactFormConfig | null
  /** Estilo del botón trigger. Por defecto: 'primary' (negro). 'light' usa fondo claro para webs custom. */
  variant?: 'primary' | 'light' | 'sticky-mobile'
}

/**
 * Botón "Solicitudes" + modal con el formulario CONFIGURABLE del criador.
 * Renderiza dinámicamente los campos definidos en kennels.contact_form_config.
 * Mismo componente en /kennels/[slug] (perfil) y /c/[slug] (web custom).
 */
export default function ContactKennelButton({ kennelId, kennelName, config: rawConfig, variant = 'primary' }: Props) {
  const config = getEffectiveConfig(rawConfig)

  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const reset = () => {
    setValues({}); setErrors({}); setServerError(null); setDone(false); setSubmitting(false)
  }
  const close = () => { setOpen(false); setTimeout(reset, 200) }

  const setValue = (id: string, v: any) => {
    setValues((prev) => ({ ...prev, [id]: v }))
    if (errors[id]) setErrors((prev) => { const next = { ...prev }; delete next[id]; return next })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    const { errors: errs, ok } = validateForm(config, values)
    if (!ok) { setErrors(errs); return }

    setSubmitting(true); setServerError(null)
    try {
      const res = await fetch('/api/contact-kennel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId, values }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setServerError(data?.error || 'No se pudo enviar')
        setSubmitting(false)
        return
      }
      setDone(true); setSubmitting(false)
    } catch (err: any) {
      setServerError(err.message || 'Error de red')
      setSubmitting(false)
    }
  }

  // Estilo del trigger:
  //  - 'primary' (default): fondo ink + texto blanco — igual peso visual
  //    que el botón "Ver nuestros perros" pero invertido para destacar
  //    como CTA principal en el hero y la sección contacto.
  //  - 'light': fondo blanco + ink (versión sobre fondos oscuros como
  //    webs custom con tema BMW etc).
  const triggerClass =
    variant === 'light'
      ? 'inline-flex items-center gap-1.5 rounded-xl bg-white text-ink shadow-sm ring-1 ring-black/10 px-4 py-2.5 text-[13.5px] font-bold transition hover:bg-white/95'
      : variant === 'sticky-mobile'
        // Full-width para el dock flotante en mobile
        ? 'flex w-full items-center justify-center gap-1.5 rounded-full bg-ink text-on-primary px-5 py-3 text-[14px] font-bold transition hover:opacity-90 shadow-[0_4px_16px_rgba(0,0,0,0.18)]'
        : 'inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2.5 text-[13.5px] font-bold transition hover:opacity-90'

  return (
    <>
      <button onClick={() => setOpen(true)} className={triggerClass}>
        <Send className="h-3.5 w-3.5" />
        Pedir información
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={close}
        >
          <div
            className="w-full sm:max-w-lg bg-canvas rounded-t-3xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-hairline max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle mobile */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-1">
              <div className="h-1 w-10 rounded-full bg-hairline" />
            </div>
            <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-4 sm:pt-6 pb-4">
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#FE6620]">
                  Pedir información
                </p>
                <h2 className="mt-1 text-[18px] sm:text-[20px] font-semibold tracking-[-0.025em] text-ink leading-snug">
                  {config.title || `Contacta con ${kennelName}`}
                </h2>
                <p className="mt-1.5 text-[13px] text-body leading-snug max-w-prose">
                  {config.subtitle || 'Cuéntanos qué buscas y te respondemos en breve. Sin compromiso.'}
                </p>
              </div>
              <button
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-soft hover:text-ink flex-shrink-0"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">

            {done ? (
              <div className="px-5 sm:px-6 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <Check className="h-7 w-7 text-emerald-700" strokeWidth={2.5} />
                </div>
                <p className="mt-4 text-[17px] font-semibold text-ink">¡Enviado!</p>
                <p className="mt-1.5 text-[13.5px] text-body max-w-sm mx-auto leading-snug">
                  {config.success_message || `${kennelName} verá tu mensaje y te responderá en breve.`}
                </p>
                <button
                  onClick={close}
                  className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-[13px] font-bold text-on-primary hover:opacity-90 transition"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form id="kennel-contact-form" onSubmit={handleSubmit} className="space-y-4 px-5 sm:px-6 pb-2">
                {config.fields.map((field) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    value={values[field.id]}
                    error={errors[field.id]}
                    onChange={(v) => setValue(field.id, v)}
                  />
                ))}

                {serverError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12.5px] text-red-700">
                    {serverError}
                  </div>
                )}
              </form>
            )}
            </div>{/* /flex-1 overflow */}

            {/* Footer sticky con CTAs — solo en modo form */}
            {!done && (
              <div className="border-t border-hairline bg-surface-soft px-5 sm:px-6 py-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg px-3.5 py-2 text-[13px] font-semibold text-body hover:text-ink transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="kennel-contact-form"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-[13px] font-bold text-on-primary hover:opacity-90 disabled:opacity-40 transition"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {submitting ? 'Enviando…' : (config.submit_label || 'Enviar')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Renderer para un campo individual ────────────────────────────────

function FieldRenderer({
  field, value, error, onChange,
}: {
  field: FormField; value: any; error?: string; onChange: (v: any) => void
}) {
  const baseInput =
    'w-full rounded-lg border bg-canvas px-3 py-2 text-[14px] text-ink focus:outline-none transition-colors'
  const inputCls = `${baseInput} ${
    error ? 'border-[color:var(--error)] focus:border-[color:var(--error)]' : 'border-hairline focus:border-ink'
  }`

  return (
    <div>
      <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
        {field.label}
        {field.required && <span className="text-rose-600"> *</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows || 4}
          placeholder={field.placeholder}
          className={`${inputCls} resize-none`}
        />
      ) : field.type === 'select' ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        >
          <option value="">— Seleccionar —</option>
          {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === 'radio' ? (
        <div className="mt-1 space-y-1.5">
          {(field.options || []).map((o) => (
            <label key={o} className="flex items-center gap-2 text-[13.5px] text-ink cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value={o}
                checked={value === o}
                onChange={() => onChange(o)}
                className="h-4 w-4"
              />
              {o}
            </label>
          ))}
        </div>
      ) : field.type === 'checkbox' ? (
        <div className="mt-1 space-y-1.5">
          {(field.options || []).map((o) => {
            const arr = Array.isArray(value) ? value : []
            const checked = arr.includes(o)
            return (
              <label key={o} className="flex items-center gap-2 text-[13.5px] text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(checked ? arr.filter((x: string) => x !== o) : [...arr, o])}
                  className="h-4 w-4 rounded"
                />
                {o}
              </label>
            )
          })}
        </div>
      ) : (
        <input
          type={field.type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputCls}
        />
      )}

      {field.helper && !error && (
        <p className="mt-1 text-[11.5px] text-muted">{field.helper}</p>
      )}
      {error && <p className="mt-1 text-[11.5px] text-[color:var(--error)]">{error}</p>}
    </div>
  )
}
