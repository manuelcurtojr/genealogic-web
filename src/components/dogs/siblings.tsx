'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

interface SiblingsProps {
  dogId: string
  fatherId: string | null
  motherId: string | null
}

interface SiblingDog {
  id: string
  name: string
  sex: string | null
  thumbnail_url: string | null
  breed: any
}

export default function Siblings({ dogId, fatherId, motherId }: SiblingsProps) {
  const [siblings, setSiblings] = useState<SiblingDog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      if (!fatherId && !motherId) { setLoading(false); return }

      const supabase = createClient()
      let query = supabase
        .from('dogs')
        .select('id, name, sex, thumbnail_url, breed:breeds(name)')
        .neq('id', dogId)

      if (fatherId && motherId) {
        query = query.or(`father_id.eq.${fatherId},mother_id.eq.${motherId}`)
      } else if (fatherId) {
        query = query.eq('father_id', fatherId)
      } else {
        query = query.eq('mother_id', motherId!)
      }

      const { data } = await query.order('name')
      setSiblings(data || [])
      setLoading(false)
    }
    fetch()
  }, [dogId, fatherId, motherId])

  if (loading) {
    return <div className="text-white/30 text-sm py-8 text-center">Cargando hermanos...</div>
  }

  if (!fatherId && !motherId) {
    return (
      <div className="text-center py-12 text-white/30">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No se pueden buscar hermanos sin padres registrados</p>
      </div>
    )
  }

  if (siblings.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No se encontraron hermanos</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">
        {siblings.length} hermano{siblings.length !== 1 ? 's' : ''} encontrado{siblings.length !== 1 ? 's' : ''}
      </h3>
      <div className="-mx-4 lg:mx-0">
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 lg:px-0">
          {siblings.map(dog => (
            <MiniDogCard key={dog.id} dog={dog} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniDogCard({ dog }: { dog: SiblingDog }) {
  const borderColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  return (
    <Link
      href={`/dogs/${dog.id}`}
      className="w-[140px] flex-shrink-0 bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 transition group"
    >
      <div className="relative w-[140px] h-[140px] bg-white/5">
        {dog.thumbnail_url ? (
          <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/15 text-3xl">
            {dog.sex === 'male' ? '♂' : '♀'}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: borderColor }} />
      </div>
      <div className="p-2.5">
        <p className="text-sm font-semibold text-white truncate">{dog.name}</p>
        {(dog.breed as any)?.name && (
          <p className="text-xs text-white/40 truncate">{(dog.breed as any).name}</p>
        )}
      </div>
    </Link>
  )
}
