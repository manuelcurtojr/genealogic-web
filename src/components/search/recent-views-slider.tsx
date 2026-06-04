'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Dog, Home, Tag, X } from 'lucide-react'
import { getRecentViews, clearRecentViews, hrefForRecent, type RecentItem, type RecentType } from '@/lib/recent-views'
import { useT } from '@/components/i18n/locale-provider'
import { Img } from '@/components/ui/img'

const ICON: Record<RecentType, typeof Dog> = { dog: Dog, kennel: Home, breed: Tag }
const TYPE_LABEL: Record<RecentType, string> = { dog: 'Perro', kennel: 'Criadero', breed: 'Raza' }

/**
 * Slider horizontal de "vistos recientemente" (fichas que el usuario abrió).
 * Lee de localStorage en el cliente; si no hay nada, no renderiza nada.
 */
export default function RecentViewsSlider() {
  const t = useT()
  const [items, setItems] = useState<RecentItem[] | null>(null)

  useEffect(() => { setItems(getRecentViews()) }, [])

  // null = aún no hidratado (evita parpadeo SSR); [] = sin historial → nada.
  if (items === null || items.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted" />
          <h2 className="text-[14px] font-semibold text-ink">{t('Vistos recientemente')}</h2>
        </div>
        <button
          onClick={() => { clearRecentViews(); setItems([]) }}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-muted transition hover:text-ink"
        >
          <X className="h-3 w-3" /> {t('Limpiar')}
        </button>
      </div>

      {/* Slider: scroll horizontal con snap. -mx/px para sangrar full-bleed. */}
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {items.map((it) => {
          const Icon = ICON[it.type]
          return (
            <Link
              key={`${it.type}:${it.ref}`}
              href={hrefForRecent(it)}
              className="group w-[150px] flex-shrink-0 snap-start overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-card">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Img w={240} src={it.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon className="h-7 w-7 text-muted/40" />
                  </div>
                )}
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-canvas/90 px-1.5 py-0.5 text-[9.5px] font-medium text-muted shadow-[0_1px_2px_rgba(0,0,0,0.06)] backdrop-blur-sm">
                  <Icon className="h-2.5 w-2.5" /> {t(TYPE_LABEL[it.type])}
                </span>
              </div>
              <div className="p-2.5">
                <p className="truncate text-[13px] font-medium text-ink">{it.name}</p>
                {it.subtitle && <p className="truncate text-[11px] text-muted">{it.subtitle}</p>}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
