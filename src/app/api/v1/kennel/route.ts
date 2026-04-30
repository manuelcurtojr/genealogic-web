import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

/**
 * GET /api/v1/kennel
 * Returns full info for the authenticated kennel.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) return auth.response

  const supabase = getApiClient()
  const { data, error } = await supabase
    .from('kennels')
    .select(`
      id, name, slug, description, foundation_date, website,
      logo_url, social_facebook, social_instagram, social_tiktok, social_youtube,
      whatsapp_phone, whatsapp_text, whatsapp_enabled,
      affix_format, breed_ids, country, city,
      created_at, updated_at
    `)
    .eq('id', auth.auth.kennelId)
    .single()

  if (error) return jsonResponse({ error: error.message }, 500)
  return jsonResponse(data)
}
