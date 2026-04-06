'use client'

import Link from 'next/link'
import { Eye, Edit, GitBranch, ArrowRightLeft, Mars, Venus } from 'lucide-react'
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
}

export default function DogCard({ dog, onEdit }: DogCardProps) {
  const sexBorder = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
  const SexIcon = dog.sex === 'male' ? Mars : Venus
  const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
  const colorName = Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name
  const kennel = Array.isArray(dog.kennel) ? dog.kennel[0] : dog.kennel

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition group">
      {/* Photo area */}
      <div className="relative aspect-[4/3] bg-white/[0.03]">
        {dog.thumbnail_url ? (
          <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img src="/icon.svg" alt="" className="w-16 h-16 opacity-10" />
          </div>
        )}

        {/* Breed badge top-right */}
        {breedName && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
            <img src="/icon.svg" alt="" className="w-4 h-4" />
            <span className="text-[11px] text-white font-medium">{breedName}</span>
          </div>
        )}

        {/* Sex indicator bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: sexBorder }} />
      </div>

      {/* Content */}
      <div className="p-4 text-center">
        {/* Name + Sex icon */}
        <h3 className="font-semibold text-base text-white flex items-center justify-center gap-1.5">
          {dog.name}
          <SexIcon className="w-4 h-4 flex-shrink-0" style={{ color: sexBorder }} />
        </h3>

        {/* Color */}
        {colorName && (
          <p className="text-xs text-white/40 mt-1.5">
            Color: <span className="text-white/60">{colorName}</span>
          </p>
        )}

        {/* Birth date */}
        {dog.birth_date && (
          <p className="text-xs text-white/40 mt-0.5">
            Nacimiento: <span className="text-white/60">
              {new Date(dog.birth_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </p>
        )}

        {/* Kennel / Owner badge */}
        {kennel?.name && (
          <div className="flex items-center justify-center mt-3">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              {kennel.logo_url ? (
                <img src={kennel.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#D74709]/20 flex items-center justify-center">
                  <img src="/icon.svg" alt="" className="w-3 h-3" />
                </div>
              )}
              <span className="text-xs text-white/70 font-medium">{kennel.name}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-white/5">
          <Link
            href={`/dogs/${dog.id}`}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition"
            title="Ver perfil"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={onEdit}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <Link
            href={`/dogs/${dog.id}`}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition"
            title="Pedigri"
          >
            <GitBranch className="w-4 h-4" />
          </Link>
          <button
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition"
            title="Transferir"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
