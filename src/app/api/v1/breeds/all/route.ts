/**
 * GET /api/v1/breeds/all
 *
 * Catálogo GLOBAL de razas (no solo las del kennel autenticado). Útil
 * para apps externas que necesiten construir selectors o linkar al
 * estándar racial.
 *
 * Query params:
 *   - q: búsqueda por nombre (mínimo 2 caracteres)
 *   - limit: 1-200 (default 100)
 */
import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if (!authResult.ok) return authResult.response

  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim() || ''
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 200)

  const admin = getApiClient()
  let query = admin
    .from('breeds')
    .select('id, name, slug, description, image_url', { count: 'exact' })
    .order('name')
    .limit(limit)

  if (q.length >= 2) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data, count } = await query

  return jsonResponse({
    data: data || [],
    pagination: { total: count ?? 0, limit },
  })
}
