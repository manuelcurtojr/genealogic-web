/**
 * GET /api/v1/search
 *
 * Búsqueda global en el catálogo público de Genealogic (no solo en el
 * kennel autenticado). Reutiliza las RPCs `search_*_smart` con índice
 * GIN trigram — devuelve perros, criaderos y razas mezclados.
 *
 * Query params (al menos uno):
 *   - q: cadena de búsqueda (mínimo 2 caracteres)
 *   - type: 'dogs' | 'kennels' | 'breeds' | 'all' (default 'all')
 *   - limit: 1-50 por tipo (default 10)
 */
import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if (!authResult.ok) return authResult.response

  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim() || ''
  const type = url.searchParams.get('type') || 'all'
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 50)

  if (q.length < 2) {
    return jsonResponse({ error: 'Query must be at least 2 characters', param: 'q' }, 400)
  }

  const admin = getApiClient()

  // Disparamos los 3 RPC en paralelo; cada uno es un thenable de Supabase
  // que resuelve a { data, error }. Lo envolvemos para devolver el array.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exec = async (name: string): Promise<any[]> => {
    const res = await admin.rpc(name, { q, lim: limit })
    return (res.data as unknown[]) || []
  }

  const wantDogs = type === 'all' || type === 'dogs'
  const wantKennels = type === 'all' || type === 'kennels'
  const wantBreeds = type === 'all' || type === 'breeds'

  const [dogs, kennels, breeds] = await Promise.all([
    wantDogs ? exec('search_dogs_smart') : Promise.resolve([]),
    wantKennels ? exec('search_kennels_smart') : Promise.resolve([]),
    wantBreeds ? exec('search_breeds_smart') : Promise.resolve([]),
  ])

  const payload: Record<string, unknown> = { q }
  if (wantDogs) payload.dogs = dogs
  if (wantKennels) payload.kennels = kennels
  if (wantBreeds) payload.breeds = breeds

  return jsonResponse(payload)
}
