'use client'

import Link from 'next/link'
import { Eye, Edit, ArrowRightLeft, Dog } from 'lucide-react'
import { BRAND } from '@/lib/constants'

interface DogCardProps {
  dog: {
    id: string
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
}

export default function DogCard({ dog, onEdit, onTransfer }: DogCardProps) {
  const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
  const sexIcon = dog.sex === 'male' ? '♂' : '♀'
  const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
  const colorName = Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/30 transition group">
      {/* Photo */}
      <Link href={`/dogs/${dog.id}`} className="block relative aspect-[4/3] bg-white/5">
        {dog.thumbnail_url ? (
          <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Dog className="w-12 h-12 text-white/10" /></div>
        )}
        {breedName && (
          <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">{breedName}</span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </Link>

      {/* Info */}
      <div className="p-3">
        <Link href={`/dogs/${dog.id}`} className="flex items-center gap-1.5 group-hover:text-[#D74709] transition">
          <span className="text-sm font-semibold truncate">{dog.name}</span>
          <span className="text-xs" style={{ color: sexColor }}>{sexIcon}</span>
        </Link>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/35">
          {dog.birth_date && <span>{new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
          {colorName && <span>{colorName}</span>}
        </div>

        {/* Action buttons - pill style matching kennel/litter */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
          <Link href={`/dogs/${dog.id}`} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition">
            <Eye className="w-3 h-3" /> Ver
          </Link>
          <button onClick={onEdit} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-white/5 text-white/30 hover:bg-white/10 transition">
            <Edit className="w-3 h-3" /> Editar
          </button>
          <button onClick={onTransfer} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-white/5 text-white/30 hover:bg-[#D74709]/10 hover:text-[#D74709] transition ml-auto">
            <ArrowRightLeft className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
