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
      <button onClick={() => setShowPanel(true)}
        className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border border-white/20">
        <Edit className="w-4 h-4" /> Editar
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
