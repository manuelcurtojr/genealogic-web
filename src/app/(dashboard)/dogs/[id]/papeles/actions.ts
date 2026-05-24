/**
 * Server actions para gestionar papeles del perro (lado criador).
 *
 * Permisos:
 *  - Solo el owner del kennel del dog (o el breeder_id) puede subir/borrar.
 *  - Si el dog ya fue transferido al cliente (owner_id != criador), el criador
 *    SIGUE pudiendo gestionar papeles asociados al perro (el kennel_id no cambia
 *    al transferir). Esto está alineado con la RLS de dog_documents.
 */
'use server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  uploadDogDocument,
  deleteDogDocument,
  type DocumentType,
} from '@/lib/dogs/documents'

/**
 * eslint-disable-next-line @typescript-eslint/no-explicit-any
 */
async function assertBreederCanManage(dogId: string): Promise<{
  userId: string
  kennelId: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: dog } = await admin
    .from('dogs')
    .select('id, kennel_id, breeder_id, owner_id, kennel:kennels(owner_id)')
    .eq('id', dogId)
    .maybeSingle()
  if (!dog) throw new Error('dog_not_found')

  const isKennelOwner = dog.kennel?.owner_id === user.id
  const isBreeder = dog.breeder_id === user.id
  const isDogOwner = dog.owner_id === user.id
  if (!isKennelOwner && !isBreeder && !isDogOwner) {
    throw new Error('forbidden')
  }

  return { userId: user.id, kennelId: dog.kennel_id }
}

export async function uploadDogDocumentAction(
  dogId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId, kennelId } = await assertBreederCanManage(dogId)

    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return { ok: false, error: 'file_required' }
    if (file.size > 25 * 1024 * 1024) return { ok: false, error: 'file_too_large_25mb' }

    const type = (formData.get('type') as DocumentType) || 'other'
    const title = (formData.get('title') as string)?.trim() || file.name
    const description = ((formData.get('description') as string) || '').trim() || null
    const issuedAt = ((formData.get('issued_at') as string) || '').trim() || null
    const visibleToOwner = formData.get('visible_to_owner') === 'on'

    const buffer = new Uint8Array(await file.arrayBuffer())
    await uploadDogDocument({
      dogId,
      kennelId,
      uploadedBy: userId,
      buffer,
      contentType: file.type || 'application/octet-stream',
      originalFilename: file.name,
      type,
      title,
      description,
      issuedAt,
      visibleToOwner,
    })

    revalidatePath(`/dogs/${dogId}/papeles`)
    revalidatePath(`/mis-perros/${dogId}`)
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return { ok: false, error: msg }
  }
}

export async function deleteDogDocumentAction(formData: FormData): Promise<void> {
  const docId = formData.get('id') as string
  if (!docId) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: row } = await admin
    .from('dog_documents')
    .select('dog_id')
    .eq('id', docId)
    .maybeSingle()
  if (!row) return

  await assertBreederCanManage(row.dog_id)
  await deleteDogDocument(docId)

  revalidatePath(`/dogs/${row.dog_id}/papeles`)
  revalidatePath(`/mis-perros/${row.dog_id}`)
}
