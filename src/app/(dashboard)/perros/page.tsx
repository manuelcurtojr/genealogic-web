'use client'

import { useSearchParams } from 'next/navigation'
import DirectoryTabs from '@/components/search/directory-tabs'
import DogsDirectory from '@/components/search/dogs-directory'
import { useT } from '@/components/i18n/locale-provider'

export default function PerrosPage() {
  const t = useT()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialBreedId = searchParams.get('breed_id') || ''

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Directorio')}</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          {t('Perros')}
        </h1>
        <p className="mt-2 text-[14px] text-body">{t('Explora los perros registrados en Genealogic.')}</p>
      </div>

      <DirectoryTabs active="dogs" />

      <DogsDirectory initialQuery={initialQuery} initialBreedId={initialBreedId} />
    </div>
  )
}
