/**
 * /admin/legal — editor de las plantillas legales GLOBALES por defecto.
 *
 * Estas plantillas (kennel_id NULL) son la base de los documentos legales de
 * TODAS las webs de criadero. Cada criadero puede sobrescribirlas, pero esto
 * es el default que ven mientras no lo hagan. Solo super-admin (gate en el
 * layout de (admin) + RLS + requireAdmin en las server actions).
 */
import { createClient } from '@/lib/supabase/server'
import AdminLegalClient from '@/components/admin/admin-legal-client'
import { LEGAL_DOCS, type LegalDocType } from '@/lib/kennel/legal'

export const dynamic = 'force-dynamic'

export default async function AdminLegalPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kennel_legal_docs')
    .select('doc_type, title, body_md, updated_at')
    .is('kennel_id', null)

  // Mapa tipo → doc, garantizando los 4 (si falta alguno en BD, va vacío).
  const byType: Record<string, { title: string; body_md: string; updated_at: string | null }> = {}
  for (const row of data || []) byType[row.doc_type] = row

  const docs = LEGAL_DOCS.map(d => ({
    type: d.type as LegalDocType,
    label: d.label,
    slug: d.slug,
    title: byType[d.type]?.title || d.label,
    body_md: byType[d.type]?.body_md || '',
    updated_at: byType[d.type]?.updated_at || null,
  }))

  return <AdminLegalClient docs={docs} />
}
