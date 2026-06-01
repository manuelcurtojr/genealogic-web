'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, Dog as DogIcon, Star } from 'lucide-react'
import { toggleDogFeaturedInHomeAction } from '@/lib/kennel/content-actions'
import { useT } from '@/components/i18n/locale-provider'

type DogRow = {
  id: string
  name: string
  thumbnail_url: string | null
  featured_in_home: boolean
  breed_name?: string | null
}

export default function FeaturedDogsPicker({ dogs }: { dogs: DogRow[] }) {
  const t = useT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const featured = dogs.filter(d => d.featured_in_home)
  const count = featured.length

  function flip(d: DogRow) {
    setBusyId(d.id)
    startTransition(async () => {
      try {
        await toggleDogFeaturedInHomeAction({ dogId: d.id, featured: !d.featured_in_home })
        router.refresh()
      } catch { /* surface later */ }
      finally { setBusyId(null) }
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-ink">
          {t('Perros destacados en el Inicio')}
        </h2>
        <p className="mt-1 text-[12.5px] text-muted max-w-prose">
          {t('Elige los perros que verán primero los visitantes en la home de tu web pública. Si no marcas ninguno, mostramos automáticamente los de mejor foto.')}
        </p>
        <p className="mt-2 text-[11.5px] font-semibold">
          <span className={count > 0 ? 'text-emerald-700' : 'text-muted'}>
            {count} {count === 1 ? t('perro destacado') : t('perros destacados')}
          </span>
          {count > 6 && <span className="text-amber-700 ml-2">· {t('se mostrarán solo los 6 primeros')}</span>}
        </p>
      </div>

      {dogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-8 text-center">
          <DogIcon className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-3 text-[14px] font-semibold text-ink">{t('Aún no tienes perros en el criadero')}</p>
          <p className="mt-1 text-[12.5px] text-body">{t('Crea tu primer perro desde Mis perros.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {dogs.map(d => {
            const isFeatured = d.featured_in_home
            const isBusy = busyId === d.id && pending
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => flip(d)}
                disabled={isBusy}
                className={`group relative text-left overflow-hidden rounded-xl border bg-canvas transition disabled:opacity-50 ${
                  isFeatured ? 'border-ink shadow-[0_8px_24px_rgba(0,0,0,0.06)]' : 'border-hairline hover:border-ink/30'
                }`}
              >
                <div className="relative aspect-square overflow-hidden bg-surface-card">
                  {d.thumbnail_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={d.thumbnail_url} alt={d.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <DogIcon className="h-10 w-10" />
                    </div>
                  )}
                  {/* Checkbox visual top-right */}
                  <div className="absolute top-2 right-2">
                    {isBusy ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-canvas shadow-sm">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-ink" />
                      </span>
                    ) : isFeatured ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-on-primary shadow-sm">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-canvas/90 backdrop-blur-sm border border-hairline text-muted group-hover:text-ink shadow-sm">
                        <Star className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-[13.5px] font-medium text-ink">{d.name}</p>
                  {d.breed_name && <p className="mt-0.5 truncate text-[11px] text-muted">{d.breed_name}</p>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
