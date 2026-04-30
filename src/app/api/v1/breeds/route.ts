import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

/**
 * GET /api/v1/breeds
 * Returns the breeds this kennel raises (based on dogs they own).
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) return auth.response

  const supabase = getApiClient()

  // Get distinct breed_ids from this kennel's dogs
  const { data: dogs, error: dogErr } = await supabase
    .from('dogs')
    .select('breed_id')
    .eq('kennel_id', auth.auth.kennelId)
    .not('breed_id', 'is', null)

  if (dogErr) return jsonResponse({ error: dogErr.message }, 500)

  const breedIds = Array.from(new Set((dogs || []).map((d: any) => d.breed_id).filter(Boolean)))
  if (breedIds.length === 0) return jsonResponse({ data: [] })

  const { data: breeds, error } = await supabase
    .from('breeds')
    .select('id, name, slug')
    .in('id', breedIds)
    .order('name')

  if (error) return jsonResponse({ error: error.message }, 500)
  return jsonResponse({ data: breeds || [] })
}
