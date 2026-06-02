'use client'

/**
 * ReportDialog — diálogo de "Reportar contenido" reutilizable.
 *
 * Mecanismo de notice-and-action exigido por:
 *  - Art. 16-17 LSSI-CE (España)
 *  - Art. 14 DSA (UE)
 *  - Art. 17 LPI (copyright)
 *  - Art. 17 RGPD (datos personales)
 *
 * Acepta reportes anónimos (titulares de derechos que no son usuarios) y de
 * usuarios logueados. La validación de campos vive en /api/reports.
 *
 * Uso:
 *   <ReportButton
 *     targetType="dog"
 *     targetId={dog.id}
 *     targetUrl={`/dogs/${dog.slug}`}
 *     targetLabel={dog.name}
 *   />
 */

import { useState } from 'react'
import { Flag, Loader2, Check } from 'lucide-react'
import Modal from '@/components/ui/modal'
import { useT } from '@/components/i18n/locale-provider'

export type ReportTargetType =
  | 'dog' | 'photo' | 'kennel' | 'user' | 'comment'
  | 'message' | 'litter' | 'other'

export type ReportReason =
  | 'copyright' | 'personal_data' | 'inaccurate' | 'inappropriate'
  | 'impersonation' | 'animal_welfare' | 'duplicate' | 'other'

interface Props {
  targetType: ReportTargetType
  targetId: string
  targetUrl?: string | null
  targetLabel?: string | null
  /** Si está logueado, el endpoint usa la sesión; si no, pide email. */
  currentUserEmail?: string | null
  /** Estilo del botón disparador. Default: "icon" pequeño y discreto. */
  trigger?: 'icon' | 'text' | 'menu-item'
  className?: string
}

const REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'copyright',     label: 'Infracción de copyright',    hint: 'Foto, texto u otro contenido sin permiso del titular' },
  { value: 'personal_data', label: 'Datos personales (RGPD)',    hint: 'Aparezco yo / un tercero sin haber dado consentimiento' },
  { value: 'inaccurate',    label: 'Información incorrecta',     hint: 'Datos del perro, genealogía o criadero erróneos' },
  { value: 'impersonation', label: 'Suplantación de identidad',  hint: 'Alguien se hace pasar por otro criador / propietario' },
  { value: 'inappropriate', label: 'Contenido inapropiado',      hint: 'Ofensivo, ilegal o discriminatorio' },
  { value: 'animal_welfare',label: 'Bienestar animal',           hint: 'Contenido relacionado con maltrato o cría irresponsable' },
  { value: 'duplicate',     label: 'Duplicado',                  hint: 'Este perro ya existe en la plataforma' },
  { value: 'other',         label: 'Otro',                       hint: 'Cualquier otro motivo' },
]

