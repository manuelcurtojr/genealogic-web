/**
 * GET /api/v1/dogs/[slug]/pedigree
 *
 * Genealogía expandida del perro hasta N generaciones, vía la RPC
 * `get_pedigree` que ya usa el cliente web. Devuelve un grafo plano
 * (todos los ancestros + father_id/mother_id por nodo) que el cliente
 * puede componer como árbol.
 *
 * El COI Wright se debe calcular en cliente con los nodos devueltos —
 * el algoritmo es trivial (path sum sobre ancestros comunes) y evita
 * inconsistencias entre lo que cachearíamos y la realidad del árbol.
 *
 * Query params:
 *   - generations: 1-10 (default 5)
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
  const generations = Math.min(parseInt(url.searchParams.get('generations') || '5', 10) || 5, 10)

  const admin = getApiClient()

  const { data: dog } = await admin
    .from('dogs')
    .select('id, name, kennel_id')
    .eq('slug', slug)
    .maybeSingle()

  if (!dog) return jsonResponse({ error: 'Dog not found' }, 404)
  if (dog.kennel_id !== kennelId) {
    return jsonResponse({ error: 'Dog does not belong to authenticated kennel' }, 403)
  }

  // El nombre real de los parámetros en la RPC es (dog_uuid, max_gen).
  const { data: nodes } = await admin.rpc('get_pedigree', {
    dog_uuid: dog.id,
    max_gen: generations,
  })

  return jsonResponse({
    root_dog_id: dog.id,
    root_dog_name: dog.name,
    generations,
    nodes: nodes || [],
  })
}
