/**
 * Form de firma del cliente: checkbox "He leído y acepto" + nombre + botón.
 * Optimistic UI + manejo de error.
 */
'use client'
import { useState, useTransition } from 'react'
import { Loader2, Pen } from 'lucide-react'
import { signContractAsClientAction } from '@/app/(dashboard)/mis-reservas/[id]/contrato/actions'
import { useT } from '@/components/i18n/locale-provider'

export default function ClientSignForm({
  reservationId,
  contractId,
}: {
  reservationId: string
  contractId: string
}) {
  const t = useT()
  const [pending, startTransition] = useTransition()
  const [accepted, setAccepted] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await signContractAsClientAction(reservationId, contractId, name, accepted)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border-2 border-ink/10 bg-canvas p-5"
    >
      <h3 className="text-base font-bold text-ink mb-1 inline-flex items-center gap-2">
        <Pen className="h-4 w-4" />
        {t('Firmar contrato')}
      </h3>
      <p className="text-xs text-muted mb-4">
        {t('Tu firma queda registrada con sello de tiempo. Equivale legalmente a una firma manuscrita (Reglamento eIDAS).')}
      </p>

      <label className="flex items-start gap-2 cursor-pointer mb-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5"
          required
        />
        <span className="text-sm text-body">
          {t('He leído el contrato completo y acepto sus términos y condiciones.')}
        </span>
      </label>

      <label className="block mb-3">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
          {t('Tu nombre completo')}
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={3}
          placeholder={t('Nombre y apellidos')}
          className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink placeholder:text-muted"
        />
      </label>

      {error && (
        <p className="text-xs text-red-600 mb-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !accepted || !name.trim()}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('Firmando...')}
          </>
        ) : (
          t('Firmar el contrato')
        )}
      </button>
    </form>
  )
}
