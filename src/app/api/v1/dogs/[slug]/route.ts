import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

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
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  const { data: dog, error } = await supabase
    .from('dogs')
    .select(`
      id, name, slug, sex, birth_date, registration, microchip,
      thumbnail_url, weight, height, is_public, is_for_sale,
      sale_price, sale_currency, sale_description, sale_location, sale_zipcode, sale_reservation_price,
      is_reproductive, breeding_rights, verification, is_verified,
      health_data, father_id, mother_id, created_at, updated_at,
      breed:breeds(id, name, slug),
      color:colors(id, name)
    `)
    .eq('kennel_id', auth.auth.kennelId)
    .eq(isUuid ? 'id' : 'slug', slug)
    .single()

  if (error || !dog) return jsonResponse({ error: 'Dog not found' }, 404)
  if (!dog.is_public) return jsonResponse({ error: 'Dog is not public' }, 403)

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
