'use client'

import { useState } from 'react'
import { Stethoscope, Trophy, Users, GitBranch, Ruler } from 'lucide-react'
import VetRecords from './vet-records'
import DogVetReminders from './dog-vet-reminders'
import Awards from './awards'
import Siblings from './siblings'
import Offspring from './offspring'
import MeasurementsView from './measurements-view'
import { useT } from '@/components/i18n/locale-provider'

interface DogTabsProps {
  dogId: string
  ownerId: string
  isOwner: boolean
  fatherId: string | null
  motherId: string | null
  dogSex: string | null
  /** Ficha morfométrica ya cargada en el servidor (vacía si privada y no eres el dueño). */
  measurements?: any[]
  measurementsPublic?: boolean
}

const BASE_TABS = [
  { key: 'offspring', label: 'Descendientes', icon: GitBranch },
  { key: 'siblings', label: 'Hermanos', icon: Users },
  { key: 'health', label: 'Salud', icon: Stethoscope },
  { key: 'awards', label: 'Palmares', icon: Trophy },
] as const

type TabKey = 'offspring' | 'siblings' | 'health' | 'awards' | 'measurements'

export default function DogTabs({
  dogId, ownerId, isOwner, fatherId, motherId, dogSex,
  measurements = [], measurementsPublic = false,
}: DogTabsProps) {
  const [active, setActive] = useState<TabKey>('offspring')
  const t = useT()

  // La pestaña «Medidas» solo aparece si hay medidas que mostrar (el servidor
  // ya decide: públicas → cualquiera; privadas → solo el dueño).
  const hasMeasurements = measurements.length > 0
  const tabs: { key: TabKey; label: string; icon: typeof GitBranch }[] = BASE_TABS.map((x) => ({
    key: x.key as TabKey, label: x.label, icon: x.icon,
  }))
  if (hasMeasurements) tabs.push({ key: 'measurements', label: 'Medidas', icon: Ruler })

  return (
    <div className="mt-8">
      {/* Tab headers */}
      <div className="-mb-px flex gap-1 overflow-x-auto border-b border-hairline mb-6 scrollbar-hide">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              active === key
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Icon className="h-4 w-4" />
            {t(label)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === 'health' && (
        <>
          {isOwner && <DogVetReminders dogId={dogId} isOwner={isOwner} />}
          <VetRecords dogId={dogId} ownerId={ownerId} isOwner={isOwner} />
        </>
      )}
      {active === 'awards' && <Awards dogId={dogId} ownerId={ownerId} isOwner={isOwner} />}
      {active === 'siblings' && <Siblings dogId={dogId} fatherId={fatherId} motherId={motherId} />}
      {active === 'offspring' && <Offspring dogId={dogId} dogSex={dogSex} />}
      {active === 'measurements' && hasMeasurements && (
        <MeasurementsView measurements={measurements} isOwner={isOwner} isPublic={measurementsPublic} />
      )}
    </div>
  )
}
