'use client'

import { useState, useEffect } from 'react'
import { GitBranch } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

interface OffspringProps {
  dogId: string
  dogSex: string | null
}

interface OffspringDog {
  id: string
  slug?: string | null
  name: string
  sex: string | null
  thumbnail_url: string | null
  birth_date: string | null
  breed: any
}

export default function Offspring({ dogId, dogSex }: OffspringProps) {
  const [offspring, setOffspring] = useState<OffspringDog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()
      const parentField = dogSex === 'female' ? 'mother_id' : 'father_id'
      const { data } = await supabase
        .from('dogs')
        .select('id, slug, name, sex, thumbnail_url, birth_date, breed:breeds(name)')
        .eq(parentField, dogId)
        .order('birth_date', { ascending: false })

      setOffspring(data || [])
      setLoading(false)
    }
    fetch()
  }, [dogId, dogSex])

  if (loading) {
    return <div className="text-fg-mute text-sm py-8 text-center">Cargando descendientes...</div>
  }

  if (offspring.length === 0) {
    return (
      <div className="text-center py-12 text-fg-mute">
        <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No se encontraron descendientes</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-fg-mute uppercase tracking-wider mb-4">
        {offspring.length} descendiente{offspring.length !== 1 ? 's' : ''}
      </h3>
      <div className="-mx-4 lg:mx-0">
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 lg:px-0">
        {offspring.map(dog => {
          const borderColor = dog.sex === 'male' ? BRAND.male : BRAND.female
          return (
            <Link
              key={dog.id}
              href={`/dogs/${dog.slug || dog.id}`}
              className="w-[140px] flex-shrink-0 bg-chip border border-hair rounded-lg overflow-hidden hover:bg-chip transition"
            >
              <div className="relative w-[140px] h-[140px] bg-chip">
                {dog.thumbnail_url ? (
                  <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-fg-mute text-3xl">
                    {dog.sex === 'male' ? '♂' : '♀'}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: borderColor }} />
              </div>
              <div className="p-2.5">
                <p className="text-sm font-semibold text-white truncate">{dog.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {(dog.breed as any)?.name && (
                    <span className="text-xs text-fg-mute truncate">{(dog.breed as any).name}</span>
                  )}
                  {dog.birth_date && (
                    <span className="text-xs text-fg-mute">
                      &middot; {new Date(dog.birth_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      </div>
    </div>
  )
}
