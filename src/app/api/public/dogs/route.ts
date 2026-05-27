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

  // Construir filtro base. Para `q` usamos search_text (lower+unaccent+
  // sin caracteres no-alfanuméricos) con el índice GIN trigram, en lugar
  // del ILIKE sobre `name` original que no aprovecha el índice y hace
  // seq scan sobre 230k filas.
  function normalizeForSearch(input: string): string {
    return input.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const normalizedQ = q ? normalizeForSearch(q) : ''

  function applyFilters(query: any) {
    if (normalizedQ.length >= 2) {
      query = query.ilike('search_text', `%${normalizedQ}%`)
    }
    if (breedId) query = query.eq('breed_id', breedId)
    if (sex) query = query.eq('sex', sex)
    if (forSale) query = query.eq('is_for_sale', true)
    return query.eq('is_public', true)
  }

  // Total con foto — usamos count: 'estimated' (rápido, ±5%) en vez de
  // 'exact' (seq scan). El total se usa solo para mostrar "X de Y" y
  // paginación; precisión absoluta no es crítica.
  const { count: withPhotoCount } = await applyFilters(
    admin.from('dogs').select('id', { count: 'estimated', head: true }).not('thumbnail_url', 'is', null),
  )
  const { count: withoutPhotoCount } = await applyFilters(
    admin.from('dogs').select('id', { count: 'estimated', head: true }).is('thumbnail_url', null),
  )

  const totalWithPhoto = withPhotoCount || 0
  const totalWithoutPhoto = withoutPhotoCount || 0
  const total = totalWithPhoto + totalWithoutPhoto

  // Calcular qué cargar en esta página
  const startGlobal = (page - 1) * pageSize
  const endGlobal = startGlobal + pageSize

  const selectFields = 'id, slug, name, sex, thumbnail_url, birth_date, sale_price, sale_currency, sale_location, is_for_sale, breed:breeds(name), kennel:kennels(name)'

  // ¿Hay algún filtro aplicado? Sin filtros → balancear por raza
  // (RPC search_dogs_balanced) para evitar mostrar solo galgos italianos
  // (último import masivo). Con filtros → query directa por created_at.
  const hasFilters = !!(q || breedId || sex || forSale)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[] = []

  if (!hasFilters) {
    // Modo balanceado: 1 perro por raza, luego 2, etc.
    // ─ Slice con foto ─
    if (startGlobal < totalWithPhoto) {
      const sliceStart = startGlobal
      const sliceEnd = Math.min(endGlobal, totalWithPhoto)
      const { data: withPhoto } = await admin.rpc('search_dogs_balanced', {
        p_with_photo: true,
        p_offset: sliceStart,
        p_limit: sliceEnd - sliceStart,
      })
      // Mapear nombres de columnas RPC → estructura esperada por el cliente
      rows = rows.concat(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (withPhoto || []).map((r: any) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          sex: r.sex,
          thumbnail_url: r.thumbnail_url,
          birth_date: r.birth_date,
          sale_price: r.sale_price,
          sale_currency: r.sale_currency,
          sale_location: r.sale_location,
          is_for_sale: r.is_for_sale,
          breed: r.breed_name ? { name: r.breed_name } : null,
          kennel: r.kennel_name ? { name: r.kennel_name } : null,
        })),
      )
    }
    // ─ Slice sin foto ─
    if (endGlobal > totalWithPhoto) {
      const sliceStart = Math.max(0, startGlobal - totalWithPhoto)
      const sliceEnd = endGlobal - totalWithPhoto
      const { data: withoutPhoto } = await admin.rpc('search_dogs_balanced', {
        p_with_photo: false,
        p_offset: sliceStart,
        p_limit: sliceEnd - sliceStart,
      })
      rows = rows.concat(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (withoutPhoto || []).map((r: any) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          sex: r.sex,
          thumbnail_url: r.thumbnail_url,
          birth_date: r.birth_date,
          sale_price: r.sale_price,
          sale_currency: r.sale_currency,
          sale_location: r.sale_location,
          is_for_sale: r.is_for_sale,
          breed: r.breed_name ? { name: r.breed_name } : null,
          kennel: r.kennel_name ? { name: r.kennel_name } : null,
        })),
      )
    }
  } else {
    // Con filtros: query directa, orden created_at desc
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
