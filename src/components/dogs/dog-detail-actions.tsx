'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ui/confirm-dialog'

export default function DogDetailActions({ dogId }: { dogId: string }) {
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('dogs').delete().eq('id', dogId)
    router.push('/dogs')
  }

  return (
    <>
      <button
        onClick={() => setShowDelete(true)}
        className="bg-white/10 hover:bg-red-500/20 text-white/50 hover:text-red-400 px-3 py-2 rounded-lg transition"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <ConfirmDialog
        open={showDelete}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        title="Eliminar perro"
        message="¿Estas seguro de que quieres eliminar este perro? Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
      />
    </>
  )
}
