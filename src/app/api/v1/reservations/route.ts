/**
 * GET /api/v1/reservations
 *
 * Reservas activas del criadero (pipeline). NO incluye datos sensibles
 * del solicitante (email, teléfono, dirección) por compliance.
 *
 * Query params:
 *   - status: 'new' | 'evaluating' | 'deposit' | 'contract' | 'delivery' | 'lost'
 *   - active: 'true' (default) | 'false' (incluye cerradas)
 *   - limit: 1-100 (default 50)
 *   - offset: 0+ (default 0)
 */
import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if (!authResult.ok) return authResult.response
  const { kennelId } = authResult.auth

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const active = url.searchParams.get('active') !== 'false'
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0)

  const admin = getApiClient()
  let query = admin
    .from('puppy_reservations')
    .select(
      // Datos públicos al criadero — sin email/phone/dirección del solicitante.
      // El criadero puede ver esa data en el dashboard pero NO se expone via API.
      'id, status, litter_id, dog_id, puppy_dog_id, position_in_queue, ' +
      'preference_sex, preference_color, ' +
      'deposit_amount_cents, total_price_cents, currency, ' +
      'deposit_paid_at, contract_signed_at, delivered_at, ' +
      'reservation_signed_at, paid_in_full_at, ' +
      'created_at, updated_at, source, lost_at, lost_reason',
      { count: 'exact' },
    )
    .eq('kennel_id', kennelId)

  if (active) {
    query = query.is('lost_at', null).is('delivered_at', null)
  }
  if (status) query = query.eq('status', status)

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, count } = await query

  return jsonResponse({
    data: data || [],
    pagination: { total: count ?? 0, limit, offset },
  })
}
