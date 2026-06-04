'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'
import { useT } from '@/components/i18n/locale-provider'
import { Img } from '@/components/ui/img'

interface SiblingsProps {
  dogId: string
  fatherId: string | null
  motherId: string | null
}

interface SiblingDog {
  id: string
  slug?: string | null
  name: string
  sex: string | null
  thumbnail_url: string | null
  breed: any
}

export default function Siblings({ dogId, fatherId, motherId }: SiblingsProps) {
  const [siblings, setSiblings] = useState<SiblingDog[]>([])
  const [loading, setLoading] = useState(true)
  const t = useT()

  useEffect(() => {
    async function fetch() {
      if (!fatherId && !motherId) { setLoading(false); return }

      const supabase = createClient()
      let query = supabase
        .from('dogs')
        .select('id, slug, name, sex, thumbnail_url, breed:breeds(name)')
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
    return <div className="text-muted text-sm py-8 text-center">{t('Cargando hermanos...')}</div>
  }

  if (!fatherId && !motherId) {
    return (
      <div className="text-center py-12 text-muted">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{t('No se pueden buscar hermanos sin padres registrados')}</p>
      </div>
    )
  }

  if (siblings.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{t('No se encontraron hermanos')}</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
        {siblings.length} {t(siblings.length !== 1 ? 'hermanos encontrados' : 'hermano encontrado')}
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
      href={`/dogs/${dog.slug || dog.id}`}
      className="w-[140px] flex-shrink-0 bg-surface-card border border-hairline rounded-lg overflow-hidden hover:bg-surface-card transition group"
    >
      <div className="relative w-[140px] h-[140px] bg-surface-card">
        {dog.thumbnail_url ? (
          <Img w={200} src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-3xl">
            {dog.sex === 'male' ? '♂' : '♀'}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: borderColor }} />
      </div>
      <div className="p-2.5">
        <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
        {(dog.breed as any)?.name && (
          <p className="text-xs text-muted truncate">{(dog.breed as any).name}</p>
        )}
      </div>
    </Link>
  )
}
