/**
 * GET /api/public/dogs — búsqueda paginada de perros públicos.
 *
 * Query params:
 *   q              búsqueda por nombre (ilike %q%)
 *   breed_id       filtrar por raza
 *   sex            'male' | 'female'
 *   for_sale       '1' o 'true' para solo en venta
 *   page           1-indexed (default 1)
 *   page_size      max 50 (default 24)
 *
 * Orden: perros CON foto primero (created_at desc), luego sin foto.
 *
 * Cache: 60s en CDN (los cambios al directorio público no son urgentes;
 * priorizamos latencia y coste de DB).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createKennelAdminClient } from '@/lib/supabase/server'

const MAX_PAGE_SIZE = 50
const DEFAULT_PAGE_SIZE = 24

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const q = sp.get('q')?.trim() || ''
  const breedId = sp.get('breed_id') || ''
  const sex = sp.get('sex') || ''
  const forSale = sp.get('for_sale') === '1' || sp.get('for_sale') === 'true'
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(sp.get('page_size') || String(DEFAULT_PAGE_SIZE), 10)),
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // Estrategia de paginación "foto primero + recientes":
  //  - Página 1: hasta pageSize perros CON foto
  //  - Cuando se acaban los con foto, empieza a servir los sin foto
  // En vez de hacer un OR compuesto, hacemos 2 queries con offsets separados.
  // Más simple, más predecible, y permite mostrar "X de Y" correcto.

  // Construir filtro base
  function applyFilters(query: any) {
    if (q) query = query.ilike('name', `%${q}%`)
    if (breedId) query = query.eq('breed_id', breedId)
    if (sex) query = query.eq('sex', sex)
    if (forSale) query = query.eq('is_for_sale', true)
    return query.eq('is_public', true)
  }

  // Total con foto
  const { count: withPhotoCount } = await applyFilters(
    admin.from('dogs').select('id', { count: 'exact', head: true }).not('thumbnail_url', 'is', null),
  )
  // Total sin foto
  const { count: withoutPhotoCount } = await applyFilters(
    admin.from('dogs').select('id', { count: 'exact', head: true }).is('thumbnail_url', null),
  )

  const totalWithPhoto = withPhotoCount || 0
  const totalWithoutPhoto = withoutPhotoCount || 0
  const total = totalWithPhoto + totalWithoutPhoto

  // Calcular qué cargar en esta página
  const startGlobal = (page - 1) * pageSize
  const endGlobal = startGlobal + pageSize

  const selectFields = 'id, slug, name, sex, thumbnail_url, birth_date, sale_price, sale_currency, sale_location, is_for_sale, breed:breeds(name), kennel:kennels(name)'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[] = []

  // Slice 1: perros con foto (si la página los toca)
  if (startGlobal < totalWithPhoto) {
    const sliceStart = startGlobal
    const sliceEnd = Math.min(endGlobal, totalWithPhoto)
    const { data: withPhoto } = await applyFilters(
      admin.from('dogs').select(selectFields).not('thumbnail_url', 'is', null),
    )
      .order('created_at', { ascending: false })
      .range(sliceStart, sliceEnd - 1)
    rows = rows.concat(withPhoto || [])
  }

  // Slice 2: perros sin foto (si la página los toca)
  if (endGlobal > totalWithPhoto) {
    const sliceStart = Math.max(0, startGlobal - totalWithPhoto)
    const sliceEnd = endGlobal - totalWithPhoto
    const { data: withoutPhoto } = await applyFilters(
      admin.from('dogs').select(selectFields).is('thumbnail_url', null),
    )
      .order('created_at', { ascending: false })
      .range(sliceStart, sliceEnd - 1)
    rows = rows.concat(withoutPhoto || [])
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
