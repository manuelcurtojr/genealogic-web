'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Dog, Grid3X3, List, Eye } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import FavoriteButton from '@/components/dogs/favorite-button'

interface FavoritesClientProps {
  dogs: any[]
}

export default function FavoritesClient({ dogs }: FavoritesClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('favorites-view') as 'grid' | 'list') || 'grid'
    return 'grid'
  })

  const changeView = (v: 'grid' | 'list') => { setViewMode(v); localStorage.setItem('favorites-view', v) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Favoritos</h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1">{dogs.length} perros guardados</p>
        </div>
        {dogs.length > 0 && (
          <div className="flex rounded-lg border border-white/10 overflow-hidden shrink-0">
            <button onClick={() => changeView('grid')} className={`p-2 transition ${viewMode === 'grid' ? 'bg-[#D74709] text-white' : 'bg-white/5 text-white/30'}`}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => changeView('list')} className={`p-2 transition ${viewMode === 'list' ? 'bg-[#D74709] text-white' : 'bg-white/5 text-white/30'}`}><List className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {dogs.length === 0 ? (
        <div className="text-center py-12 sm:py-20">
          <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-base sm:text-lg">No tienes favoritos</p>
          <p className="text-white/25 text-sm mt-2">Pulsa el corazon en el perfil de un perro para guardarlo</p>
          <Link href="/dogs" className="text-sm text-[#D74709] hover:underline mt-4 inline-block">Explorar perros</Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
          {dogs.map((dog: any) => {
            const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
            const sexIcon = dog.sex === 'male' ? '♂' : '♀'
            const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
            const colorName = Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name
            const kennelName = Array.isArray(dog.kennel) ? dog.kennel[0]?.name : dog.kennel?.name

            return (
              <div key={dog.id} className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/30 transition group relative">
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
                <div className="absolute top-2 left-2"><FavoriteButton dogId={dog.id} initialFavorited={true} /></div>
                <div className="p-2 sm:p-3">
                  <Link href={`/dogs/${dog.id}`} className="flex items-center gap-1.5 group-hover:text-[#D74709] transition">
                    <span className="text-xs sm:text-sm font-semibold truncate">{dog.name}</span>
                    <span className="text-xs" style={{ color: sexColor }}>{sexIcon}</span>
                  </Link>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] sm:text-[11px] text-white/35">
                    {dog.birth_date && <span>{new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    {colorName && <span>{colorName}</span>}
                  </div>
                  {kennelName && <p className="text-[10px] text-white/25 mt-1 truncate">{kennelName}</p>}
                  <div className="flex items-center gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5">
                    <Link href={`/dogs/${dog.id}`} className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition">Ver perfil</Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {dogs.map((dog: any) => {
            const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
            const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
            const colorName = Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name

            return (
              <Link key={dog.id} href={`/dogs/${dog.id}`} className="flex items-center gap-2.5 sm:gap-4 bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-4 hover:border-[#D74709]/50 hover:bg-white/[0.07] transition">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
                  {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">{dog.sex === 'male' ? '♂' : '♀'}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm truncate">{dog.name}</p>
                  <div className="flex items-center gap-2 sm:gap-3 mt-0.5 text-[10px] sm:text-xs text-white/40">
                    {breedName && <span className="truncate">{breedName}</span>}
                    {colorName && <span className="hidden sm:inline">{colorName}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <FavoriteButton dogId={dog.id} initialFavorited={true} />
                  <span className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[#D74709]/10 text-[#D74709]"><Eye className="w-3 h-3" /> <span className="hidden sm:inline">Ver</span></span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
