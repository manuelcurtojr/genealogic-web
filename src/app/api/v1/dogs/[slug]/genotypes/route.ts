/**
 * GET /api/v1/dogs/[slug]/genotypes
 *
 * Genotipos del perro (locus E, B, K, D, A, S...). Sin filtro is_public
 * porque esta tabla no tiene esa columna — son datos genéticos del
 * propio criadero, expuestos solo al criadero autenticado.
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

  const { data: genotypes } = await admin
    .from('dog_genotypes')
    .select('id, locus, allele_1, allele_2, source, confidence, notes, updated_at')
    .eq('dog_id', dog.id)
    .order('locus')

  return jsonResponse({ data: genotypes || [] })
}
