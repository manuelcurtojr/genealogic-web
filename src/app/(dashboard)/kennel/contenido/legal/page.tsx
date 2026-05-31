/**
 * /kennel/contenido/legal — el criador edita sus datos legales y, opcionalmente,
 * sobrescribe los textos de los documentos legales de su web.
 *
 * El subnav + wrapper los pone el layout de /kennel/contenido; aquí solo el
 * contenido propio.
 *
 * - Datos legales (kennels.legal_*): alimentan los placeholders {{...}} de
 *   TODOS los documentos. Es lo que la mayoría necesita rellenar.
 * - Override por documento: versión propia del texto que sustituye a la
 *   plantilla global. Opcional (avanzado).
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KennelLegalEditor from '@/components/kennel/kennel-legal-editor'
import { LEGAL_DOCS, type LegalDocType } from '@/lib/kennel/legal'

export const dynamic = 'force-dynamic'

export default async function KennelLegalContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, name, legal_name, legal_id, legal_address, legal_email, custom_domain')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!kennel) redirect('/kennel/new')

  // Overrides existentes de este criadero (para marcar qué docs están
  // personalizados y precargar su texto en el editor).
  const { data: overrides } = await supabase
    .from('kennel_legal_docs')
    .select('doc_type, title, body_md')
    .eq('kennel_id', kennel.id)

  const overrideByType: Record<string, { title: string; body_md: string }> = {}
  for (const o of overrides || []) overrideByType[o.doc_type] = o

  const docs = LEGAL_DOCS.map(d => ({
    type: d.type as LegalDocType,
    label: d.label,
    slug: d.slug,
    hasOverride: !!overrideByType[d.type],
    title: overrideByType[d.type]?.title || d.label,
    body_md: overrideByType[d.type]?.body_md || '',
  }))

  return (
    <KennelLegalEditor
      kennelId={kennel.id}
      kennelSlug={kennel.slug || kennel.id}
      legal={{
        legal_name: kennel.legal_name,
        legal_id: kennel.legal_id,
        legal_address: kennel.legal_address,
        legal_email: kennel.legal_email,
      }}
      docs={docs}
    />
  )
}
