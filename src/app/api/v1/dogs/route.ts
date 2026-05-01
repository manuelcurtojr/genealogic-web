import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

/**
 * GET /api/v1/dogs
 * Query params:
 *   - sex: 'male' | 'female'
 *   - for_sale: 'true' | 'false'
 *   - reproductive: 'true' | 'false'
 *   - breed_slug: string (TODO)
 *   - limit: number (max 100, default 50)
 *   - offset: number (default 0)
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const sex = url.searchParams.get('sex')
  const forSale = url.searchParams.get('for_sale')
  const reproductive = url.searchParams.get('reproductive')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0')

  const supabase = getApiClient()
  let query = supabase
    .from('dogs')
    .select(`
      id, name, slug, sex, birth_date, registration, microchip,
      thumbnail_url, weight, height, is_public, is_for_sale,
      sale_price, sale_currency, sale_description, sale_location,
      is_reproductive, breeding_rights,
      father_id, mother_id, created_at, updated_at,
      breed:breeds(id, name),
      color:colors(id, name)
    `, { count: 'exact' })
    .eq('kennel_id', auth.auth.kennelId)
    .eq('is_public', true)

  if (sex === 'male' || sex === 'female') query = query.eq('sex', sex)
  if (forSale === 'true') query = query.eq('is_for_sale', true)
  if (forSale === 'false') query = query.eq('is_for_sale', false)
  if (reproductive === 'true') query = query.eq('is_reproductive', true)

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) return jsonResponse({ error: error.message }, 500)

  return jsonResponse({
    data: data || [],
    pagination: { total: count || 0, limit, offset },
  })
}
