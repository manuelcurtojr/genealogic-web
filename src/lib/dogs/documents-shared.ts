/**
 * Helpers puros (cliente + servidor) para dog_documents.
 * No tiene `server-only` para que se pueda importar desde client components.
 */

export const DOCUMENT_TYPES = [
  { id: 'contract', label: 'Contrato' },
  { id: 'vaccine_card', label: 'Cartilla de vacunas' },
  { id: 'health_card', label: 'Cartilla sanitaria' },
  { id: 'pedigree', label: 'Genealogía' },
  { id: 'registration', label: 'Registro / LOE' },
  { id: 'genetic_test', label: 'Test genético' },
  { id: 'other', label: 'Otro' },
] as const

export type DocumentType = (typeof DOCUMENT_TYPES)[number]['id']

export type DogDocument = {
  id: string
  dog_id: string
  kennel_id: string | null
  uploaded_by: string | null
  type: DocumentType
  title: string
  description: string | null
  url: string
  storage_path: string | null
  file_size_bytes: number | null
  mime_type: string | null
  issued_at: string | null
  visible_to_owner: boolean
  created_at: string
  updated_at: string
}

export function labelForType(type: string): string {
  return DOCUMENT_TYPES.find((t) => t.id === type)?.label ?? 'Documento'
}

export function formatFileSize(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
