'use client'

import { useState, useEffect } from 'react'
import { Edit } from 'lucide-react'
import LitterFormPanel from './litter-form-panel'
import DogFormPanel from '@/components/dogs/dog-form-panel'
import { useRouter } from 'next/navigation'

interface Props {
  litterId: string
  userId: string
  userKennelId?: string | null
  userKennelName?: string | null
  userAffixFormat?: string | null
}

export default function LitterEditButton({ litterId, userId, userKennelId, userKennelName, userAffixFormat }: Props) {
  const router = useRouter()
  const [showPanel, setShowPanel] = useState(false)
  const [dogPanelOpen, setDogPanelOpen] = useState(false)
  const [puppyData, setPuppyData] = useState<any>({})

  // Auto-abrir el panel de edición cuando se llega con ?edit=1 (legacy
  // /litters/[id]/edit redirige aquí). Limpia el query param después.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('edit') === '1') {
      setShowPanel(true)
      const url = new URL(window.location.href)
      url.searchParams.delete('edit')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  return (
    <>
      <button onClick={() => setShowPanel(true)}
        className="bg-surface-card hover:bg-white/15 text-body px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition">
        <Edit className="w-4 h-4" />
      </button>

      <LitterFormPanel
        open={showPanel}
        onClose={() => { setShowPanel(false); router.refresh() }}
        editLitterId={litterId}
        userId={userId}
        onAddPuppy={(lid, breedId, fatherId, motherId) => {
          setShowPanel(false)
          setPuppyData({ litterId: lid, breedId, fatherId, motherId })
          setDogPanelOpen(true)
        }}
      />

      <DogFormPanel
        open={dogPanelOpen}
        onClose={() => { setDogPanelOpen(false); router.refresh() }}
        editDogId={null}
        userId={userId}
        defaultLitterId={puppyData.litterId}
        defaultBreedId={puppyData.breedId}
        defaultFatherId={puppyData.fatherId}
        defaultMotherId={puppyData.motherId}
        defaultKennelId={userKennelId}
        defaultKennelName={userKennelName}
        defaultAffixFormat={userAffixFormat}
      />
    </>
  )
}
