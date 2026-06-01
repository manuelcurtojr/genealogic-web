'use client'

import Link from 'next/link'
import { Edit, ArrowRightLeft, GitBranch, Globe, EyeOff, Heart } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { DogImage } from '@/components/ui/dog-image'
import { useT } from '@/components/i18n/locale-provider'

interface DogCardProps {
  dog: {
    id: string
    slug?: string | null
    name: string
    sex: string | null
    birth_date: string | null
    thumbnail_url: string | null
    original_thumbnail_url?: string | null
    thumbnail_upscaled_at?: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    breed: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    color: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kennel?: any
    is_reproductive?: boolean | null
    show_in_kennel?: boolean | null
  }
  onEdit?: () => void
  onTransfer?: () => void
  onEditPedigree?: () => void
  /** Solo para criadores: toggle "visible en perfil público del criadero" */
  onToggleVisible?: () => void
  /** Solo para criadores: toggle "es reproductor" */
  onToggleReproductive?: () => void
}

/**
 * Dog card responsive.
 *
 * Desktop (sm+): grid card clásica con foto arriba (aspect 4:3) y
 * acciones abajo.
 *
 * Mobile (<sm): layout horizontal tipo card de genealogía — foto grande
 * a la izquierda ocupando todo el alto, barra de sexo a su derecha como
 * separador vertical, info arriba a la derecha y botones cuadrados
 * debajo. Toda la card es clickable (lleva al perfil); los botones de
 * acción se aíslan con stopPropagation.
 *
 * El botón "Ver" (icono ojo) se eliminó — clickar la card YA abre el perfil
 * y duplicar el affordance solo añade ruido. Antes había 5-6 botones
 * apilados; ahora son 4 máximo, siempre visibles en mobile.
 */
export default function DogCard({
  dog,
  onEdit,
  onTransfer,
  onEditPedigree,
  onToggleVisible,
  onToggleReproductive,
}: DogCardProps) {
  const t = useT()
  const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#888'
  const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
  const colorName = Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name
  const dogHref = `/dogs/${dog.slug || dog.id}`
  const birthLabel = dog.birth_date
    ? new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  // ─── Botones de acción (compartidos entre layouts) ────────────────────
  const actionButtons = (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onEdit?.() }}
        title={t('Editar')}
        aria-label={t('Editar')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-card hover:text-ink"
      >
        <Edit className="h-4 w-4" />
      </button>
      {onEditPedigree && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEditPedigree() }}
          title={t('Constructor de genealogía')}
          aria-label={t('Genealogía')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-card hover:text-ink"
        >
          <GitBranch className="h-4 w-4" />
        </button>
      )}
      {onToggleVisible && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleVisible() }}
          title={
            dog.show_in_kennel !== false
              ? t('Visible en tu perfil público — click para ocultar')
              : t('Oculto en tu perfil público — click para mostrar')
          }
          aria-label={dog.show_in_kennel !== false ? t('Ocultar de perfil público') : t('Mostrar en perfil público')}
          aria-pressed={dog.show_in_kennel !== false}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
            dog.show_in_kennel !== false
              ? 'border-emerald-400/60 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              : 'border-hairline bg-canvas text-muted hover:bg-surface-card hover:text-ink'
          }`}
        >
          {dog.show_in_kennel !== false ? <Globe className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      )}
      {onToggleReproductive && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleReproductive() }}
          title={
            dog.is_reproductive
              ? t('Es reproductor — click para desmarcar')
              : t('No es reproductor — click para marcar')
          }
          aria-label={dog.is_reproductive ? t('Quitar marca de reproductor') : t('Marcar como reproductor')}
          aria-pressed={!!dog.is_reproductive}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
            dog.is_reproductive
              ? 'border-pink-400/60 bg-pink-50 text-pink-600 hover:bg-pink-100'
              : 'border-hairline bg-canvas text-muted hover:bg-surface-card hover:text-ink'
          }`}
        >
          <Heart className={`h-4 w-4 ${dog.is_reproductive ? 'fill-current' : ''}`} />
        </button>
      )}
      {onTransfer && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onTransfer() }}
          title={t('Transferir a otro dueño')}
          aria-label={t('Transferir')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-card hover:text-ink"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>
      )}
    </>
  )

  // ─── Layout MOBILE (<sm): híbrido foto-izquierda + info-derecha ─────
  // Patrón "Link overlay + botones z-10": el Link envuelve toda la card
  // de forma ABSOLUTA (z-0) y los botones tienen z-10 + relative para
  // recibir clicks sin que se propaguen al Link. Antes el <Link> envolvía
  // <button>s dentro, lo que es HTML inválido y hacía que el click de
  // editar/etc disparase navegación al perfil del perro.
  const mobileLayout = (
    <article className="sm:hidden relative flex overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft">
      {/* Link overlay — cubre toda la card detrás (z-0). Aria-label para SR. */}
      <Link
        href={dogHref}
        aria-label={`${t('Ver perfil de')} ${dog.name}`}
        className="absolute inset-0 z-0"
      />
      {/* Columna foto — ocupa el alto completo de la card */}
      <div className="relative flex-shrink-0 w-[120px] bg-surface-card overflow-hidden pointer-events-none">
        <DogImage
          src={dog.thumbnail_url}
          alt={dog.name}
          fill
          sizes="120px"
          width={0}
          height={0}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      {/* Barra vertical de sexo — separa foto de info */}
      <div className="w-1 flex-shrink-0 pointer-events-none" style={{ background: sexColor }} aria-hidden="true" />
      {/* Columna info + botones */}
      <div className="relative flex-1 min-w-0 p-3 flex flex-col">
        {/* Texto: pointer-events-none deja pasar el click al Link de fondo. */}
        <div className="min-w-0 pointer-events-none">
          <p className="truncate text-[15px] font-semibold text-ink leading-snug">{dog.name}</p>
          {breedName && (
            <p className="mt-0.5 truncate text-[12px] text-body">{breedName}</p>
          )}
          <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted">
            {birthLabel && <span>{birthLabel}</span>}
            {birthLabel && colorName && <span aria-hidden="true">·</span>}
            {colorName && <span className="truncate">{colorName}</span>}
          </div>
        </div>
        {/* Botones — z-10 + relative para estar encima del Link y recibir
            clicks propios sin disparar la navegación. */}
        <div className="relative z-10 mt-auto pt-3 flex items-center gap-1.5 flex-wrap">
          {actionButtons}
        </div>
      </div>
    </article>
  )

  // ─── Layout DESKTOP (sm+): grid card clásica ──────────────────────────
  const desktopLayout = (
    <div className="hidden sm:block group relative overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft">
      <Link href={dogHref} className="relative block aspect-[4/3] overflow-hidden bg-surface-card">
        <DogImage
          src={dog.thumbnail_url}
          alt={dog.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          width={0}
          height={0}
          className="absolute inset-0 h-full w-full"
        />
        {breedName && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            {breedName}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-1" style={{ background: sexColor }} />
      </Link>
      <div className="p-3">
        <Link href={dogHref} className="block">
          <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
        </Link>
        <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted">
          {birthLabel && <span>{birthLabel}</span>}
          {colorName && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{colorName}</span>
            </>
          )}
        </div>
        <div className="mt-3 flex items-center gap-1 border-t border-hairline pt-3">
          {actionButtons}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {mobileLayout}
      {desktopLayout}
    </>
  )
}
