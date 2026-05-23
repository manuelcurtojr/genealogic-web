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
  variant?: 'primary' | 'light'
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

  const triggerClass =
    variant === 'light'
      ? 'inline-flex items-center gap-1.5 rounded-md bg-white text-ink shadow-sm ring-1 ring-black/10 px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-white/95'
      : 'inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-[12px] font-medium text-on-primary transition-colors hover:opacity-90'

  return (
    <>
      <button onClick={() => setOpen(true)} className={triggerClass}>
        <Send className="h-3.5 w-3.5" />
        Solicitudes
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={close}>
          <div
            className="w-full max-w-md rounded-2xl bg-canvas shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-canvas px-5 py-4">
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
                  {config.title || `Contactar con ${kennelName}`}
                </h2>
                <p className="mt-0.5 text-[12px] text-muted">
                  {config.subtitle || 'Tu mensaje llegará directamente al criador.'}
                </p>
              </div>
              <button
                onClick={close}
                className="rounded-lg p-1 text-muted hover:bg-surface-soft hover:text-ink"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="mt-4 text-[15px] font-semibold text-ink">¡Enviado!</p>
                <p className="mt-1 text-[13px] text-body">
                  {config.success_message || `${kennelName} la verá en su bandeja y te responderá pronto.`}
                </p>
                <button
                  onClick={close}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-medium text-body hover:bg-surface-soft"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
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
                  <div className="rounded-lg bg-[color:var(--error)]/10 px-3 py-2 text-[12.5px] text-[color:var(--error)]">
                    {serverError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-medium text-body hover:bg-surface-soft"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {config.submit_label || 'Enviar'}
                  </button>
                </div>
              </form>
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
