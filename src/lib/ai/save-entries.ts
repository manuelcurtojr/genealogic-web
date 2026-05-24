/**
 * Persiste las entries extraídas por la IA en knowledge_entries.
 * Devuelve los IDs creados para mostrar feedback al usuario.
 *
 * Estrategia: simple insert con source_type/source_url/source_filename para
 * trazabilidad. No deduplicamos (preferimos mostrar duplicados al usuario y
 * que él borre los redundantes — la dedup automática puede borrar info útil).
 */
import 'server-only'
import { createKennelAdminClient } from '@/lib/supabase/server'
import type { ExtractedEntry } from './extract'

export type SaveSource =
  | { type: 'url'; url: string; meta?: Record<string, unknown> }
  | { type: 'pdf'; filename: string; meta?: Record<string, unknown> }
  | { type: 'doc'; filename: string; meta?: Record<string, unknown> }

export async function saveExtractedEntries(args: {
  kennelId: string
  entries: ExtractedEntry[]
  source: SaveSource
}): Promise<string[]> {
  if (args.entries.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // Obtener la última posición para apendar al final
  const { data: maxRow } = await admin
    .from('knowledge_entries')
    .select('position')
    .eq('kennel_id', args.kennelId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  let nextPosition = (maxRow?.position ?? -1) + 1

  const rows = args.entries.map((e) => ({
    kennel_id: args.kennelId,
    category: e.category,
    title: e.title,
    content: e.content,
    position: nextPosition++,
    is_active: true,
    source_type: args.source.type,
    source_url: args.source.type === 'url' ? args.source.url : null,
    source_filename: args.source.type !== 'url' ? args.source.filename : null,
    source_meta: args.source.meta || null,
  }))

  const { data, error } = await admin
    .from('knowledge_entries')
    .insert(rows)
    .select('id')
  if (error) throw new Error(error.message)
  return (data || []).map((r: { id: string }) => r.id)
}
