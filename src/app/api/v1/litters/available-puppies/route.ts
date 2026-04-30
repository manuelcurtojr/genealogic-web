import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

/**
 * GET /api/v1/litters/available-puppies
 * Returns dogs that:
 *   - belong to this kennel
 *   - are for sale (is_for_sale = true)
 *   - are public (is_public = true)
 * Optimized for chatbots answering "do you have puppies available?"
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) return auth.response

  const supabase = getApiClient()
  const { data, error } = await supabase
    .from('dogs')
    .select(`
      id, name, slug, sex, birth_date, thumbnail_url,
      sale_price, sale_currency, sale_description, sale_location,
      breed:breeds(id, name, slug),
      color:colors(id, name)
    `)
    .eq('kennel_id', auth.auth.kennelId)
    .eq('is_for_sale', true)
    .eq('is_public', true)
    .order('birth_date', { ascending: false, nullsFirst: false })

  if (error) return jsonResponse({ error: error.message }, 500)
  return jsonResponse({ data: data || [] })
}
