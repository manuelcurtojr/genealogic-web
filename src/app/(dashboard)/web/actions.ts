'use server'

import { createKennelAdminClient } from '@/lib/supabase/server'
import { PAGE_SLUGS, DEFAULT_NAV_LABELS } from '@/lib/kennel/pages'
import { revalidatePath } from 'next/cache'

/** Asegura que las 9 filas troncales existen para este kennel (idempotente). */
export async function ensureAllPagesAction(kennelId: string): Promise<void> {
  const admin = createKennelAdminClient()
  const { data: existing } = await admin
    .from('kennel_pages').select('slug').eq('kennel_id', kennelId)
  const existingSlugs = new Set((existing || []).map((r: any) => r.slug))

  const toInsert = PAGE_SLUGS.filter(s => !existingSlugs.has(s))
    .map((slug, i) => ({
      kennel_id: kennelId,
      slug,
      enabled: false,
      nav_order: i,
      nav_label: DEFAULT_NAV_LABELS[slug] || null,
      sections: [],
    }))

  if (toInsert.length > 0) {
    await admin.from('kennel_pages').insert(toInsert)
  }
}

export async function savePageDraftAction(kennelId: string, slug: string, sectionsJson: string) {
  let sections: any[]
  try {
    sections = JSON.parse(sectionsJson)
    if (!Array.isArray(sections)) throw new Error('sections must be an array')
  } catch (err: any) {
    return { ok: false, error: `JSON inválido: ${err.message}` }
  }
  const admin = createKennelAdminClient()
  const { error } = await admin
    .from('kennel_pages')
    .update({ draft_sections: sections })
    .eq('kennel_id', kennelId)
    .eq('slug', slug)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/web/${slug}`)
  return { ok: true }
}

export async function publishPageAction(kennelId: string, slug: string, sectionsJson?: string) {
  const admin = createKennelAdminClient()
  let sections: any[] | undefined
  if (sectionsJson) {
    try {
      sections = JSON.parse(sectionsJson)
      if (!Array.isArray(sections)) throw new Error('sections must be an array')
    } catch (err: any) {
      return { ok: false, error: `JSON inválido: ${err.message}` }
    }
  } else {
    // Publicar el draft actual
    const { data: row } = await admin
      .from('kennel_pages')
      .select('draft_sections')
      .eq('kennel_id', kennelId).eq('slug', slug).maybeSingle()
    sections = (row?.draft_sections as any[]) || undefined
  }
  if (!sections) return { ok: false, error: 'Sin contenido que publicar' }

  const { error } = await admin
    .from('kennel_pages')
    .update({ sections, draft_sections: null, enabled: true })
    .eq('kennel_id', kennelId)
    .eq('slug', slug)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/web/${slug}`)
  return { ok: true }
}

export async function togglePageEnabledAction(kennelId: string, slug: string, enabled: boolean) {
  const admin = createKennelAdminClient()
  const { error } = await admin
    .from('kennel_pages')
    .update({ enabled })
    .eq('kennel_id', kennelId)
    .eq('slug', slug)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/web')
  return { ok: true }
}

export async function updatePageMetaAction(kennelId: string, slug: string, fields: { nav_label?: string | null; meta_title?: string | null; meta_description?: string | null }) {
  const admin = createKennelAdminClient()
  const { error } = await admin
    .from('kennel_pages')
    .update(fields)
    .eq('kennel_id', kennelId)
    .eq('slug', slug)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/web/${slug}`)
  return { ok: true }
}
