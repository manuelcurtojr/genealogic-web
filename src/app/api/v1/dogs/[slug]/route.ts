import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /api/v1/dogs/:slug
 * Returns a single dog (by slug or id) with its full pedigree (5 generations).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) return auth.response

  const { slug } = await params
  const supabase = getApiClient()

  // Try slug first, then id (UUID)
  const isUuid = UUID_RE.test(slug)

  const { data: dog, error } = await supabase
    .from('dogs')
    .select(`
      id, name, slug, sex, birth_date, registration, microchip,
      thumbnail_url, weight, height, is_public, is_for_sale,
      sale_price, sale_currency, sale_description, sale_location, sale_zipcode, sale_reservation_price,
      is_reproductive, breeding_rights,
      health_data, father_id, mother_id, created_at, updated_at,
      breed:breeds(id, name),
      color:colors(id, name)
    `)
    .eq('kennel_id', auth.auth.kennelId)
    .eq(isUuid ? 'id' : 'slug', slug)
    .is('hidden_at', null)
    .single()

  if (error || !dog) return jsonResponse({ error: 'Dog not found' }, 404)

  // Pedigree (5 generations)
  const { data: pedigree } = await supabase.rpc('get_pedigree', { dog_uuid: dog.id, max_gen: 5 })

  // Photos
  const { data: photos } = await supabase
    .from('dog_photos')
    .select('id, url, position')
    .eq('dog_id', dog.id)
    .order('position')

  return jsonResponse({
    ...dog,
    pedigree: pedigree || [],
    photos: (photos || []).map((p: any) => p.url),
  })
}

/**
 * PATCH /api/v1/dogs/:slug
 * Updates sale-related fields on a dog. Used by the user's own automations
 * (Make, Zapier, scripts) to mark a dog as sold, change price, or update sale info.
 *
 * Whitelist of mutable fields (everything else is ignored):
 *   - is_for_sale       (boolean)
 *   - sale_price        (number | null)
 *   - sale_currency     (string | null)
 *   - sale_description  (string | null)
 *   - sale_location     (string | null)
 *   - sale_zipcode      (string | null)
 *   - sale_reservation_price (number | null)
 *   - is_reproductive   (boolean)
 *   - breeding_rights   (boolean)
 *
 * Scope: only dogs belonging to the API key's kennel can be modified.
 */
const DOG_PATCH_FIELDS = [
  'is_for_sale',
  'sale_price',
  'sale_currency',
  'sale_description',
  'sale_location',
  'sale_zipcode',
  'sale_reservation_price',
  'is_reproductive',
  'breeding_rights',
] as const

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) return auth.response

  const { slug } = await params
  const supabase = getApiClient()
  const isUuid = UUID_RE.test(slug)

  // Parse body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  // Whitelist fields
  const update: Record<string, unknown> = {}
  for (const f of DOG_PATCH_FIELDS) {
    if (f in body) update[f] = body[f]
  }
  if (Object.keys(update).length === 0) {
    return jsonResponse(
      { error: 'No updatable fields in body', allowed: DOG_PATCH_FIELDS },
      400,
    )
  }

  // Validate types (lightweight)
  if ('is_for_sale' in update && typeof update.is_for_sale !== 'boolean') {
    return jsonResponse({ error: 'is_for_sale must be boolean' }, 400)
  }
  if ('is_reproductive' in update && typeof update.is_reproductive !== 'boolean') {
    return jsonResponse({ error: 'is_reproductive must be boolean' }, 400)
  }
  if ('breeding_rights' in update && typeof update.breeding_rights !== 'boolean') {
    return jsonResponse({ error: 'breeding_rights must be boolean' }, 400)
  }
  if ('sale_price' in update && update.sale_price !== null && typeof update.sale_price !== 'number') {
    return jsonResponse({ error: 'sale_price must be number or null' }, 400)
  }
  if (
    'sale_reservation_price' in update &&
    update.sale_reservation_price !== null &&
    typeof update.sale_reservation_price !== 'number'
  ) {
    return jsonResponse({ error: 'sale_reservation_price must be number or null' }, 400)
  }

  // Ensure dog exists and belongs to this kennel before updating
  const { data: existing, error: findErr } = await supabase
    .from('dogs')
    .select('id')
    .eq('kennel_id', auth.auth.kennelId)
    .eq(isUuid ? 'id' : 'slug', slug)
    .single()

  if (findErr || !existing) return jsonResponse({ error: 'Dog not found' }, 404)

  const { data: updated, error: updateErr } = await supabase
    .from('dogs')
    .update(update)
    .eq('id', existing.id)
    .eq('kennel_id', auth.auth.kennelId)
    .select(`
      id, name, slug, sex, is_for_sale, sale_price, sale_currency,
      sale_description, sale_location, sale_zipcode, sale_reservation_price,
      is_reproductive, breeding_rights, updated_at
    `)
    .single()

  if (updateErr) return jsonResponse({ error: updateErr.message }, 500)

  return jsonResponse(updated)
}
