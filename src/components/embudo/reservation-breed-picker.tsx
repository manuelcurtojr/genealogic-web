'use client'

/**
 * Selector de raza(s) de interés de una reserva. Las opciones son las razas
 * que el criador cría (getKennelBreedNames). Escribe en la MISMA clave que el
 * formulario de contacto (applicant_extra_data.preference_breed), de modo que
 * lo que elige el cliente en el formulario y lo que ajusta el criador aquí son
 * lo mismo. Se usa en el panel lateral (variant "panel") y en la ficha (card).
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dog, Loader2 } from 'lucide-react'
import { setReservationBreeds } from '@/lib/pipelines/reservation-extra-actions'

export default function ReservationBreedPicker({
  reservationId, options, initial, variant = 'panel',
}: {
  reservationId: string
  options: string[]
  initial: string[]
  variant?: 'panel' | 'card'
}) {
  const [selected, setSelected] = useState<string[]>(initial)
  const [pending, start] = useTransition()
  const router = useRouter()

  const toggle = (name: string) => {
    const next = selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name]
    setSelected(next)
    start(async () => {
      const r = await setReservationBreeds(reservationId, next)
      if (r.ok) router.refresh()
      else {
        setSelected(selected) // revertir en error
        alert(r.error)
      }
    })
  }

  return (
    <section className={variant === 'card' ? 'rounded-2xl border border-hairline bg-canvas p-4 sm:p-6' : 'mt-4'}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
        <Dog className="w-3.5 h-3.5" /> Raza de interés
        {pending && <Loader2 className="w-3 h-3 animate-spin text-muted" />}
      </div>
      {options.length === 0 ? (
        <p className="text-[12px] text-muted">
          Configura las razas que crías en Ajustes del criadero para poder seleccionarlas aquí.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {options.map((name) => {
            const on = selected.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                disabled={pending}
                className={
                  'inline-flex items-center gap-1 rounded-full px-3 h-8 text-[12.5px] font-medium border transition-colors disabled:opacity-60 ' +
                  (on
                    ? 'bg-ink text-on-primary border-ink'
                    : 'bg-canvas text-body border-hairline hover:bg-surface-soft hover:border-ink/30')
                }
              >
                {name}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
