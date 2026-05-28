/**
 * GET /api/v1/kennels/[slug]
 *
 * Información PÚBLICA de cualquier criadero del catálogo Genealogic
 * (no solo el del kennel autenticado). Útil para apps externas que
 * quieran enlazar a otros criaderos, mostrar la línea de origen de un
 * cachorro, etc.
 *
 * Solo devuelve campos públicos — datos sensibles (Stripe, emails
 * internos) se filtran.
 */
import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const authResult = await authenticateRequest(request)
  if (!authResult.ok) return authResult.response

  const { slug } = await params
  const admin = getApiClient()

  const { data: kennel, error } = await admin
    .from('kennels')
    .select(
      'id, name, slug, description, logo_url, hero_image_url, ' +
      'city, country, website, ' +
      'social_instagram, social_facebook, social_youtube, social_tiktok, ' +
      'whatsapp_phone, foundation_date, created_at',
    )
    .eq('slug', slug)
    .maybeSingle<{ id: string; [k: string]: unknown }>()

  if (error || !kennel) return jsonResponse({ error: 'Kennel not found' }, 404)

  // Conteo de perros públicos (signal de tamaño del criadero)
  const { count: dogsCount } = await admin
    .from('dogs')
    .select('id', { count: 'exact', head: true })
    .eq('kennel_id', kennel.id)
    .eq('is_public', true)

  return jsonResponse({
    ...kennel,
    dogs_public_count: dogsCount ?? 0,
  })
}
