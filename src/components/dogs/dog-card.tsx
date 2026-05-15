'use client'

import Link from 'next/link'
import { Eye, Edit, ArrowRightLeft, GitBranch } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { DogImage } from '@/components/ui/dog-image'

interface DogCardProps {
  dog: {
    id: string
    slug?: string | null
    name: string
    sex: string | null
    birth_date: string | null
    thumbnail_url: string | null
    breed: any
    color: any
    kennel?: any
  }
  onEdit?: () => void
  onTransfer?: () => void
  onEditPedigree?: () => void
}

/**
 * Dog card Cal.com — canvas blanco + hairline + foto 4:3.
 * Sex bar inferior como único acento cromático. Sin orange brand.
 */
export default function DogCard({ dog, onEdit, onTransfer, onEditPedigree }: DogCardProps) {
  const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#888'
  const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
  const colorName = Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name

  return (
    <div className="group relative overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft">
      {/* Photo */}
      <Link href={`/dogs/${dog.slug || dog.id}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-card">
        <DogImage
          src={dog.thumbnail_url}
          alt={dog.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          width={0}
          height={0}
          className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        {breedName && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            {breedName}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-1" style={{ background: sexColor }} />
      </Link>

      {/* Info */}
      <div className="p-3">
        <Link href={`/dogs/${dog.slug || dog.id}`} className="block">
          <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
        </Link>
        <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted">
          {dog.birth_date && (
            <span>{new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          )}
          {colorName && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{colorName}</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-1 border-t border-hairline pt-3">
          <Link
            href={`/dogs/${dog.slug || dog.id}`}
            title="Ver perfil"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-ink text-on-primary transition-colors hover:opacity-90"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={onEdit}
            title="Editar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-card hover:text-ink"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          {onEditPedigree && (
            <button
              onClick={onEditPedigree}
              title="Constructor de genealogía"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-card hover:text-ink"
            >
              <GitBranch className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onTransfer}
            title="Transferir a otro dueño"
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-card hover:text-ink"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
