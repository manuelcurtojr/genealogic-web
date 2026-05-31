/**
 * /kennels/[slug]/legal/[doc] — documento legal del criadero.
 *
 * Sirve los 4 documentos (aviso-legal, privacidad, cookies, terminos) bajo el
 * dominio del criadero (iremacurto.com/legal/cookies) y en genealogic.io.
 * Resuelve: OVERRIDE del criadero si existe, si no la plantilla GLOBAL, y
 * rellena los placeholders {{...}} con los datos del criadero.
 */
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { isUUID } from '@/lib/slug'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import {
  LEGAL_SLUG_TO_TYPE,
  buildLegalVars,
  fillLegalPlaceholders,
  type LegalDocType,
} from '@/lib/kennel/legal'

export const dynamic = 'force-dynamic'

const KENNEL_LEGAL_SELECT =
  'id, slug, owner_id, name, legal_name, legal_id, legal_address, legal_email, city, country, custom_domain'

/** Resuelve el doc legal (override del kennel > plantilla global). */
async function resolveDoc(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  kennelId: string,
  type: LegalDocType,
): Promise<{ title: string; body_md: string } | null> {
  const { data } = await supabase
    .from('kennel_legal_docs')
    .select('title, body_md, kennel_id')
    .eq('doc_type', type)
    .or(`kennel_id.eq.${kennelId},kennel_id.is.null`)
    .order('kennel_id', { ascending: false, nullsFirst: false })
    .limit(1)
  return data?.[0] || null
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string; doc: string }> },
): Promise<Metadata> {
  const { id, doc } = await params
  const type = LEGAL_SLUG_TO_TYPE[doc]
  if (!type) return { title: 'No encontrado' }
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, name, slug')
    .eq(field, id)
    .maybeSingle()
  if (!kennel) return { title: 'No encontrado' }
  const docRow = await resolveDoc(supabase, kennel.id, type)
  const title = `${docRow?.title || 'Legal'} · ${kennel.name}`
  return {
    title,
    alternates: { canonical: `https://genealogic.io/kennels/${kennel.slug}/legal/${doc}` },
    robots: { index: true, follow: true },
  }
}

export default async function KennelLegalPage(
  { params }: { params: Promise<{ id: string; doc: string }> },
) {
  const { id, doc } = await params
  const type = LEGAL_SLUG_TO_TYPE[doc]
  if (!type) notFound()

  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select(KENNEL_LEGAL_SELECT)
    .eq(field, id)
    .single()
  if (!kennel) notFound()
  if (field === 'id' && kennel.slug && kennel.slug !== id) {
    redirect(`/kennels/${kennel.slug}/legal/${doc}`)
  }

  const docRow = await resolveDoc(supabase, kennel.id, type)
  if (!docRow) notFound()

  // Email del owner como fallback para {{kennel_legal_email}}
  let ownerEmail: string | null = null
  if (kennel.owner_id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', kennel.owner_id)
      .maybeSingle()
    ownerEmail = prof?.email || null
  }

  const vars = buildLegalVars(kennel, ownerEmail)
  const html = renderContractMarkdown(fillLegalPlaceholders(docRow.body_md, vars))

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted mb-3">
        {kennel.name}
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold text-ink tracking-[-0.025em] leading-[1.05] mb-8">
        {docRow.title}
      </h1>
      <article
        className="legal-prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
