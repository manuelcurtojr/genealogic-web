'use client'

/**
 * DogAssignmentBar — barra superior del formulario que permite al criador
 * asignar un perro concreto a la reserva, o desasignarlo para volver al
 * modo "preferencias orientativas".
 *
 * Cuando hay perro asignado:
 *   - Muestra una card con los datos del perro (nombre, raza, sexo,
 *     microchip, fecha nacimiento)
 *   - Botón "Cambiar / Quitar" para abrir el selector
 *
 * Cuando no hay perro:
 *   - Selector typeahead de los perros del criadero (max 500)
 *   - "Sin asignar" como opción al principio
 *
 * Al cambiar la asignación llama a onAssignDogAction (server action) que
 * actualiza puppy_reservations.dog_id y regenera el body_html del contrato
 * con los datos del nuevo perro (vía buildContractVars). El router.refresh
 * recarga la página y el form re-renderiza con los valores correctos.
 */

import { useState, useTransition, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Dog, Search, Check, X, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import type { KennelDogOption } from './contract-fill-panel'

interface Props {
  reservationId: string
  assignedDogId: string | null
  kennelDogs: KennelDogOption[]
  disabled: boolean
  onAssignDogAction: (
    reservationId: string,
    dogId: string | null,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
}

export default function DogAssignmentBar({
  reservationId, assignedDogId, kennelDogs, disabled, onAssignDogAction,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const assignedDog = useMemo(
    () => (assignedDogId ? kennelDogs.find((d) => d.id === assignedDogId) ?? null : null),
    [assignedDogId, kennelDogs],
  )

  // Cerrar dropdown al click fuera
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  const filtered = useMemo(() => {
    const q = norm(query.trim())
    if (!q) return kennelDogs.slice(0, 50)
    return kennelDogs
      .filter((d) =>
        norm(d.name).includes(q) ||
        (d.microchip || '').includes(q) ||
        norm(d.breedName || '').includes(q),
      )
      .slice(0, 50)
  }, [query, kennelDogs])

  function pickDog(dogId: string | null) {
    setError(null)
    startTransition(async () => {
      const res = await onAssignDogAction(reservationId, dogId)
      if (res.ok) {
        setOpen(false)
        setQuery('')
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  // ── Estado: perro asignado ──
  if (assignedDog) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 sm:px-4 py-3 min-w-0">
        {/* En mobile: ficha del perro arriba, acciones full-width abajo
            (los 2 enlaces "Cambiar/Quitar" cabían pero apretaban la ficha
            del perro contra la imagen).
            En sm+: layout horizontal foto + ficha + acciones a la derecha. */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-3 min-w-0">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {assignedDog.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={assignedDog.thumbnailUrl}
                alt={assignedDog.name}
                className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-emerald-200"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-700">
                <Dog className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 leading-none">
                Cachorro asignado
              </p>
              <p className="mt-0.5 text-[14px] font-semibold text-ink truncate">
                {assignedDog.name}
              </p>
              <p className="text-[12px] text-body truncate">
                {[
                  assignedDog.breedName,
                  assignedDog.sex === 'male' ? 'Macho' : assignedDog.sex === 'female' ? 'Hembra' : null,
                  assignedDog.colorName,
                  assignedDog.microchip ? `Chip ${assignedDog.microchip}` : null,
                ].filter(Boolean).join(' · ')}
              </p>
              <p className="hidden sm:block text-[11px] text-muted mt-0.5">
                Los datos del perro aparecen automáticamente en el contrato. Para cambiar nombre/raza/etc., edítalo en su ficha.
              </p>
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-1 justify-end pt-1 sm:pt-0 sm:pl-2 border-t sm:border-t-0 border-emerald-200/60 sm:border-0">
            <button
              type="button"
              onClick={() => setOpen(true)}
              disabled={disabled || pending}
              className="text-[12px] sm:text-[11.5px] font-semibold text-emerald-800 hover:text-emerald-900 underline disabled:opacity-50"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={() => pickDog(null)}
              disabled={disabled || pending}
              className="text-[12px] sm:text-[11.5px] font-medium text-muted hover:text-rose-700 disabled:opacity-50"
            >
              Quitar
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-2 flex items-start gap-1.5 text-[11.5px] text-rose-700">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropdown sobrepuesto al hacer click en Cambiar */}
        {open && (
          <div ref={wrapRef} className="mt-3">
            <DogPicker
              kennelDogs={kennelDogs}
              filtered={filtered}
              query={query}
              setQuery={setQuery}
              onPick={pickDog}
              onCancel={() => setOpen(false)}
              pending={pending}
            />
          </div>
        )}
      </div>
    )
  }

  // ── Estado: SIN perro asignado ──
  return (
    <div ref={wrapRef} className="rounded-xl border border-hairline bg-surface-soft/40 px-3 sm:px-4 py-3 min-w-0">
      {/* En mobile: icono+texto arriba, botón abajo full-width.
          En sm+: icono+texto y botón a la derecha en una sola fila. */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-3 min-w-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-lg bg-canvas border border-hairline flex-shrink-0 flex items-center justify-center text-muted">
            <Dog className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-ink">Cachorro asignado</p>
            <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
              Asigna un cachorro de tu criadero para que sus datos aparezcan en el contrato (nombre, raza, microchip…). Si todavía no lo tienes, déjalo en blanco.
            </p>
          </div>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={disabled || pending}
            className="flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-ink text-on-primary px-3 py-2 sm:py-1.5 text-[12px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Search className="h-3.5 w-3.5" />
            Asignar perro
            <ChevronDown className="h-3 w-3" />
          </button>
        )}
      </div>

      {error && !open && (
        <div className="mt-2 flex items-start gap-1.5 text-[11.5px] text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {open && (
        <div className="mt-3">
          <DogPicker
            kennelDogs={kennelDogs}
            filtered={filtered}
            query={query}
            setQuery={setQuery}
            onPick={pickDog}
            onCancel={() => setOpen(false)}
            pending={pending}
          />
        </div>
      )}
    </div>
  )
}

function DogPicker({
  kennelDogs, filtered, query, setQuery, onPick, onCancel, pending,
}: {
  kennelDogs: KennelDogOption[]
  filtered: KennelDogOption[]
  query: string
  setQuery: (q: string) => void
  onPick: (dogId: string | null) => void
  onCancel: () => void
  pending: boolean
}) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-hairline bg-surface-soft/50">
        <Search className="h-4 w-4 text-muted flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, raza, microchip…"
          autoFocus
          className="flex-1 min-w-0 bg-transparent text-[13px] text-ink placeholder:text-muted/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-muted hover:text-ink rounded"
          aria-label="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {kennelDogs.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12.5px] text-muted">
            Aún no tienes perros en tu criadero. Crea tu primer perro en{' '}
            <a href="/dogs/new" className="text-ink underline font-semibold">/dogs/new</a>.
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-[12.5px] text-muted">
            Sin resultados para «{query}»
          </div>
        ) : (
          <ul className="py-1">
            {filtered.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onPick(d.id)}
                  disabled={pending}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-soft/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {d.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.thumbnailUrl}
                      alt=""
                      className="h-9 w-9 rounded-md object-cover flex-shrink-0 border border-hairline"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-md bg-surface-soft flex-shrink-0 flex items-center justify-center text-muted">
                      <Dog className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{d.name}</p>
                    <p className="text-[11px] text-muted truncate">
                      {[
                        d.breedName,
                        d.sex === 'male' ? 'Macho' : d.sex === 'female' ? 'Hembra' : null,
                        d.microchip ? `Chip ${d.microchip.slice(-6)}` : null,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted flex-shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-hairline px-3 py-2 bg-surface-soft/30 flex items-center justify-between">
        <span className="text-[11px] text-muted">
          {kennelDogs.length} perros en tu criadero
        </span>
        <button
          type="button"
          onClick={() => onPick(null)}
          disabled={pending}
          className="text-[11.5px] font-semibold text-muted hover:text-ink disabled:opacity-50 inline-flex items-center gap-1"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          Sin asignar (rellenar manual)
          <Check className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
