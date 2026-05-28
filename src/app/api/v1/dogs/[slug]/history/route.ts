/**
 * GET /api/v1/dogs/[slug]/history
 *
 * Histórico de cambios del perro (audit log): fotos subidas, peso editado,
 * transferencias, palmarés añadido, etc. Útil para apps externas que
 * quieran mostrar "última actividad" o construir feeds.
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
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200)

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

  const { data: events } = await admin
    .from('dog_audit_log')
    .select('id, action, payload, actor_name, created_at')
    .eq('dog_id', dog.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return jsonResponse({ data: events || [] })
}
