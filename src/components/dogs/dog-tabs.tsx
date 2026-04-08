'use client'

import { useState } from 'react'
import { Stethoscope, Trophy, Users, GitBranch } from 'lucide-react'
import VetRecords from './vet-records'
import DogVetReminders from './dog-vet-reminders'
import Awards from './awards'
import Siblings from './siblings'
import Offspring from './offspring'

interface DogTabsProps {
  dogId: string
  ownerId: string
  isOwner: boolean
  fatherId: string | null
  motherId: string | null
  dogSex: string | null
}

const TABS = [
  { key: 'offspring', label: 'Descendientes', icon: GitBranch },
  { key: 'siblings', label: 'Hermanos', icon: Users },
  { key: 'health', label: 'Salud', icon: Stethoscope },
  { key: 'awards', label: 'Palmares', icon: Trophy },
] as const

type TabKey = typeof TABS[number]['key']

export default function DogTabs({ dogId, ownerId, isOwner, fatherId, motherId, dogSex }: DogTabsProps) {
  const [active, setActive] = useState<TabKey>('offspring')

  return (
    <div className="mt-8">
      {/* Tab headers */}
      <div className="flex gap-1 border-b border-white/10 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              active === key
                ? 'border-[#D74709] text-[#D74709]'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
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
    </div>
  )
}
