/**
 * /litters/[id]/edit — FUSIONADO con el panel lateral.
 *
 * La edición de camadas se hace ahora desde el panel lateral (botón "Editar"
 * en /litters y en la ficha de la camada). Redirigimos a la ficha con
 * ?edit=1 para abrir el panel y no romper enlaces antiguos.
 */
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditLitterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/litters/${id}?edit=1`)
}
