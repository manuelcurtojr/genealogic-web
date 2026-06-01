'use client'

/**
 * BreedHeroPicker — UI cliente para que el criador elija qué perro suyo
 * representa cada raza en su web Pro.
 *
 * Por cada raza:
 *   · Card con el nombre, color del estándar y nº de perros disponibles
 *   · Preview grande de la foto actualmente seleccionada
 *   · Grid de thumbnails clicables — al elegir uno, server action y refresh
 *   · Opción "Automático" (vuelve al fallback: reproductor con foto)
 */
import { useState, useTransition } from 'react'
import Image from 'next/image'
import { saveBreedHero } from '@/app/(dashboard)/kennel/contenido/razas/actions'
import { useT } from '@/components/i18n/locale-provider'

type Dog = {
  id: string
  name: string
  sex: string | null
  thumbnail_url: string
  is_reproductive: boolean
}

export type BreedHeroPickerBreed = {
  id: string
  slug: string
  name: string
  /** El perro elegido manualmente (si lo hay) — usado para mostrar selección */
  picked_dog_id: string | null
  /** Lo que actualmente se está mostrando (manual O fallback automático) */
  current_hero_url: string | null
  current_hero_dog_name: string | null
  /** Lista de perros del kennel de esa raza con foto */
  dogs: Dog[]
}

export default function BreedHeroPicker({
  breeds,
}: {
  breeds: BreedHeroPickerBreed[]
}) {
  const t = useT()
  if (breeds.length === 0) {
    return (
      <div className="rounded-2xl border border-hairline bg-canvas px-6 py-10 text-center">
        <p className="text-[14px] text-body">
          {t('Aún no se han detectado razas en tu criadero.')}
        </p>
        <p className="mt-2 text-[12.5px] text-muted">
          {t('Marca al menos un perro como reproductor en su ficha. Cuando lo hagas, la raza aparecerá automáticamente aquí y en tu web Pro.')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <p className="text-[13.5px] leading-[1.65] text-body max-w-prose">
        {t('Elige qué perro tuyo representa cada raza en tu web pública. La foto elegida aparecerá como portada en')}{' '}
        <span className="font-medium text-ink">{t('Nuestras razas')}</span>{' '}
        {t('y en la ficha promocional de cada raza. Si dejas')} <em>{t('Automático')}</em>,{' '}
        {t('el sistema elige solo un reproductor con foto.')}
      </p>

      {breeds.map((b) => (
        <BreedCard key={b.id} breed={b} />
      ))}
    </div>
  )
}

function BreedCard({ breed }: { breed: BreedHeroPickerBreed }) {
  const t = useT()
  const [picked, setPicked] = useState<string | null>(breed.picked_dog_id)
  const [pending, startTransition] = useTransition()
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  function choose(dogId: string | null) {
    setPicked(dogId)
    const fd = new FormData()
    fd.set('breed_id', breed.id)
    fd.set('dog_id', dogId || 'auto')
    startTransition(async () => {
      const r = await saveBreedHero(fd)
      if (r.ok) {
        setSavedMsg(dogId ? t('Foto actualizada') : t('Vuelves al modo automático'))
        setTimeout(() => setSavedMsg(null), 2500)
      } else {
        setSavedMsg(`${t('Error:')} ${r.error}`)
      }
    })
  }

  // Foto que se muestra como preview grande: si hay manual, esa; si no, la
  // que el sistema usa automáticamente.
  const previewDog = picked ? breed.dogs.find((d) => d.id === picked) : null
  const previewUrl = previewDog?.thumbnail_url || breed.current_hero_url
  const previewName = previewDog?.name || breed.current_hero_dog_name

  return (
    <section className="rounded-2xl border border-hairline bg-canvas overflow-hidden">
      <header className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-hairline">
        <div>
          <h2 className="text-[17px] sm:text-[18px] font-semibold text-ink tracking-[-0.015em]">
            {breed.name}
          </h2>
          <p className="text-[12px] text-muted mt-0.5">
            {breed.dogs.length} {breed.dogs.length === 1 ? t('perro con foto') : t('perros con foto')} {t('disponibles')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && (
            <span className="text-[12px] text-emerald-600 font-medium">{savedMsg}</span>
          )}
          {pending && (
            <span className="text-[12px] text-muted">{t('Guardando…')}</span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-0">
        {/* Preview grande */}
        <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[280px] bg-surface-card overflow-hidden border-b lg:border-b-0 lg:border-r border-hairline">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={previewName || breed.name}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[12px] uppercase tracking-wider text-muted/60">
              {t('Sin foto')}
            </div>
          )}
          {previewName && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-4 py-3">
              <p className="text-[11px] text-white/70 uppercase tracking-[0.1em]">
                {picked ? t('Foto elegida') : t('Foto automática')}
              </p>
              <p className="text-[14px] text-white font-medium mt-0.5">{previewName}</p>
            </div>
          )}
        </div>

        {/* Grid de candidatos */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
              {t('Elige una foto')}
            </p>
            <button
              type="button"
              onClick={() => choose(null)}
              disabled={pending || picked === null}
              className={`text-[12px] font-medium px-3 py-1.5 rounded-md transition ${
                picked === null
                  ? 'bg-surface-soft text-muted cursor-default'
                  : 'border border-hairline text-body hover:border-ink/30 hover:text-ink'
              }`}
            >
              {picked === null ? `✓ ${t('Automático')}` : t('Volver a automático')}
            </button>
          </div>

          {breed.dogs.length === 0 ? (
            <p className="text-[13px] text-muted">
              {t('No tienes ningún perro de esta raza con foto subida.')}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {breed.dogs.map((d) => {
                const isSelected = picked === d.id
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => choose(d.id)}
                    disabled={pending}
                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-ink ring-2 ring-ink/30 scale-[0.98]'
                        : 'border-hairline hover:border-ink/40'
                    }`}
                    title={d.name}
                  >
                    <Image
                      src={d.thumbnail_url}
                      alt={d.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 200px"
                      className="object-cover"
                    />
                    {d.is_reproductive && (
                      <span className="absolute top-1.5 left-1.5 inline-flex items-center rounded-full bg-emerald-50/95 px-1.5 py-px text-[9px] font-semibold text-emerald-700 backdrop-blur">
                        {t('Reproductor')}
                      </span>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                      <p className="text-[10.5px] text-white font-medium truncate text-left">
                        {d.name}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-ink text-canvas flex items-center justify-center text-[12px] font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
