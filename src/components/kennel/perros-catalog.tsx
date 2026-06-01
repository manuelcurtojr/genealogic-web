/**
 * PerrosCatalog — catálogo completo de perros del criadero con buscador,
 * filtro de raza y tabs. Estilo idéntico al /search global pero scoped
 * al kennel actual.
 *
 * Recibe TODO el dataset del kennel desde el server (perros + camadas)
 * y filtra/busca client-side. Para criaderos con muchos perros (cientos)
 * el cliente sigue rápido — son cards ligeras, no hace falta paginar
 * para 100-300 items.
 */
'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, X, Tag, ChevronDown, Dog, Heart, Baby } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import ContactKennelButton from '@/components/kennel/contact-kennel-button'
import { useT } from '@/components/i18n/locale-provider'

type DogRow = {
  id: string
  slug: string | null
  name: string
  sex: string | null
  thumbnail_url: string | null
  is_reproductive: boolean | null
  is_for_sale: boolean | null
  sale_price: number | null
  sale_currency: string | null
  sale_location: string | null
  breed?: { name?: string } | null
}

type LitterRow = {
  id: string
  status: string
  birth_date: string | null
  mating_date: string | null
  breed?: { name?: string } | null
  father?: { id: string; name: string; thumbnail_url: string | null } | null
  mother?: { id: string; name: string; thumbnail_url: string | null } | null
}

type TabKey = 'reproductores' | 'venta' | 'camadas' | 'criados'

const TABS: { key: TabKey; label: string; icon: React.ElementType; iconColor: string }[] = [
  { key: 'reproductores', label: 'Reproductores',          icon: Heart, iconColor: '#ec4899' },
  { key: 'venta',         label: 'En venta',               icon: Tag,   iconColor: '#f59e0b' },
  { key: 'camadas',       label: 'Camadas',                icon: Baby,  iconColor: '#8b5cf6' },
  { key: 'criados',       label: 'Producido por el criadero', icon: Dog, iconColor: '#fb923c' },
]

interface Props {
  kennelName: string
  kennelId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactConfig: any
  reproductores: DogRow[]
  forSale: DogRow[]
  litters: LitterRow[]
  criados: DogRow[]
  currencySymbol: Record<string, string>
  /** Bajo el dominio propio del criadero: las fichas de perro abren el perfil
   *  en genealogic.io en una pestaña nueva (allí está toda la herramienta:
   *  genealogía, salud, palmarés). En genealogic.io se navega normal. */
  dogsToGenealogic?: boolean
}

