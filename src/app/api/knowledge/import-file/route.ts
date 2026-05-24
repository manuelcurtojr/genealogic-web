/**
 * POST /api/knowledge/import-file
 *
 * multipart/form-data: { kennel_id, file, model_id? }
 *
 * Flujo: parse del PDF/DOC/TXT → extract con IA → insert en knowledge_entries.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { parseFile } from '@/lib/ai/parse-file'
import { extractKnowledgeFromText } from '@/lib/ai/extract'
import { saveExtractedEntries } from '@/lib/ai/save-entries'
import { logAIUsage } from '@/lib/ai/track'

export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const kennelId = formData.get('kennel_id') as string | null
  const file = formData.get('file') as File | null
  const modelIdParam = formData.get('model_id') as string | null

  if (!kennelId || !file) {
    return NextResponse.json({ error: 'kennel_id y file obligatorios' }, { status: 400 })
  }

  // Validar ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: kennel } = await admin
    .from('kennels')
    .select('id, owner_id, bot_model')
    .eq('id', kennelId)
    .maybeSingle()
  if (!kennel) return NextResponse.json({ error: 'kennel_not_found' }, { status: 404 })
  if (kennel.owner_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // 1. Parse del archivo
  const buf = Buffer.from(await file.arrayBuffer())
  let parsed
  try {
    parsed = await parseFile({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      buffer: buf,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'parse_failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  if (!parsed.text || parsed.text.length < 50) {
    return NextResponse.json({
      error: 'El archivo no contiene suficiente texto para extraer información',
    }, { status: 400 })
  }

  // 2. Extract con IA
  const modelId = modelIdParam || kennel.bot_model
  let extract
  try {
    extract = await extractKnowledgeFromText({
      text: parsed.text,
      sourceHint: `archivo subido: ${parsed.filename}`,
      modelId,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'extract_failed'
    await logAIUsage({
      scope: 'knowledge_import_file',
      kennelId: kennel.id,
      userId: user.id,
      errorMessage: msg,
      requestMeta: { filename: parsed.filename, pages: parsed.pages },
    })
    return NextResponse.json({ error: `Error al procesar con IA: ${msg}` }, { status: 500 })
  }

  // 3. Log uso
  await logAIUsage({
    scope: 'knowledge_import_file',
    kennelId: kennel.id,
    userId: user.id,
    result: extract.usage,
    requestMeta: {
      filename: parsed.filename,
      mime_type: parsed.mimeType,
      pages: parsed.pages,
      text_length: parsed.text.length,
      entries_extracted: extract.entries.length,
    },
  })

  // 4. Save entries
  if (extract.entries.length === 0) {
    return NextResponse.json({
      ok: true,
      entries_created: 0,
      ids: [],
      message: 'La IA no encontró información útil en este documento',
      cost_usd: extract.usage.costUsd,
      model_used: extract.usage.resolvedModelId,
    })
  }

  const isPdf = parsed.mimeType === 'application/pdf' || parsed.filename.toLowerCase().endsWith('.pdf')
  let ids: string[] = []
  try {
    ids = await saveExtractedEntries({
      kennelId: kennel.id,
      entries: extract.entries,
      source: {
        type: isPdf ? 'pdf' : 'doc',
        filename: parsed.filename,
        meta: { pages: parsed.pages, mime_type: parsed.mimeType },
      },
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
    filename: parsed.filename,
    pages: parsed.pages,
  })
}
