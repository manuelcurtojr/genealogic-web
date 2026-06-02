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
import { useT } from '@/components/i18n/locale-provider'

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
  const t = useT()
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
      {/* ═════ CONTROLES: búsqueda + filtros (sticky) ═════
          Negative margins matchean el padding del padre (px-4 / px-6 / px-12)
          para que el sticky cubra ancho completo en móvil. */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-hairline bg-canvas/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 sm:py-4 lg:-mx-12 lg:px-12">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          {/* Search input — altura ≥40px para touch */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('Buscar raza, origen, nº FCI…')}
              autoComplete="off"
              inputMode="search"
              className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-10 text-[15px] text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10 sm:text-[14px]"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted hover:bg-surface-soft hover:text-ink active:bg-surface-soft"
                aria-label={t('Limpiar búsqueda')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter chips — scroll horizontal en móvil sin barra visible */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                { id: 'all', label: t('Todas'), mobileLabel: t('Todas') },
                { id: 'genealogic', label: t('Con estándar Genealogic'), mobileLabel: t('Con estándar') },
                { id: 'with-dogs', label: t('Con ejemplares'), mobileLabel: t('Con ejemplares') },
              ] as { id: FilterMode; label: string; mobileLabel: string }[]
            ).map((opt) => {
              const active = mode === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={
                    'inline-flex h-9 flex-shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors sm:text-[12.5px] ' +
                    (active
                      ? 'bg-ink text-canvas'
                      : 'border border-hairline bg-canvas text-body hover:bg-surface-soft active:bg-surface-soft')
                  }
                >
                  {/* Texto corto en móvil, completo en sm+ */}
                  <span className="sm:hidden">{opt.mobileLabel}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Stats line */}
        <p className="mt-2.5 text-[12px] text-muted sm:mt-3">
          {filtered.length === breeds.length
            ? `${t('Mostrando las')} ${breeds.length.toLocaleString('es-ES')} ${t('razas')}`
            : `${filtered.length.toLocaleString('es-ES')} / ${breeds.length.toLocaleString('es-ES')} ${t('razas')}`}
        </p>
      </div>

      {/* ═════ GRID ═════ */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-surface-soft/30 px-4 py-12 text-center sm:py-16">
          <p className="text-[14.5px] text-body">
            {t('No hay razas que coincidan con tu búsqueda.')}
          </p>
          <button
            type="button"
            onClick={() => {
              setQ('')
              setMode('all')
            }}
            className="mt-3 text-[13px] font-medium text-ink underline underline-offset-4 hover:no-underline"
          >
            {t('Limpiar filtros')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-7 lg:grid-cols-3">
          {filtered.map((b) => (
            <Link
              key={b.id}
              href={`/razas/${b.slug}`}
              className="group flex gap-3.5 rounded-xl border border-hairline bg-canvas p-3 transition-colors hover:bg-surface-soft active:bg-surface-soft sm:flex-col sm:gap-0 sm:overflow-hidden sm:p-0"
            >
              {/* Thumbnail — 80x80 móvil, aspect 4:3 sm+ */}
              <div className="relative h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-lg bg-surface-soft sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none">
                {b.image_url ? (
                  <Image
                    src={b.image_url}
                    alt={b.name}
                    fill
                    sizes="(max-width: 640px) 88px, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-muted/60">
                    {t('Sin imagen')}
                  </div>
                )}
              </div>

              {/* Texto — paddings adaptados por viewport */}
              <div className="flex min-w-0 flex-1 flex-col justify-center sm:justify-start sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-[15.5px] font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-[18px]">
                    {b.name}
                  </h2>
                  {b.has_genealogic_standard && (
                    <span
                      className="flex-shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-medium text-emerald-700"
                      title={t('Estándar Genealogic completo: estructura de 12 secciones reinterpretada')}
                    >
                      Genealogic
                    </span>
                  )}
                  {!b.has_genealogic_standard && b.has_sources && (
                    <span
                      className="flex-shrink-0 rounded-full bg-ink/5 px-1.5 py-0.5 text-[9.5px] font-medium text-ink"
                      title={t('Tiene enlaces a estándares oficiales (FCI, AKC…)')}
                    >
                      {t('Fuentes')}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted sm:mt-1.5">
                  {b.fci_number && (
                    <span>
                      FCI <strong className="font-semibold text-body">{b.fci_number}</strong>
                    </span>
                  )}
                  {b.fci_number && b.origin && <span aria-hidden>·</span>}
                  {b.origin && <span className="truncate">{b.origin}</span>}
                </div>
                <p className="mt-1.5 text-[12px] text-muted sm:mt-2">
                  <strong className="font-semibold text-ink">
                    {b.dog_count.toLocaleString('es-ES')}
                  </strong>{' '}
                  {b.dog_count === 1 ? t('ejemplar') : t('ejemplares')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
