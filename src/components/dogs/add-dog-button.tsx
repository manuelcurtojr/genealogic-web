'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DogFormPanel from './dog-form-panel'

interface AddDogButtonProps {
  userId: string
  className?: string
  children?: React.ReactNode
  defaultKennelId?: string | null
}

/**
 * Trigger reutilizable que abre el popup de "Añadir perro" (DogFormPanel en modo
 * creación, pantalla completa con selector Manual/Importador). El llamante controla
 * el look del botón vía className/children. Al guardar o cerrar, refresca la ruta
 * para que el nuevo perro aparezca sin recargar a mano.
 *
 * Sustituye los enlaces a la antigua página /dogs/new desde el onboarding owner,
 * los empty states del dashboard, etc.
 */
export default function AddDogButton({ userId, className, children, defaultKennelId }: AddDogButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <DogFormPanel
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => router.refresh()}
        userId={userId}
        defaultKennelId={defaultKennelId ?? undefined}
      />
    </>
  )
}
