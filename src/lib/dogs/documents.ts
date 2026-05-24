/**
 * Helpers para `dog_documents`: papeles asociados a un perro.
 *
 * Storage: bucket `documents` (público), path
 *   `dog-documents/<dog_id>/<timestamp>_<safe_filename>`
 *
 * Visibilidad:
 * - Criador: CRUD sobre docs de perros de sus kennels (RLS lo aplica).
 * - Cliente: SELECT de docs con `visible_to_owner=true` sobre perros suyos.
 *
 * Esta capa usa SIEMPRE el admin client (service-role) para Storage; las
 * lecturas de DB pueden ir por anon client con RLS o admin según contexto
 * (los lectores se pasan).
 */
import 'server-only'
import { cache } from 'react'
import { createKennelAdminClient } from '@/lib/supabase/server'
import type { DocumentType, DogDocument } from './documents-shared'

export type { DocumentType, DogDocument }
export {
  DOCUMENT_TYPES,
  labelForType,
  formatFileSize,
} from './documents-shared'

const BUCKET = 'documents'
const PATH_PREFIX = 'dog-documents'

/** Lista todos los documentos de un perro (admin — sin filtro de RLS). */
export const listDogDocuments = cache(async (dogId: string): Promise<DogDocument[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data } = await admin
    .from('dog_documents')
    .select('*')
    .eq('dog_id', dogId)
    .order('created_at', { ascending: false })
  return (data as DogDocument[]) ?? []
})

/** Lista solo los visibles al propietario. */
export const listDogDocumentsForOwner = cache(
  async (dogId: string): Promise<DogDocument[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data } = await admin
      .from('dog_documents')
      .select('*')
      .eq('dog_id', dogId)
      .eq('visible_to_owner', true)
      .order('issued_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    return (data as DogDocument[]) ?? []
  },
)

function safeName(originalFilename: string): string {
  return (
    originalFilename
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'file'
  )
}

/** Sube un documento a Storage y registra la fila en dog_documents. */
export async function uploadDogDocument(args: {
  dogId: string
  kennelId: string | null
  uploadedBy: string
  buffer: ArrayBuffer | Uint8Array
  contentType: string
  originalFilename: string
  type: DocumentType
  title: string
  description?: string | null
  issuedAt?: string | null
  visibleToOwner?: boolean
}): Promise<DogDocument> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const ts = Date.now()
  const path = `${PATH_PREFIX}/${args.dogId}/${ts}_${safeName(args.originalFilename)}`

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, args.buffer, { contentType: args.contentType, upsert: false })
  if (upErr) throw new Error(upErr.message)

  const url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl as string

  const size =
    args.buffer instanceof Uint8Array ? args.buffer.byteLength : args.buffer.byteLength

  const { data, error: insErr } = await admin
    .from('dog_documents')
    .insert({
      dog_id: args.dogId,
      kennel_id: args.kennelId,
      uploaded_by: args.uploadedBy,
      type: args.type,
      title: args.title,
      description: args.description ?? null,
      url,
      storage_path: path,
      file_size_bytes: size,
      mime_type: args.contentType,
      issued_at: args.issuedAt ?? null,
      visible_to_owner: args.visibleToOwner ?? true,
    })
    .select('*')
    .single()
  if (insErr) {
    // Rollback Storage si la fila falla
    await admin.storage.from(BUCKET).remove([path])
    throw new Error(insErr.message)
  }
  return data as DogDocument
}

/** Borra un documento (Storage + fila). Requiere que el caller haya validado permisos. */
export async function deleteDogDocument(docId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: row } = await admin
    .from('dog_documents')
    .select('storage_path')
    .eq('id', docId)
    .maybeSingle()
  if (!row) return
  if (row.storage_path) {
    await admin.storage.from(BUCKET).remove([row.storage_path])
  }
  await admin.from('dog_documents').delete().eq('id', docId)
}
