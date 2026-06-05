/**
 * /mis-solicitudes/[id] — fusionado en /soporte/[id].
 * Redirect preservando el id para mantener vivos los enlaces antiguos
 * (emails transaccionales, /reclamar/*, genos, etc.).
 */
import { redirect } from 'next/navigation'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/soporte/${id}`)
}
