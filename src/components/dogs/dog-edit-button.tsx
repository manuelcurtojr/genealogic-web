'use client'

import { useState } from 'react'
import { Edit } from 'lucide-react'
import DogFormPanel from './dog-form-panel'
import { useRouter } from 'next/navigation'

interface Props {
  dogId: string
  userId: string
}

export default function DogEditButton({ dogId, userId }: Props) {
  const router = useRouter()
  const [showPanel, setShowPanel] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-canvas/90 px-4 py-2 text-[13px] font-medium text-ink shadow-[0_2px_8px_rgba(0,0,0,0.15)] backdrop-blur-sm transition-colors hover:bg-canvas"
      >
        <Edit className="h-4 w-4" /> Editar
      </button>

      <DogFormPanel
        open={showPanel}
        onClose={() => { setShowPanel(false); router.refresh() }}
        editDogId={dogId}
        userId={userId}
      />
    </>
  )
}
