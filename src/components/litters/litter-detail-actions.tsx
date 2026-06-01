'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useT } from '@/components/i18n/locale-provider'
import ConfirmDialog from '@/components/ui/confirm-dialog'

export default function LitterDetailActions({ litterId }: { litterId: string }) {
  const t = useT()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('litters').delete().eq('id', litterId)
    router.push('/litters')
  }

  return (
    <>
      <button
        onClick={() => setShowDelete(true)}
        className="bg-surface-card hover:bg-red-500/20 text-body hover:text-red-400 px-3 py-2 rounded-lg transition"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <ConfirmDialog
        open={showDelete}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        title={t('Eliminar camada')}
        message={t('¿Estas seguro de que quieres eliminar esta camada? Esta accion no se puede deshacer.')}
        confirmLabel={t('Eliminar')}
        destructive
        loading={deleting}
      />
    </>
  )
}
