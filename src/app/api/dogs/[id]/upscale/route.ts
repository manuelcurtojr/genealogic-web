/**
 * POST /api/dogs/[id]/upscale
 *
 * Mejora una foto del perro con IA (Real-ESRGAN vía Replicate) y la
 * reemplaza en el storage del criadero.
 *
 * Body: { photoId: string }
 *
 * Cuota:
 *   · Kennel Pro / Enterprise → ilimitado
 *   · Owner / Kennel Free     → 5 gratis (contador en profiles)
 *
 * Seguridad: requiere sesión y que el perro pertenezca al usuario.
 */
import { NextResponse } from 'next/server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { hasProFeatures } from '@/lib/permissions'
import { isReplicateConfigured, upscaleImageUrl } from '@/lib/replicate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const FREE_UPSCALE_LIMIT = 5

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: dogId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (!isReplicateConfigured()) {
    return NextResponse.json(
      { error: 'El upscale con IA aún no está disponible. Vuelve pronto.' },
      { status: 503 },
    )
  }

  let body: { photoId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const photoId = body.photoId
  if (!photoId) return NextResponse.json({ error: 'Falta photoId' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // 1) Verificar propiedad del perro + cargar la foto
  const [{ data: dog }, { data: photo }, { data: profile }] = await Promise.all([
    admin.from('dogs').select('id, owner_id, thumbnail_url').eq('id', dogId).maybeSingle(),
    admin.from('dog_photos').select('id, dog_id, url, storage_path, upscaled_at').eq('id', photoId).maybeSingle(),
    admin.from('profiles').select('plan, photo_upscales_used').eq('id', user.id).maybeSingle(),
  ])

  if (!dog || !photo) return NextResponse.json({ error: 'Perro o foto no encontrados' }, { status: 404 })
  if (dog.owner_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (photo.dog_id !== dogId) return NextResponse.json({ error: 'La foto no pertenece a este perro' }, { status: 400 })

  // 2) Cuota por plan
  const isPro = hasProFeatures(profile?.plan)
  const used = profile?.photo_upscales_used ?? 0
  if (!isPro && used >= FREE_UPSCALE_LIMIT) {
    return NextResponse.json(
      {
        error: `Has usado tus ${FREE_UPSCALE_LIMIT} mejoras gratis. Pásate a Kennel Pro para mejoras de foto ilimitadas.`,
        code: 'UPSCALE_LIMIT',
      },
      { status: 402 },
    )
  }

  // 3) Llamar a Replicate
  let outUrl: string
  try {
    outUrl = await upscaleImageUrl(photo.url, 2)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error al mejorar la imagen' }, { status: 502 })
  }

  // 4) Descargar el resultado y subirlo a nuestro storage
  const imgRes = await fetch(outUrl)
  if (!imgRes.ok) return NextResponse.json({ error: 'No se pudo descargar la imagen mejorada' }, { status: 502 })
  const bytes = new Uint8Array(await imgRes.arrayBuffer())
  const newPath = `${user.id}/${dogId}/upscaled-${Date.now()}.png`
  const { error: upErr } = await admin.storage
    .from('dog-photos')
    .upload(newPath, bytes, { contentType: 'image/png', upsert: false })
  if (upErr) return NextResponse.json({ error: `Error al guardar: ${upErr.message}` }, { status: 500 })

  const { data: pub } = admin.storage.from('dog-photos').getPublicUrl(newPath)
  const newUrl = pub.publicUrl

  // 5) Actualizar la fila de la foto (guardando la ruta original por si hay
  //    que revertir) + el thumbnail del perro si esta era la portada.
  await admin.from('dog_photos').update({
    url: newUrl,
    storage_path: newPath,
    storage_path_original: photo.storage_path || null,
    upscaled_at: new Date().toISOString(),
  }).eq('id', photoId)

  // Si esta foto es la portada, actualizamos el thumbnail del perro y los
  // campos que usa el badge público "Mejorada con IA" (AiUpscaledBadge lee
  // dogs.thumbnail_upscaled_at + original_thumbnail_url).
  if (dog.thumbnail_url && dog.thumbnail_url === photo.url) {
    await admin.from('dogs').update({
      thumbnail_url: newUrl,
      original_thumbnail_url: photo.url,
      thumbnail_upscaled_at: new Date().toISOString(),
    }).eq('id', dogId)
  }

  // 6) Incrementar contador solo en planes gratuitos
  let remaining: number | null = null
  if (!isPro) {
    const newUsed = used + 1
    await admin.from('profiles').update({ photo_upscales_used: newUsed }).eq('id', user.id)
    remaining = Math.max(0, FREE_UPSCALE_LIMIT - newUsed)
  }

  return NextResponse.json({ ok: true, url: newUrl, remaining, unlimited: isPro })
}
