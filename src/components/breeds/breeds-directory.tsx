'use client'

/**
 * BreedsDirectory — grid client-side con buscador + filtros.
 *
 * Recibe la lista pre-cargada del server y filtra en memoria. Para 200-400
 * razas es perfectamente rápido sin necesidad de paginación o RPC.
 */
import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

export type DirectoryBreed = {
  id: string
  name: string
  slug: string
  fci_number: string | null
  origin: string | null
  synonyms: string[]
  dog_count: number
  has_genealogic_standard: boolean
  has_sources: boolean
  image_url: string | null
}

// Normaliza para búsqueda accent/case-insensitive
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

type FilterMode = 'all' | 'genealogic' | 'with-dogs'

export default function BreedsDirectory({ breeds }: { breeds: DirectoryBreed[] }) {
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<FilterMode>('all')

  const filtered = useMemo(() => {
    const nq = norm(q.trim())
    return breeds.filter((b) => {
      if (mode === 'genealogic' && !b.has_genealogic_standard) return false
      if (mode === 'with-dogs' && b.dog_count === 0) return false
      if (!nq) return true
      if (norm(b.name).includes(nq)) return true
      if (b.origin && norm(b.origin).includes(nq)) return true
      if (b.fci_number && b.fci_number.includes(nq)) return true
      for (const s of b.synonyms || []) if (norm(s).includes(nq)) return true
      return false
    })
  }, [breeds, q, mode])

  return (
    <div>
      {/* Controles: búsqueda + filtros */}
      <div className="sticky top-0 z-20 -mx-6 mb-8 border-b border-hairline bg-canvas/85 px-6 py-4 backdrop-blur-md sm:-mx-0 sm:rounded-xl sm:border sm:bg-surface-soft/40 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar raza, sinónimo, origen, nº FCI…"
              autoComplete="off"
              className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-9 text-[14px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-surface-soft hover:text-ink"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 overflow-x-auto sm:overflow-visible">
            {(
              [
                { id: 'all', label: 'Todas' },
                { id: 'genealogic', label: 'Con estándar Genealogic' },
                { id: 'with-dogs', label: 'Con ejemplares' },
              ] as { id: FilterMode; label: string }[]
            ).map((opt) => {
              const active = mode === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={
                    'whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ' +
                    (active
                      ? 'bg-ink text-canvas'
                      : 'border border-hairline bg-canvas text-body hover:bg-surface-soft')
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Stats line */}
        <p className="mt-3 text-[12px] text-muted">
          {filtered.length === breeds.length
            ? `Mostrando las ${breeds.length.toLocaleString('es-ES')} razas`
            : `${filtered.length.toLocaleString('es-ES')} de ${breeds.length.toLocaleString('es-ES')} razas`}
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-surface-soft/30 py-16 text-center">
          <p className="text-[14.5px] text-body">No hay razas que coincidan con tu búsqueda.</p>
          <button
            type="button"
            onClick={() => {
              setQ('')
              setMode('all')
            }}
            className="mt-3 text-[13px] font-medium text-ink underline underline-offset-4 hover:no-underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <Link
              key={b.id}
              href={`/razas/${b.slug}`}
              className="group flex gap-4 rounded-[12px] border border-hairline bg-canvas p-3 transition-colors hover:bg-surface-soft sm:flex-col sm:gap-0 sm:p-0 sm:overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-soft sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none">
                {b.image_url ? (
                  <Image
                    src={b.image_url}
                    alt={b.name}
                    fill
                    sizes="(max-width: 640px) 80px, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-muted/60">
                    Sin imagen
                  </div>
                )}
              </div>

              {/* Texto */}
              <div className="min-w-0 flex-1 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="truncate text-[16px] font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-[18px]">
                    {b.name}
                  </h2>
                  {b.has_genealogic_standard && (
                    <span
                      className="flex-shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-medium text-emerald-700"
                      title="Estándar Genealogic completo: estructura de 12 secciones reinterpretada"
                    >
                      Genealogic
                    </span>
                  )}
                  {!b.has_genealogic_standard && b.has_sources && (
                    <span
                      className="flex-shrink-0 rounded-full bg-ink/5 px-1.5 py-0.5 text-[9.5px] font-medium text-ink"
                      title="Tiene enlaces a estándares oficiales (FCI, AKC…)"
                    >
                      Fuentes
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted">
                  {b.fci_number && (
                    <span>
                      FCI <strong className="font-semibold text-body">{b.fci_number}</strong>
                    </span>
                  )}
                  {b.fci_number && b.origin && <span aria-hidden>·</span>}
                  {b.origin && <span className="truncate">{b.origin}</span>}
                </div>
                <p className="mt-2 text-[12px] text-muted">
                  <strong className="font-semibold text-ink">
                    {b.dog_count.toLocaleString('es-ES')}
                  </strong>{' '}
                  {b.dog_count === 1 ? 'ejemplar' : 'ejemplares'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
