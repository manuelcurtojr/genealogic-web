import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

/**
 * GET /api/v1/litters
 * Query params:
 *   - status: 'planned' | 'mated' | 'born'
 *   - limit, offset
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0')

  const supabase = getApiClient()
  let query = supabase
    .from('litters')
    .select(`
      id, status, mating_date, birth_date, puppy_count, is_public,
      created_at, updated_at,
      breed:breeds(id, name),
      father:dogs!litters_father_id_fkey(id, name, slug, sex, thumbnail_url),
      mother:dogs!litters_mother_id_fkey(id, name, slug, sex, thumbnail_url)
    `, { count: 'exact' })
    .eq('owner_id', auth.auth.ownerId)
    .eq('is_public', true)

  if (status === 'planned' || status === 'mated' || status === 'born') {
    query = query.eq('status', status)
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) return jsonResponse({ error: error.message }, 500)

  return jsonResponse({
    data: data || [],
    pagination: { total: count || 0, limit, offset },
  })
}