export default function ReportButton({
  targetType,
  targetId,
  targetUrl,
  targetLabel,
  currentUserEmail,
  trigger = 'icon',
  className,
}: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState(currentUserEmail || '')
  const [name, setName] = useState('')
  const [isRightsHolder, setIsRightsHolder] = useState(false)
  const [declaration, setDeclaration] = useState(false)
  const [contactInfo, setContactInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const isCopyright = reason === 'copyright'
  const needsEmail = !currentUserEmail
  const canSubmit =
    !!reason &&
    description.trim().length >= 10 &&
    (currentUserEmail || (email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) &&
    (!isCopyright || !isRightsHolder || declaration)

  function reset() {
    setReason('')
    setDescription('')
    setName('')
    setIsRightsHolder(false)
    setDeclaration(false)
    setContactInfo('')
    setSubmitted(false)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          targetUrl: targetUrl || (typeof window !== 'undefined' ? window.location.pathname : null),
          reason,
          description: description.trim(),
          reporterEmail: email.trim() || undefined,
          reporterName: name.trim() || undefined,
          isRightsHolder,
          rightsHolderDeclaration: declaration,
          contactInfo: contactInfo.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'No se pudo enviar el reporte')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    if (submitting) return
    setOpen(false)
    // Reset suave después del cierre para que el usuario no vea el flicker
    setTimeout(reset, 300)
  }

  return (
    <>
      {trigger === 'icon' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('Reportar contenido')}
          title={t('Reportar contenido')}
          className={
            className ||
            'inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60'
          }
        >
          <Flag className="h-4 w-4" />
        </button>
      )}
      {trigger === 'text' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            className ||
            'inline-flex items-center gap-1.5 text-[12px] font-medium text-muted underline-offset-4 transition hover:text-ink hover:underline'
          }
        >
          <Flag className="h-3 w-3" />
          {t('Reportar')}
        </button>
      )}
      {trigger === 'menu-item' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            className ||
            'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-body transition hover:bg-surface-soft'
          }
        >
          <Flag className="h-4 w-4" />
          {t('Reportar contenido')}
        </button>
      )}

      <Modal open={open} onClose={handleClose} title={submitted ? t('Reporte enviado') : t('Reportar contenido')}>
        {submitted ? (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-ink">{t('Hemos recibido tu reporte')}</p>
              <p className="mt-2 text-sm text-body">
                {t('Lo revisaremos en un plazo máximo de')} <strong>{t('72 horas')}</strong> {t('conforme al art. 17 LSSI y, si procede, retiraremos o anonimizaremos el contenido. Si dejaste tu email, te contactaremos al resolverlo.')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-on-primary hover:opacity-90"
            >
              {t('Cerrar')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {targetLabel && (
              <div className="rounded-lg bg-surface-soft px-3 py-2 text-[13px] text-body">
                {t('Reportando:')} <strong className="text-ink">{targetLabel}</strong>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">
                {t('Motivo del reporte')}
              </label>
              <div className="space-y-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition ${
                      reason === r.value
                        ? 'border-ink bg-surface-soft'
                        : 'border-hairline hover:bg-surface-soft/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="mt-0.5 h-4 w-4 accent-ink"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink">{t(r.label)}</div>
                      <div className="text-[12px] text-muted">{t(r.hint)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Bloque adicional cuando el motivo es copyright */}
            {isCopyright && (
              <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRightsHolder}
                    onChange={(e) => setIsRightsHolder(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-ink"
                  />
                  <span className="text-[13px] text-body">
                    {t('Soy el')} <strong>{t('titular de los derechos')}</strong> {t('de la obra (o represento al titular).')}
                  </span>
                </label>

                {isRightsHolder && (
                  <>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={declaration}
                        onChange={(e) => setDeclaration(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-ink"
                      />
                      <span className="text-[12px] text-body">
                        <strong>{t('Declaración bajo responsabilidad')}</strong> {t('(art. 17 LPI): declaro de buena fe que el uso del contenido reportado no está autorizado por el titular de los derechos, su representante o la ley, y que la información proporcionada es exacta. Soy consciente de que una declaración falsa puede conllevar responsabilidad civil o penal.')}
                      </span>
                    </label>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-body">
                        {t('Contacto del titular (opcional)')}
                      </label>
                      <input
                        type="text"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder={t('Email/teléfono adicional del titular o representante')}
                        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">
                {t('Descripción de los hechos')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('Explica el problema con detalle. Si reportas copyright, indica la obra original. Si reportas datos personales, indica qué dato te identifica.')}
                rows={4}
                maxLength={5000}
                required
                className="w-full resize-y rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-muted">
                {t('Mínimo 10 caracteres')} · {description.length} / 5000
              </p>
            </div>

            {needsEmail && (
              <>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">
                    {t('Tu email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    {t('Lo usamos exclusivamente para contactarte sobre este reporte.')}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">
                    {t('Tu nombre (opcional)')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('Nombre y apellidos o nombre del estudio/criadero')}
                    className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                  />
                </div>
              </>
            )}

            <p className="text-[11px] leading-relaxed text-muted">
              {t('Al enviar este reporte aceptas que tratemos los datos proporcionados con la única finalidad de gestionar la solicitud, conforme a nuestra')}{' '}
              <a href="/privacy" className="underline" target="_blank" rel="noopener">
                {t('política de privacidad')}
              </a>
              . {t('Los reportes maliciosos o reiteradamente injustificados pueden conllevar la suspensión de la cuenta.')}
            </p>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-soft disabled:opacity-50"
              >
                {t('Cancelar')}
              </button>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? t('Enviando...') : t('Enviar reporte')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
