'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface DogCardProps {
  dog: {
    id: string
    name: string
    sex: string | null
    birth_date: string | null
    thumbnail_url: string | null
    breed: any
    color: any
  }
  isFavorited?: boolean
  userId?: string
}

export default function DogCard({ dog, isFavorited = false, userId }: DogCardProps) {
  const [favorited, setFavorited] = useState(isFavorited)

  const sexBorder = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
  const sexLabel = dog.sex === 'male' ? '♂' : dog.sex === 'female' ? '♀' : ''

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) return

    const supabase = createClient()
    if (favorited) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('dog_id', dog.id)
    } else {
      await supabase.from('favorites').insert({ user_id: userId, dog_id: dog.id })
    }
    setFavorited(!favorited)
  }

  return (
    <Link
      href={`/dogs/${dog.id}`}
      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/50 hover:bg-white/[0.07] transition group block"
    >
      {/* Photo area */}
      <div className="relative aspect-square bg-white/5">
        {dog.thumbnail_url ? (
          <img
            src={dog.thumbnail_url}
            alt={dog.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/10 text-6xl font-light">
            {sexLabel}
          </div>
        )}
        {/* Sex indicator bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: sexBorder }} />
        {/* Favorite button */}
        {userId && (
          <button
            onClick={toggleFavorite}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
          >
            <Heart
              className="w-4 h-4"
              fill={favorited ? BRAND.danger : 'none'}
              color={favorited ? BRAND.danger : 'white'}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-white group-hover:text-[#D74709] transition truncate">
          {dog.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {dog.breed && (
            <span className="text-[11px] bg-white/10 text-white/60 rounded-full px-2 py-0.5 truncate">
              {Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed.name}
            </span>
          )}
          {dog.color && (
            <span className="text-[11px] bg-white/5 text-white/40 rounded-full px-2 py-0.5 truncate">
              {Array.isArray(dog.color) ? dog.color[0]?.name : dog.color.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
