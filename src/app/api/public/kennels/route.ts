/**
 * GET /api/public/kennels — directorio paginado de criaderos.
 *
 * Query params:
 *   q              búsqueda por nombre (ilike %q%)
 *   country        filtro ISO2 / nombre del país
 *   breed_id       filtrar por raza (overlap con breed_ids array)
 *   page           1-indexed (default 1)
 *   page_size      max 60 (default 30)
 *
 * Orden: kennels con logo primero (created_at desc), luego sin logo.
 * Cache 60s.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createKennelAdminClient } from '@/lib/supabase/server'

const MAX_PAGE_SIZE = 60
const DEFAULT_PAGE_SIZE = 30

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const q = sp.get('q')?.trim() || ''
  const country = sp.get('country') || ''
  const breedId = sp.get('breed_id') || ''
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(sp.get('page_size') || String(DEFAULT_PAGE_SIZE), 10)),
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  function applyFilters(query: any) {
    if (q) query = query.ilike('name', `%${q}%`)
    if (country) query = query.eq('country', country)
    if (breedId) query = query.contains('breed_ids', [breedId])
    // Excluir criaderos ocultos por moderación
    return query.is('hidden_at', null)
  }

  // Total con logo
  const { count: withLogoCount } = await applyFilters(
    admin.from('kennels').select('id', { count: 'exact', head: true }).not('logo_url', 'is', null),
  )
  // Total sin logo
  const { count: withoutLogoCount } = await applyFilters(
    admin.from('kennels').select('id', { count: 'exact', head: true }).is('logo_url', null),
  )

  const totalWithLogo = withLogoCount || 0
  const totalWithoutLogo = withoutLogoCount || 0
  const total = totalWithLogo + totalWithoutLogo

  const startGlobal = (page - 1) * pageSize
  const endGlobal = startGlobal + pageSize

  const selectFields = 'id, slug, name, logo_url, description, foundation_date, country, city'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[] = []

  if (startGlobal < totalWithLogo) {
    const sliceStart = startGlobal
    const sliceEnd = Math.min(endGlobal, totalWithLogo)
    const { data: withLogo } = await applyFilters(
      admin.from('kennels').select(selectFields).not('logo_url', 'is', null),
    )
      .order('created_at', { ascending: false })
      .range(sliceStart, sliceEnd - 1)
    rows = rows.concat(withLogo || [])
  }

  if (endGlobal > totalWithLogo) {
    const sliceStart = Math.max(0, startGlobal - totalWithLogo)
    const sliceEnd = endGlobal - totalWithLogo
    const { data: withoutLogo } = await applyFilters(
      admin.from('kennels').select(selectFields).is('logo_url', null),
    )
      .order('created_at', { ascending: false })
      .range(sliceStart, sliceEnd - 1)
    rows = rows.concat(withoutLogo || [])
  }

  const hasMore = endGlobal < total

  return NextResponse.json({
    rows,
    page,
    page_size: pageSize,
    total,
    has_more: hasMore,
  })
}
