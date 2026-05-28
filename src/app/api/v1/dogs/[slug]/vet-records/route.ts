/**
 * GET /api/v1/dogs/[slug]/vet-records
 *
 * Cartilla veterinaria pública del perro. Solo registros con is_public=true.
 *
 * Acceso: Kennel Enterprise (api-auth.ts hace el gate).
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

  // Resolver perro por slug y verificar que pertenece al kennel autenticado
  const { data: dog } = await admin
    .from('dogs')
    .select('id, kennel_id')
    .eq('slug', slug)
    .maybeSingle()

  if (!dog) return jsonResponse({ error: 'Dog not found' }, 404)
  if (dog.kennel_id !== kennelId) {
    return jsonResponse({ error: 'Dog does not belong to authenticated kennel' }, 403)
  }

  const { data: records } = await admin
    .from('vet_records')
    .select('id, type, title, date, next_date, notes, file_url, created_at')
    .eq('dog_id', dog.id)
    .eq('is_public', true)
    .order('date', { ascending: false })

  return jsonResponse({ data: records || [] })
}
