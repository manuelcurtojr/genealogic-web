/**
 * Paso "Tus datos" antes de firmar: el cliente rellena DNI/NIE y domicilio,
 * que son necesarios para que el contrato salga completo. Al guardar
 * (saveClientDetailsAction) la reserva se actualiza y el contrato se regenera
 * con los datos nuevos; tras revalidar, la página muestra ya el form de firma.
 */
'use client'
import { useState, useTransition } from 'react'
import { Loader2, IdCard } from 'lucide-react'
import { saveClientDetailsAction } from '@/app/(dashboard)/mis-reservas/[id]/contrato/actions'
import { useT } from '@/components/i18n/locale-provider'

export default function ClientDetailsForm({
  reservationId,
  contractId,
  initialIdDoc = '',
  initialAddress = '',
  initialPostalCode = '',
  initialCity = '',
}: {
  reservationId: string
  contractId: string
  initialIdDoc?: string
  initialAddress?: string
  initialPostalCode?: string
  initialCity?: string
}) {
  const t = useT()
  const [pending, startTransition] = useTransition()
  const [idDoc, setIdDoc] = useState(initialIdDoc)
  const [address, setAddress] = useState(initialAddress)
  const [postalCode, setPostalCode] = useState(initialPostalCode)
  const [city, setCity] = useState(initialCity)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await saveClientDetailsAction(reservationId, contractId, {
        idDoc,
        address,
        postalCode,
        city,
      })
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border-2 border-ink/10 bg-canvas p-5"
    >
      <h3 className="text-base font-bold text-ink mb-1 inline-flex items-center gap-2">
        <IdCard className="h-4 w-4" />
        {t('Tus datos')}
      </h3>
      <p className="text-xs text-muted mb-4">
        {t('Para firmar, completa tus datos')}
      </p>

      <label className="block mb-3">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
          {t('DNI / NIE / Pasaporte')}
        </span>
        <input
          type="text"
          value={idDoc}
          onChange={(e) => setIdDoc(e.target.value)}
          required
          className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted"
        />
      </label>

      <label className="block mb-3">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
          {t('Dirección')}
        </span>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted"
        />
      </label>

      <div className="grid grid-cols-[1fr_1.6fr] gap-3 mb-3">
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
            {t('Código postal')}
          </span>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted"
          />
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
            {t('Ciudad')}
          </span>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted"
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <button
        type="submit"
        disabled={pending || !idDoc.trim() || !address.trim()}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('Guardar y continuar')}
          </>
        ) : (
          t('Guardar y continuar')
        )}
      </button>
    </form>
  )
}
