/**
 * /reclamar/perro/[id] — form de reclamación de un perro sin owner.
 *
 * Si el user no está logged → redirect a /login?redirect=…
 * Si el perro ya tiene owner → mostrar mensaje "ya reclamado".
 * Si el user ya tiene un claim pendiente sobre este perro → redirect al
 * detalle de su solicitud existente.
 */
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isUUID } from '@/lib/slug'
import ClaimForm from '@/components/admin-requests/claim-form'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReclamarPerroPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const field = isUUID(id) ? 'id' : 'slug'
  const { data: dog } = await supabase
    .from('dogs')
    .select('id, name, slug, owner_id, thumbnail_url')
    .eq(field, id)
    .single()
  if (!dog) notFound()

  if (!user) {
    redirect(`/login?redirect=/reclamar/perro/${dog.slug || dog.id}`)
  }

  if (dog.owner_id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto w-10 h-10 text-amber-500 mb-3" />
          <h1 className="text-xl font-bold text-ink mb-2">Este perro ya tiene dueño</h1>
          <p className="text-sm text-body">
            Si crees que es un error, escribe a soporte y te ayudamos a verificarlo.
          </p>
          <div className="mt-5 flex gap-2 justify-center">
            <Link
              href={`/dogs/${dog.slug || dog.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-ink"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al perro
            </Link>
            <Link
              href="/soporte"
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-4 py-2 text-sm font-bold hover:opacity-90"
            >
              Contactar soporte
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ¿ya tiene un claim abierto?
  const { data: existing } = await supabase
    .from('admin_requests')
    .select('id, status')
    .eq('target_dog_id', dog.id)
    .eq('requester_user_id', user.id)
    .in('status', ['pending', 'reviewing', 'awaiting_user'])
    .maybeSingle()
  if (existing) {
    redirect(`/mis-solicitudes/${existing.id}`)
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link
          href={`/dogs/${dog.slug || dog.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al perro
        </Link>
      </div>
      <ClaimForm targetType="dog" targetId={dog.id} targetName={dog.name} />
    </div>
  )
}
