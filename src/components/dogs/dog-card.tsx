'use client'

import Link from 'next/link'
import { Eye, Edit, ArrowRightLeft, Dog, GitBranch, ShieldCheck } from 'lucide-react'
import { BRAND } from '@/lib/constants'

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
    is_verified?: boolean
  }
  onEdit?: () => void
  onTransfer?: () => void
  onEditPedigree?: () => void
}

export default function DogCard({ dog, onEdit, onTransfer, onEditPedigree }: DogCardProps) {
  const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
  const sexIcon = dog.sex === 'male' ? '♂' : '♀'
  const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
  const colorName = Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name

  return (
    <div className="bg-ink-800 border border-hair rounded-xl hover:border-[#D74709]/30 transition group relative">
      {/* Photo */}
      <Link href={`/dogs/${dog.slug || dog.id}`} className="block relative aspect-[4/3] bg-chip rounded-t-xl overflow-hidden">
        {dog.thumbnail_url ? (
          <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Dog className="w-12 h-12 text-fg-mute" /></div>
        )}
        {breedName && (
          <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">{breedName}</span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </Link>

      {/* Info */}
      <div className="p-2 sm:p-3">
        <Link href={`/dogs/${dog.slug || dog.id}`} className="flex items-center gap-1 sm:gap-1.5 group-hover:text-[#D74709] transition">
          <span className="text-xs sm:text-sm font-semibold truncate">{dog.name}</span>
          {dog.is_verified && (
            <div className="relative group/tip flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-ink-800 border border-hair rounded text-[10px] text-fg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition pointer-events-none shadow-lg z-50">Verificado con microchip y genealogía oficial</div>
            </div>
          )}
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 text-[10px] sm:text-[11px] text-fg-mute">
          {dog.birth_date && <span>{new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
          {colorName && <span className="truncate">{colorName}</span>}
        </div>

        {/* Action buttons — icon-only on grid to avoid overflow */}
        <div className="flex items-center gap-1 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-hair">
          <Link
            href={`/dogs/${dog.slug || dog.id}`}
            title="Ver perfil"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={onEdit}
            title="Editar"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-chip text-fg-mute hover:bg-chip hover:text-fg transition"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          {onEditPedigree && (
            <button
              onClick={onEditPedigree}
              title="Constructor de genealogía"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-chip text-fg-mute hover:bg-green-500/10 hover:text-green-400 transition"
            >
              <GitBranch className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onTransfer}
            title="Transferir a otro dueño"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-chip text-fg-mute hover:bg-[#D74709]/10 hover:text-[#D74709] transition ml-auto"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