export default function PerrosCatalog({
  kennelName, kennelId, contactConfig, reproductores, forSale, litters, criados, currencySymbol, dogsToGenealogic,
}: Props) {
  const t = useT()
  // Siempre arrancamos en Reproductores: es el escaparate del criadero (su
  // línea de cría), el contenido más fuerte y el que mejor vende. Aunque
  // En venta / Camadas estén vacíos, el visitante entra viendo lo bueno.
  const [tab, setTab] = useState<TabKey>('reproductores')
  const [query, setQuery] = useState('')
  const [breedFilter, setBreedFilter] = useState('')
  const [sexFilter, setSexFilter] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Lista única de razas presentes en el kennel (para el dropdown del filtro)
  const breeds = useMemo(() => {
    const set = new Set<string>()
    for (const d of [...reproductores, ...forSale, ...criados]) {
      if (d.breed?.name) set.add(d.breed.name)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [reproductores, forSale, criados])

  const counts: Record<TabKey, number> = {
    reproductores: reproductores.length,
    venta:         forSale.length,
    camadas:       litters.length,
    criados:       criados.length,
  }

  const hasActiveFilters = !!query || !!breedFilter || !!sexFilter

  // Helper de filtrado client-side (búsqueda + filtros sobre perros)
  function filterDogs(list: DogRow[]): DogRow[] {
    let out = list
    if (query) {
      const q = query.toLowerCase()
      out = out.filter(d => d.name.toLowerCase().includes(q))
    }
    if (breedFilter) {
      out = out.filter(d => d.breed?.name === breedFilter)
    }
    if (sexFilter) {
      out = out.filter(d => d.sex === sexFilter)
    }
    return out
  }

  function filterLitters(list: LitterRow[]): LitterRow[] {
    let out = list
    if (query) {
      const q = query.toLowerCase()
      out = out.filter(l => {
        const fName = l.father?.name?.toLowerCase() || ''
        const mName = l.mother?.name?.toLowerCase() || ''
        return fName.includes(q) || mName.includes(q)
      })
    }
    if (breedFilter) {
      out = out.filter(l => l.breed?.name === breedFilter)
    }
    return out
  }

  const filteredReproductores = useMemo(() => filterDogs(reproductores), [reproductores, query, breedFilter, sexFilter])
  const filteredVenta = useMemo(() => filterDogs(forSale), [forSale, query, breedFilter, sexFilter])
  const filteredCriados = useMemo(() => filterDogs(criados), [criados, query, breedFilter, sexFilter])
  const filteredCamadas = useMemo(() => filterLitters(litters), [litters, query, breedFilter])

  // Recalcula counts con filtros aplicados (no del dataset total)
  const filteredCounts: Record<TabKey, number> = {
    reproductores: filteredReproductores.length,
    venta:         filteredVenta.length,
    camadas:       filteredCamadas.length,
    criados:       filteredCriados.length,
  }

  // Si el user filtra y la tab activa queda en 0 pero otra tiene resultados,
  // saltamos a la primera con contenido para no enseñar "0 resultados"
  // gratis. Pero solo lo hacemos cuando filtersOpen=true para no molestar
  // al user mientras tipea.
  useEffect(() => {
    if (!hasActiveFilters) return
    if (filteredCounts[tab] > 0) return
    const fallback = (Object.entries(filteredCounts).find(([, n]) => n > 0)?.[0] as TabKey | undefined)
    if (fallback) setTab(fallback)
  }, [query, breedFilter, sexFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Search + filter toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`${t('Buscar en')} ${kennelName}…`}
            className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-4 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(o => !o)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
            hasActiveFilters
              ? 'bg-ink text-on-primary'
              : 'border border-hairline bg-canvas text-body hover:bg-surface-soft hover:text-ink'
          }`}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="tabular-nums">
              {[breedFilter, sexFilter].filter(Boolean).length || ''}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-soft p-3 sm:flex-row sm:flex-wrap">
          {breeds.length > 1 && (
            <div className="relative flex-1 min-w-0">
              <select
                value={breedFilter}
                onChange={e => setBreedFilter(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 pr-9 text-[13px] text-body focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none"
              >
                <option value="">{t('Todas las razas')}</option>
                {breeds.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          )}
          <div className="relative flex-1 min-w-0 sm:flex-initial sm:min-w-[140px]">
            <select
              value={sexFilter}
              onChange={e => setSexFilter(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 pr-9 text-[13px] text-body focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none"
            >
              <option value="">{t('Ambos sexos')}</option>
              <option value="male">{t('Macho')}</option>
              <option value="female">{t('Hembra')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setQuery(''); setBreedFilter(''); setSexFilter('') }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[12.5px] font-medium text-body hover:border-ink/30 hover:text-ink transition"
            >
              <X className="h-3.5 w-3.5" /> {t('Limpiar')}
            </button>
          )}
        </div>
      )}

      {/* Tabs nav */}
      <div className="-mb-px flex gap-1 overflow-x-auto border-b border-hairline scrollbar-hide">
        {TABS.map(({ key, label, icon: Icon, iconColor }) => {
          const isActive = tab === key
          const count = filteredCounts[key]
          const totalCount = counts[key]
          // Los tabs comerciales (venta/camadas) son SIEMPRE clicables: su
          // estado vacío es un CTA de lista de espera / contacto, no un cartel
          // muerto. Reproductores/criados sí se deshabilitan si no hay nada
          // que mostrar.
          const isCommercial = key === 'venta' || key === 'camadas'
          const disabled = totalCount === 0 && !isCommercial
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              disabled={disabled}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'border-ink text-ink'
                  : disabled
                    ? 'border-transparent text-muted/50 cursor-not-allowed'
                    : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" style={isActive ? { color: iconColor } : undefined} />
              <span>{t(label)}</span>
              {/* El badge de número se oculta cuando es 0 — un tab que grita
                  "0" transmite el mismo mensaje negativo que queríamos quitar.
                  Con contenido (o filtrado >0) sí se muestra el contador. */}
              {count > 0 && (
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums ${
                    isActive ? 'bg-ink text-on-primary' : 'bg-surface-card text-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content — los tabs comerciales (venta/camadas) muestran un CTA de
          contacto cuando están vacíos SIN filtros activos, en vez de un
          "0 resultados" muerto: un comprador que ve el escaparate a cero se
          va; mejor invitarle a la lista de espera. Con filtros activos sí
          mostramos el mensaje neutro (es el usuario el que ha filtrado).
          pt explícito (padding, no margin) para separar el contenido del
          divisor de las tabs — el space-y del padre no basta porque su
          selector descendiente gana al margin y el border-b queda pegado. */}
      <div className="pt-5 sm:pt-6">
        {tab === 'reproductores' && <DogGrid dogs={filteredReproductores} emptyLabel={hasActiveFilters ? t('No hay reproductores que coincidan con los filtros.') : t('Sin reproductores publicados.')} dogsToGenealogic={dogsToGenealogic} />}
        {tab === 'venta' && (
          filteredVenta.length === 0 && !hasActiveFilters
            ? <ContactEmptyState
                kennelId={kennelId}
                kennelName={kennelName}
                contactConfig={contactConfig}
                title={t('Ahora mismo no hay cachorros disponibles')}
                body={t('Trabajamos por lista de espera. Pide información y te avisamos en cuanto haya una camada que encaje contigo.')}
              />
            : <DogGrid dogs={filteredVenta} forSale currencySymbol={currencySymbol} emptyLabel={t('No hay perros en venta que coincidan.')} dogsToGenealogic={dogsToGenealogic} />
        )}
        {tab === 'camadas' && (
          filteredCamadas.length === 0 && !hasActiveFilters
            ? <ContactEmptyState
                kennelId={kennelId}
                kennelName={kennelName}
                contactConfig={contactConfig}
                title={t('No hay camadas publicadas ahora mismo')}
                body={t('Planificamos las camadas con cuidado. Pide información y te contamos qué tenemos previsto.')}
              />
            : <LitterGrid litters={filteredCamadas} emptyLabel={t('No hay camadas que coincidan.')} />
        )}
        {tab === 'criados'       && <DogGrid dogs={filteredCriados} emptyLabel={hasActiveFilters ? t('No hay perros que coincidan.') : `${kennelName} ${t('aún no tiene perros criados publicados.')}`} dogsToGenealogic={dogsToGenealogic} />}
      </div>
    </div>
  )
}

/**
 * ContactEmptyState — empty state "vendedor" para los tabs comerciales sin
 * contenido (En venta / Camadas vacíos sin filtros). En lugar de un cartel
 * a cero, invita a la lista de espera / a contactar → convierte el vacío
 * en lead. Enlaza a la página de contacto del propio criadero.
 */
/**
 * ContactEmptyState — empty state "vendedor" para los tabs comerciales sin
 * contenido (En venta / Camadas vacíos sin filtros). En lugar de un cartel
 * a cero, invita a contactar → convierte el vacío en lead. El CTA es el
 * botón "Pedir información" que abre el formulario en un modal (el mismo del
 * resto de la web), no un link a /contacto.
 */
function ContactEmptyState({
  kennelId, kennelName, contactConfig, title, body,
}: {
  kennelId: string
  kennelName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactConfig: any
  title: string
  body: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft px-6 py-12 sm:py-16 text-center">
      <h3 className="text-[17px] sm:text-[19px] font-semibold tracking-[-0.02em] text-ink">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-snug text-body">
        {body}
      </p>
      <div className="mt-6 flex justify-center">
        <ContactKennelButton kennelId={kennelId} kennelName={kennelName} config={contactConfig} />
      </div>
    </div>
  )
}

function DogGrid({ dogs, emptyLabel, forSale, currencySymbol, dogsToGenealogic }: {
  dogs: DogRow[]; emptyLabel: string; forSale?: boolean; currencySymbol?: Record<string, string>; dogsToGenealogic?: boolean
}) {
  if (dogs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
        <p className="text-[14px] text-body">{emptyLabel}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {dogs.map(dog => forSale
        ? <SaleDogCard key={dog.id} dog={dog} currencySymbol={currencySymbol!} dogsToGenealogic={dogsToGenealogic} />
        : <PublicDogCard key={dog.id} dog={dog} dogsToGenealogic={dogsToGenealogic} />
      )}
    </div>
  )
}

function LitterGrid({ litters, emptyLabel }: { litters: LitterRow[]; emptyLabel: string }) {
  const t = useT()
  if (litters.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
        <p className="text-[14px] text-body">{emptyLabel}</p>
      </div>
    )
  }
  const statusCfg: Record<string, { label: string; color: string }> = {
    born:      { label: 'Nacida',       color: '#34d399' },
    confirmed: { label: 'Nacida',       color: '#34d399' },
    delivered: { label: 'Entregada',    color: '#22c55e' },
    mated:     { label: 'Cubrición',    color: '#f59e0b' },
    planned:   { label: 'Planificada',  color: '#3b82f6' },
    pending:   { label: 'Cubrición',    color: '#f59e0b' },
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {litters.map(litter => {
        const father = litter.father
        const mother = litter.mother
        const breedName = litter.breed?.name
        const title = father && mother ? `${father.name} × ${mother.name}` : father?.name || mother?.name || t('Camada')
        const cfg = statusCfg[litter.status] || statusCfg.planned
        return (
          <Link
            key={litter.id}
            href={`/litters/${litter.id}`}
            className="group overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
          >
            <div className="flex h-24 bg-surface-card">
              <div className="relative flex-1 overflow-hidden">
                {father?.thumbnail_url
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={father.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-lg text-muted">♂</div>
                }
              </div>
              <div className="w-px bg-hairline" />
              <div className="relative flex-1 overflow-hidden">
                {mother?.thumbnail_url
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={mother.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-lg text-muted">♀</div>
                }
              </div>
            </div>
            <div className="p-3">
              <p className="truncate text-[13px] font-medium text-ink">{title}</p>
              {breedName && <p className="mt-0.5 text-[11px] text-muted">{breedName}</p>}
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium text-white" style={{ backgroundColor: cfg.color }}>
                  {t(cfg.label)}
                </span>
                {litter.birth_date && (
                  <span className="text-[11px] text-muted">
                    {new Date(litter.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function SaleDogCard({ dog, currencySymbol, dogsToGenealogic }: { dog: DogRow; currencySymbol: Record<string, string>; dogsToGenealogic?: boolean }) {
  const t = useT()
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  const symbol = currencySymbol[dog.sale_currency || 'EUR'] || '€'
  return (
    <Link
      href={dogsToGenealogic ? `https://genealogic.io/dogs/${dog.slug || dog.id}` : `/dogs/${dog.slug || dog.id}`}
      target={dogsToGenealogic ? '_blank' : undefined}
      rel={dogsToGenealogic ? 'noopener noreferrer' : undefined}
      className="group relative overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
    >
      <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#f59e0b] px-2 py-0.5 text-[10.5px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
        <Tag className="h-2.5 w-2.5" /> {t('En venta')}
      </span>
      <div className="relative aspect-square overflow-hidden bg-surface-card">
        {dog.thumbnail_url
          ? /* eslint-disable-next-line @next/next/no-img-element */
            <img src={dog.thumbnail_url} alt={dog.name} loading="lazy" className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center"><Dog className="h-10 w-10 text-muted" /></div>
        }
        {dog.breed?.name && (
          <span className="absolute right-2 top-2 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            {dog.breed.name}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </div>
      <div className="p-3">
        <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          {dog.sale_price ? (
            <p className="text-[14px] font-semibold text-ink tabular-nums">
              {Number(dog.sale_price).toLocaleString('es-ES')} {symbol}
            </p>
          ) : (
            <p className="text-[12px] text-muted">{t('Consultar precio')}</p>
          )}
          {dog.sale_location && <p className="truncate text-[10.5px] text-muted">{dog.sale_location}</p>}
        </div>
      </div>
    </Link>
  )
}

function PublicDogCard({ dog, dogsToGenealogic }: { dog: DogRow; dogsToGenealogic?: boolean }) {
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  return (
    <Link
      href={dogsToGenealogic ? `https://genealogic.io/dogs/${dog.slug || dog.id}` : `/dogs/${dog.slug || dog.id}`}
      target={dogsToGenealogic ? '_blank' : undefined}
      rel={dogsToGenealogic ? 'noopener noreferrer' : undefined}
      className="group overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-card">
        {dog.thumbnail_url
          ? /* eslint-disable-next-line @next/next/no-img-element */
            <img src={dog.thumbnail_url} alt={dog.name} loading="lazy" className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center"><Dog className="h-10 w-10 text-muted" /></div>
        }
        {dog.breed?.name && (
          <span className="absolute right-2 top-2 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            {dog.breed.name}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </div>
      <div className="p-3">
        <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
        {dog.breed?.name && <p className="mt-0.5 truncate text-[11.5px] text-muted">{dog.breed.name}</p>}
      </div>
    </Link>
  )
}
