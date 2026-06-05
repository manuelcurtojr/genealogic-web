/**
 * POST /api/knowledge/import-url
 *
 * Body: { kennel_id, url, model_id? }
 *
 * Flujo: scrape → extract con IA → insert en knowledge_entries.
 * Devuelve preview de las entries creadas para que el usuario las revise.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { scrapeUrl } from '@/lib/ai/scrape'
import { extractKnowledgeFromText } from '@/lib/ai/extract'
import { saveExtractedEntries } from '@/lib/ai/save-entries'
import { logAIUsage } from '@/lib/ai/track'
import { userHasAddon } from '@/lib/kennel/addons-server'

export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'emailbot'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Emailbot' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { kennel_id, url, model_id } = body
  if (!kennel_id || !url) {
    return NextResponse.json({ error: 'kennel_id y url obligatorios' }, { status: 400 })
  }

  // Validar ownership del kennel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: kennel } = await admin
    .from('kennels')
    .select('id, owner_id, bot_model')
    .eq('id', kennel_id)
    .maybeSingle()
  if (!kennel) return NextResponse.json({ error: 'kennel_not_found' }, { status: 404 })
  if (kennel.owner_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // 1. Scrape
  let scrape
  try {
    scrape = await scrapeUrl(url)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'scrape_failed'
    return NextResponse.json({ error: `Error al cargar la URL: ${msg}` }, { status: 400 })
  }
  if (!scrape.text || scrape.text.length < 100) {
    return NextResponse.json({
      error: 'La página no contiene texto suficiente para extraer información útil',
    }, { status: 400 })
  }

  // 2. Extract con IA
  const modelId = model_id || kennel.bot_model
  let extract
  try {
    extract = await extractKnowledgeFromText({
      text: scrape.text,
      sourceHint: `web del criador: ${scrape.finalUrl}`,
      modelId,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'extract_failed'
    await logAIUsage({
      scope: 'knowledge_import_url',
      kennelId: kennel.id,
      userId: user.id,
      errorMessage: msg,
      requestMeta: { url: scrape.finalUrl },
    })
    return NextResponse.json({ error: `Error al procesar con IA: ${msg}` }, { status: 500 })
  }

  // 3. Log uso
  await logAIUsage({
    scope: 'knowledge_import_url',
    kennelId: kennel.id,
    userId: user.id,
    result: extract.usage,
    requestMeta: {
      url: scrape.finalUrl,
      page_title: scrape.title,
      page_bytes: scrape.bytes,
      entries_extracted: extract.entries.length,
    },
  })

  // 4. Save entries
  if (extract.entries.length === 0) {
    return NextResponse.json({
      ok: true,
      entries_created: 0,
      ids: [],
      message: 'La IA no encontró información estructurada útil en esta página',
      cost_usd: extract.usage.costUsd,
      model_used: extract.usage.resolvedModelId,
    })
  }

  let ids: string[] = []
  try {
    ids = await saveExtractedEntries({
      kennelId: kennel.id,
      entries: extract.entries,
      source: { type: 'url', url: scrape.finalUrl, meta: { page_title: scrape.title } },
    })
  } catch (e) {
    return NextResponse.json({
      error: `Error guardando entries: ${e instanceof Error ? e.message : 'unknown'}`,
    }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    entries_created: ids.length,
    ids,
    preview: extract.entries.slice(0, 3),
    cost_usd: extract.usage.costUsd,
    model_used: extract.usage.resolvedModelId,
    page_title: scrape.title,
    final_url: scrape.finalUrl,
  })
}
