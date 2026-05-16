'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dog, Heart, Tag, Baby } from 'lucide-react'
import { BRAND } from '@/lib/constants'

type TabKey = 'reproductores' | 'venta' | 'camadas' | 'criados'

interface KennelPublicTabsProps {
  kennelName: string
  reproductores: any[]
  forSale: any[]
  litters: any[]
  criados: any[]
  currencySymbol: Record<string, string>
}

const TABS: { key: TabKey; label: string; icon: any; iconColor: string }[] = [
  { key: 'reproductores', label: 'Reproductores', icon: Heart, iconColor: '#ec4899' },
  { key: 'venta', label: 'En venta', icon: Tag, iconColor: '#f59e0b' },
  { key: 'camadas', label: 'Camadas', icon: Baby, iconColor: '#8b5cf6' },
  { key: 'criados', label: 'Producido por el criadero', icon: Dog, iconColor: '#fb923c' },
]

export default function KennelPublicTabs({
  kennelName, reproductores, forSale, litters, criados, currencySymbol,
}: KennelPublicTabsProps) {
  const counts: Record<TabKey, number> = {
    reproductores: reproductores.length,
    venta: forSale.length,
    camadas: litters.length,
    criados: criados.length,
  }

  // Default a la primera tab con contenido, si todas vacías → reproductores
  const firstWithContent = TABS.find(t => counts[t.key] > 0)?.key || 'reproductores'
  const [active, setActive] = useState<TabKey>(firstWithContent)

  const empty = counts.reproductores === 0 && counts.venta === 0 && counts.camadas === 0 && counts.criados === 0

  if (empty) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
        <Dog className="mx-auto h-10 w-10 text-muted" />
        <p className="mt-3 text-[14px] text-body">No hay perros visibles en este criadero.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs nav — scrollable underline-style Cal */}
      <div className="-mb-px flex gap-1 overflow-x-auto border-b border-hairline scrollbar-hide">
        {TABS.map(({ key, label, icon: Icon, iconColor }) => {
          const isActive = active === key
          const count = counts[key]
          const isEmpty = count === 0
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              disabled={isEmpty}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'border-ink text-ink'
                  : isEmpty
                    ? 'border-transparent text-muted/50 cursor-not-allowed'
                    : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" style={isActive ? { color: iconColor } : undefined} />
              <span>{label}</span>
              <span
                className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums ${
                  isActive ? 'bg-ink text-on-primary' : 'bg-surface-card text-muted'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div>
        {active === 'reproductores' && (
          <DogGrid dogs={reproductores} emptyLabel="Sin reproductores publicados." />
        )}
        {active === 'venta' && (
          <DogGrid dogs={forSale} forSale currencySymbol={currencySymbol} emptyLabel="No hay perros en venta ahora mismo." />
        )}
        {active === 'camadas' && (
          <LitterGrid litters={litters} emptyLabel="Sin camadas publicadas." />
        )}
        {active === 'criados' && (
          <DogGrid dogs={criados} emptyLabel={`${kennelName} aún no tiene perros criados publicados.`} />
        )}
      </div>
    </div>
  )
}

function DogGrid({ dogs, emptyLabel, forSale, currencySymbol }: {
  dogs: any[]; emptyLabel: string; forSale?: boolean; currencySymbol?: Record<string, string>
}) {
  if (dogs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
        <p className="text-[14px] text-body">{emptyLabel}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {dogs.map(dog => forSale
        ? <SaleDogCard key={dog.id} dog={dog} currencySymbol={currencySymbol!} />
        : <PublicDogCard key={dog.id} dog={dog} />
      )}
    </div>
  )
}

function LitterGrid({ litters, emptyLabel }: { litters: any[]; emptyLabel: string }) {
  if (litters.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
        <p className="text-[14px] text-body">{emptyLabel}</p>
      </div>
    )
  }
  const statusCfg: Record<string, { label: string; color: string }> = {
    born: { label: 'Nacida', color: '#34d399' },
    confirmed: { label: 'Nacida', color: '#34d399' },
    mated: { label: 'Cubrición', color: '#f59e0b' },
    planned: { label: 'Planificada', color: '#3b82f6' },
    pending: { label: 'Cubrición', color: '#f59e0b' },
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {litters.map(litter => {
        const father = litter.father
        const mother = litter.mother
        const breedName = litter.breed?.name
        const title = father && mother ? `${father.name} × ${mother.name}` : father?.name || mother?.name || 'Camada'
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
                  ? <img src={father.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-lg text-muted">♂</div>
                }
              </div>
              <div className="w-px bg-hairline" />
              <div className="relative flex-1 overflow-hidden">
                {mother?.thumbnail_url
                  ? <img src={mother.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-lg text-muted">♀</div>
                }
              </div>
            </div>
            <div className="p-3">
              <p className="truncate text-[13px] font-medium text-ink">{title}</p>
              {breedName && <p className="mt-0.5 text-[11px] text-muted">{breedName}</p>}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium text-white"
                  style={{ backgroundColor: cfg.color }}
                >
                  {cfg.label}
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

function SaleDogCard({ dog, currencySymbol }: { dog: any; currencySymbol: Record<string, string> }) {
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  const symbol = currencySymbol[dog.sale_currency] || '€'
  return (
    <Link
      href={`/dogs/${dog.slug || dog.id}`}
      className="group relative overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
    >
      <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#f59e0b] px-2 py-0.5 text-[10.5px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
        <Tag className="h-2.5 w-2.5" /> En venta
      </span>
      <div className="relative aspect-square overflow-hidden bg-surface-card">
        {dog.thumbnail_url
          ? <img src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover" />
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
            <p className="text-[12px] text-muted">Consultar precio</p>
          )}
          {dog.sale_location && <p className="truncate text-[10.5px] text-muted">{dog.sale_location}</p>}
        </div>
      </div>
    </Link>
  )
}

function PublicDogCard({ dog }: { dog: any }) {
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  return (
    <Link
      href={`/dogs/${dog.slug || dog.id}`}
      className="group overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-card">
        {dog.thumbnail_url
          ? <img src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover" />
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
