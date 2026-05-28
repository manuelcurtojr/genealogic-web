/**
 * GET /api/v1/dogs/[slug]/photos
 *
 * Galería ordenada de fotos del perro.
 */
import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const authResult = await authenticateRequest(request)
  if (!authResult.ok) return authResult.response
  const { kennelId } = authResult.auth

  const { slug } = await params
  const admin = getApiClient()

  const { data: dog } = await admin
    .from('dogs')
    .select('id, kennel_id')
    .eq('slug', slug)
    .maybeSingle()

  if (!dog) return jsonResponse({ error: 'Dog not found' }, 404)
  if (dog.kennel_id !== kennelId) {
    return jsonResponse({ error: 'Dog does not belong to authenticated kennel' }, 403)
  }

  const { data: photos } = await admin
    .from('dog_photos')
    .select('id, url, position, created_at')
    .eq('dog_id', dog.id)
    .order('position')

  return jsonResponse({ data: photos || [] })
}
