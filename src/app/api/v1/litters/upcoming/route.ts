import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

/**
 * GET /api/v1/litters/upcoming
 * Returns litters that are planned or in gestation (status = 'planned' or 'mated').
 * Optimized for chatbots answering "do you have upcoming puppies?"
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) return auth.response

  const supabase = getApiClient()
  const { data, error } = await supabase
    .from('litters')
    .select(`
      id, status, mating_date, birth_date, puppy_count,
      breed:breeds(id, name),
      father:dogs!litters_father_id_fkey(id, name, slug, sex, thumbnail_url),
      mother:dogs!litters_mother_id_fkey(id, name, slug, sex, thumbnail_url)
    `)
    .eq('owner_id', auth.auth.ownerId)
    .eq('is_public', true)
    .in('status', ['planned', 'mated'])
    .order('mating_date', { ascending: true, nullsFirst: false })

  if (error) return jsonResponse({ error: error.message }, 500)
  return jsonResponse({ data: data || [] })
}
