'use client'

/**
 * Modal de contacto unificado. Renderiza dinámicamente los campos definidos
 * en `kennel.contact_form_config` (la config que el criador construye en
 * /kennel → "Formulario de contacto"). Compartido entre:
 *   - ContactKennelButton (perfil estándar /kennels/[slug])
 *   - HeroCtaButton (modal popup desde el hero de la web custom /c/[slug])
 *
 * Tematizado para que herede el theme activo del kennel (CSS vars).
 */
import { useEffect, useState } from 'react'
import { useT } from '@/components/i18n/locale-provider'
import { getEffectiveConfig, validateForm, type ContactFormConfig, type FormField } from '@/lib/kennel/contact-form'

type Props = {
  open: boolean
  onClose: () => void
  kennelId: string
  kennelName: string
  config?: ContactFormConfig | null
  /** Si true, viste el modal en estilo "web custom" (BMW M look: accent stripe + font display + btn-brand). */
  themed?: boolean
}

export function ContactDialog({ open, onClose, kennelId, kennelName, config: rawConfig, themed = true }: Props) {
  const t = useT()
  const config = getEffectiveConfig(rawConfig)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setValues({}); setErrors({}); setServerError(null); setDone(false); setSubmitting(false)
      }, 220)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Esc + lock scroll
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const setValue = (id: string, v: unknown) => {
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
        setServerError(data?.error || t('No se pudo enviar'))
        setSubmitting(false)
        return
      }
      setDone(true); setSubmitting(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('Error de red'))
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[modalFade_180ms_ease-out]"
    >
      <button
        type="button"
        aria-label={t('Cerrar')}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        className="relative w-full max-w-md bg-canvas border border-hairline shadow-2xl overflow-hidden animate-[modalSlide_220ms_ease-out] max-h-[90vh] flex flex-col"
        style={{ borderRadius: 'var(--button-radius, 12px)' }}
      >
        <div className="px-6 lg:px-8 py-6 border-b border-hairline">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {themed && (
                <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted mb-3">
                  <span className="text-theme-accent font-mono">01</span>
                  <span className="inline-block h-px w-8 bg-theme-accent opacity-60" />
                  {t('Contacto directo')}
                </p>
              )}
              <h2
                className="text-xl md:text-2xl font-bold text-ink tracking-[-0.02em] truncate"
                style={themed ? { fontFamily: 'var(--font-display, inherit)' } : undefined}
              >
                {config.title || `Contactar con ${kennelName}`}
              </h2>
              {config.subtitle && (
                <p className="mt-1.5 text-[13px] text-body leading-relaxed">{config.subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('Cerrar')}
              className="shrink-0 h-9 w-9 inline-flex items-center justify-center text-muted hover:text-theme-accent border border-hairline hover:border-theme-accent transition-colors"
              style={{ borderRadius: 'var(--button-radius, 8px)' }}
            >
              ✕
            </button>
          </div>
        </div>

        {done ? (
          <div className="px-6 lg:px-8 py-12 text-center">
            <div
              className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center text-2xl text-theme-accent"
              style={{ borderRadius: 'var(--button-radius, 9999px)', background: 'var(--brand-soft)' }}
            >
              ✓
            </div>
            <h3
              className="text-xl md:text-2xl font-bold text-ink mb-2"
              style={themed ? { fontFamily: 'var(--font-display, inherit)' } : undefined}
            >
              {t('¡Recibido!')}
            </h3>
            <p className="text-[14px] text-body leading-relaxed max-w-xs mx-auto">
              {config.success_message || `${kennelName} la verá en su bandeja y te responderá pronto.`}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-1.5 border border-hairline bg-canvas px-5 py-2.5 text-[12px] font-semibold text-body hover:border-theme-accent hover:text-theme-accent uppercase tracking-[0.1em] transition-colors"
              style={{ borderRadius: 'var(--button-radius, 8px)' }}
            >
              {t('Cerrar')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 px-6 lg:px-8 py-5 overflow-y-auto">
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

            <button
              type="submit"
              disabled={submitting}
              className="btn-brand w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] disabled:opacity-50 mt-2"
            >
              {submitting ? t('Enviando…') : (config.submit_label || t('Enviar'))}
              {!submitting && <span aria-hidden="true">→</span>}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes modalFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalSlide { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}

// ─── Renderer dinámico (mismo patrón que en ContactKennelButton) ──────────

function FieldRenderer({
  field, value, error, onChange,
}: {
  field: FormField
  value: unknown
  error?: string
  onChange: (v: unknown) => void
}) {
  const t = useT()
  const inputClass = `w-full px-4 py-3 text-[14px] border bg-canvas text-ink placeholder-muted/70 focus:outline-none transition-colors ${
    error ? 'border-[color:var(--error)]' : 'border-hairline focus:border-theme-accent'
  }`
  const inputStyle = { borderRadius: 'var(--button-radius, 8px)' as const }

  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {field.label}
        {field.required && <span className="text-[color:var(--error)]"> *</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows || 4}
          placeholder={field.placeholder}
          className={`${inputClass} resize-none`}
          style={inputStyle}
        />
      ) : field.type === 'select' ? (
        <select
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          style={inputStyle}
        >
          <option value="">{t('— Seleccionar —')}</option>
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
                className="h-4 w-4 accent-[color:var(--theme-accent)]"
              />
              {o}
            </label>
          ))}
        </div>
      ) : field.type === 'checkbox' ? (
        <div className="mt-1 space-y-1.5">
          {(field.options || []).map((o) => {
            const arr = Array.isArray(value) ? (value as string[]) : []
            const checked = arr.includes(o)
            return (
              <label key={o} className="flex items-center gap-2 text-[13.5px] text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(checked ? arr.filter((x) => x !== o) : [...arr, o])}
                  className="h-4 w-4 accent-[color:var(--theme-accent)]"
                />
                {o}
              </label>
            )
          })}
        </div>
      ) : (
        <input
          type={field.type}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
          style={inputStyle}
        />
      )}

      {field.helper && !error && (
        <p className="mt-1 text-[11px] text-muted">{field.helper}</p>
      )}
      {error && <p className="mt-1 text-[11px] text-[color:var(--error)]">{error}</p>}
    </div>
  )
}
