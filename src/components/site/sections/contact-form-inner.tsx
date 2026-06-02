'use client'

/**
 * ContactFormInner — formulario de contacto embebido en la sección
 * /c/[slug]/contacto del kennel custom site.
 *
 * HISTORIA del bug que esto arregla (2026-05-28):
 * Esta sección tenía hardcoded los campos name/email/phone/topic/message y
 * enviaba a /api/owners (endpoint privado que requiere auth → 401 para
 * visitantes anónimos). Resultado: ningún lead llegaba a los criaderos
 * cuyos clientes contactaban desde /contacto en lugar del modal popup.
 * Para Irema Curtó (que tiene `purpose` required en su contact_form_config),
 * los visitantes del custom domain iremacurto.com tampoco recibían los
 * leads desde la página /contacto. Llevaba 4 días sin recibir formularios.
 *
 * Ahora:
 *   1. Carga la config del kennel (kennels.contact_form_config) vía
 *      /api/kennel-by-slug — los mismos campos que el criador construyó.
 *   2. Renderea dinámicamente cada campo según la config (text/email/tel/
 *      textarea/select/radio/checkbox).
 *   3. Submit a /api/contact-kennel (endpoint público con rate-limit)
 *      con el mismo formato { kennel_id, values } que el modal popup.
 *
 * Comparte el helper de validación con el modal (lib/kennel/contact-form),
 * así una sola fuente de verdad para front+back. El props `topics` y
 * `success_message` se ignoran ahora — la config del kennel manda. Se
 * mantiene la firma del componente para no romper imports.
 */
import { useEffect, useState } from 'react'
import { useT } from '@/components/i18n/locale-provider'
import {
  getEffectiveConfig,
  validateForm,
  type ContactFormConfig,
  type FormField,
} from '@/lib/kennel/contact-form'

export default function ContactFormInner({
  success_message: legacySuccessMessage,
}: {
  topics?: string[]              // legacy, ignorado (la config del kennel manda)
  success_message?: string        // legacy fallback si la config no tiene success_message
}) {
  const t = useT()
  const [kennelId, setKennelId] = useState<string | null>(null)
  const [config, setConfig] = useState<ContactFormConfig | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Resolver kennel y su config al montar.
  //   · Si la URL es /c/<slug>/... (genealogic.io) → pasamos slug query
  //   · Si la URL es iremacurto.com/... (custom domain) → no pasamos slug,
  //     el endpoint resolverá por host
  useEffect(() => {
    if (typeof window === 'undefined') return
    const seg = window.location.pathname.split('/')
    let slugParam = ''
    if (seg[1] === 'c' && seg[2]) {
      slugParam = `?slug=${encodeURIComponent(seg[2])}`
    }
    fetch(`/api/kennel-by-slug${slugParam}`)
      .then(r => r.json())
      .then(d => {
        if (d.kennel?.id) {
          setKennelId(d.kennel.id)
          setConfig(getEffectiveConfig(d.kennel.contact_form_config))
        }
      })
      .catch(() => {})
  }, [])

  const setValue = (id: string, v: unknown) => {
    setValues((prev) => ({ ...prev, [id]: v }))
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!kennelId || !config) {
      setServerError(t('Cargando criadero…'))
      return
    }
    // Validación local — misma función que el backend para evitar
    // discrepancias.
    const { errors: errs, ok } = validateForm(config, values)
    if (!ok) {
      setErrors(errs)
      return
    }
    setLoading(true)
    setServerError(null)
    try {
      const res = await fetch('/api/contact-kennel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId, values }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setServerError(data?.error || t('No se pudo enviar'))
        if (data?.fields) setErrors(data.fields)
        return
      }
      setSent(true)
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : t('Error de red'))
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de éxito
  if (sent) {
    return (
      <div className="text-center py-6">
        <div
          className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center text-2xl text-theme-accent"
          style={{ borderRadius: 'var(--button-radius, 999px)', background: 'var(--brand-soft)' }}
        >
          ✓
        </div>
        <h2
          className="text-2xl md:text-3xl font-bold text-ink mb-3 tracking-tight"
          style={{ fontFamily: 'var(--font-display, inherit)' }}
        >
          {t('¡Recibido!')}
        </h2>
        <p className="text-body leading-relaxed">
          {config?.success_message
            || legacySuccessMessage
            || t('Tu mensaje ha llegado al criador. Te responderá personalmente lo antes posible.')}
        </p>
      </div>
    )
  }

  // Loading inicial — mientras carga la config
  if (!config) {
    return (
      <div className="text-center py-10 text-muted text-sm">{t('Cargando formulario…')}</div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
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
        <p className="text-sm text-[color:var(--error)]">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-brand w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] disabled:opacity-50"
      >
        {loading ? t('Enviando…') : (config.submit_label || t('Enviar mensaje'))}
        {!loading && <span aria-hidden="true">→</span>}
      </button>
    </form>
  )
}

/**
 * FieldRenderer — mismo patrón que ContactDialog (modal popup). Mantenidos
 * en archivos separados porque el modal lleva animaciones + estilo dark
 * theme y este form vive embebido en la sección /contacto donde la página
 * aporta el contexto visual (hero, intro, etc).
 */
function FieldRenderer({
  field, value, error, onChange,
}: {
  field: FormField
  value: unknown
  error?: string
  onChange: (v: unknown) => void
}) {
  const t = useT()
  const inputClass = `w-full px-4 py-3 text-sm border bg-canvas text-ink placeholder-muted/70 focus:outline-none transition-colors ${
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
