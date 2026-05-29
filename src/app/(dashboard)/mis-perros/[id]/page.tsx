/**
 * /mis-perros/[id] — FUSIONADO con /dogs/[id].
 *
 * La ficha del propietario se unificó con la ficha general del perro
 * (/dogs/[id], que ya detecta si eres el propietario y muestra papeles en
 * /dogs/[id]/papeles). Mantenemos redirect para no romper enlaces antiguos.
 */
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MyDogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/dogs/${id}`)
}
