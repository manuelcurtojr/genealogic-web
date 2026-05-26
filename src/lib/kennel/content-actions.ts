/**
 * Server actions para editar el CONTENIDO de la web Pro del criador.
 *
 *  - saveAboutMdAction:        update kennels.about_md
 *  - uploadKennelPhotoAction:  sube archivo a Storage + INSERT kennel_photos
 *  - deleteKennelPhotoAction:  DELETE kennel_photos + remove de Storage
 *  - reorderKennelPhotosAction: actualiza position en bulk
 *  - createPostAction, updatePostAction, deletePostAction: kennel_posts
 *
 * Todas las actions verifican owner del kennel + plan Pro o enterprise antes
 * de mutar. revalidatePath limpia caché del panel admin y del perfil público.
 */
'use server'

import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isKennelPro, isEnterpriseUser, normalizePlan } from '@/lib/permissions'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function requireOwnerOfProKennel(kennelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, owner_id')
    .eq('id', kennelId)
    .single()
  if (!kennel) throw new Error('kennel_not_found')
  if (kennel.owner_id !== user.id) throw new Error('forbidden')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()
  const userPlan = normalizePlan(profile?.plan)
  const isEnterprise = isEnterpriseUser(user.id)
  if (!isEnterprise && !isKennelPro(userPlan)) throw new Error('requires_kennel_pro')

  return { supabase, user, kennel }
}

function revalidateKennelPages(slug: string | null) {
  // Paths concretos en vez de 'layout' — más predecible, evita confundir a
  // los RSC payloads cuando el server action se llama desde un sub-route.
  revalidatePath('/kennel')
  revalidatePath('/kennel/contenido/sobre')
  revalidatePath('/kennel/contenido/galeria')
  revalidatePath('/kennel/contenido/instalaciones')
  revalidatePath('/kennel/contenido/blog')
  if (slug) {
    revalidatePath(`/kennels/${slug}`)
    revalidatePath(`/kennels/${slug}/sobre`)
    revalidatePath(`/kennels/${slug}/galeria`)
    revalidatePath(`/kennels/${slug}/instalaciones`)
    revalidatePath(`/kennels/${slug}/blog`)
  }
}

// ═══ Sobre nosotros ═════════════════════════════════════════════════════════

export async function saveAboutMdAction(input: {
  kennelId: string
  aboutMd: string
}): Promise<{ ok: true }> {
  const { supabase, kennel } = await requireOwnerOfProKennel(input.kennelId)

  // Limpieza ligera: trim final, máximo 30k chars (sobreestimado pero acota)
  const cleaned = input.aboutMd.trim().slice(0, 30000)

  const { error } = await supabase
    .from('kennels')
    .update({ about_md: cleaned })
    .eq('id', input.kennelId)
  if (error) throw new Error(error.message)

  revalidateKennelPages(kennel.slug)
  return { ok: true }
}

// ═══ Fotos (galería + instalaciones) ════════════════════════════════════════

const STORAGE_BUCKET = 'kennels'
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function uploadKennelPhotoAction(formData: FormData): Promise<{
  id: string; url: string
}> {
  const kennelId = formData.get('kennelId') as string
  const kind = formData.get('kind') as 'gallery' | 'facilities'
  const caption = (formData.get('caption') as string | null)?.trim() || null
  const file = formData.get('file')

  if (!kennelId) throw new Error('missing_kennel_id')
  if (kind !== 'gallery' && kind !== 'facilities') throw new Error('invalid_kind')
  if (!(file instanceof File)) throw new Error('no_file')
  if (!ALLOWED_MIME.includes(file.type)) throw new Error('invalid_mime')
  if (file.size > MAX_SIZE) throw new Error('file_too_large')

  const { kennel } = await requireOwnerOfProKennel(kennelId)
  const admin = createKennelAdminClient() as any

  // Path: kennels/<slug>/photos/<kind>/<timestamp>-<safe>.<ext>
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 5)
  const safe = file.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60)
  const ts = Date.now()
  const path = `${kennel.slug || kennel.id}/photos/${kind}/${ts}-${safe}.${ext}`

  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: upErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false })
  if (upErr) throw new Error(upErr.message)

  const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  const url = pub.publicUrl

  // Position: max + 10 (al final). Si no hay rows, empieza en 10.
  const { data: lastRow } = await admin
    .from('kennel_photos')
    .select('position')
    .eq('kennel_id', kennelId)
    .eq('kind', kind)
    .order('position', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  const nextPosition = ((lastRow?.position as number | null) || 0) + 10

  const { data: row, error: insErr } = await admin
    .from('kennel_photos')
    .insert({
      kennel_id: kennelId,
      kind,
      url,
      storage_path: path,
      caption,
      position: nextPosition,
    })
    .select('id')
    .single()
  if (insErr) throw new Error(insErr.message)

  revalidateKennelPages(kennel.slug)
  return { id: row.id, url }
}

export async function deleteKennelPhotoAction(input: {
  photoId: string
  kennelId: string
}): Promise<{ ok: true }> {
  const { kennel } = await requireOwnerOfProKennel(input.kennelId)
  const admin = createKennelAdminClient() as any

  const { data: photo } = await admin
    .from('kennel_photos')
    .select('id, storage_path, kennel_id')
    .eq('id', input.photoId)
    .single()
  if (!photo) throw new Error('photo_not_found')
  if (photo.kennel_id !== input.kennelId) throw new Error('forbidden')

  // Borrar de Storage primero (best-effort; si falla seguimos con DB delete
  // — el row apuntando a un objeto inexistente no rompe nada visible)
  if (photo.storage_path) {
    try {
      await admin.storage.from(STORAGE_BUCKET).remove([photo.storage_path])
    } catch { /* swallow */ }
  }

  const { error } = await admin.from('kennel_photos').delete().eq('id', input.photoId)
  if (error) throw new Error(error.message)

  revalidateKennelPages(kennel.slug)
  return { ok: true }
}

export async function updatePhotoCaptionAction(input: {
  photoId: string
  kennelId: string
  caption: string | null
}): Promise<{ ok: true }> {
  const { kennel } = await requireOwnerOfProKennel(input.kennelId)
  const admin = createKennelAdminClient() as any

  const trimmed = input.caption?.trim() || null
  const { error } = await admin
    .from('kennel_photos')
    .update({ caption: trimmed })
    .eq('id', input.photoId)
    .eq('kennel_id', input.kennelId)
  if (error) throw new Error(error.message)

  revalidateKennelPages(kennel.slug)
  return { ok: true }
}

// ═══ Blog posts ═════════════════════════════════════════════════════════════

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'post'
}

export async function upsertPostAction(input: {
  kennelId: string
  postId?: string  // si no, crea
  title: string
  excerpt?: string | null
  body: string
  coverImageUrl?: string | null
  publish: boolean
}): Promise<{ id: string; slug: string }> {
  const { supabase, kennel } = await requireOwnerOfProKennel(input.kennelId)

  const title = input.title.trim()
  if (title.length < 3) throw new Error('title_too_short')
  const body = input.body.trim()
  const excerpt = input.excerpt?.trim() || null

  // Lectura aprox: 200 palabras/min
  const wordCount = body.split(/\s+/).filter(Boolean).length
  const readingMins = Math.max(1, Math.round(wordCount / 200))

  if (input.postId) {
    // ── UPDATE ──
    const patch: Record<string, unknown> = {
      title,
      body_text: body,
      excerpt,
      reading_time_minutes: readingMins,
      cover_image_url: input.coverImageUrl ?? null,
      status: input.publish ? 'published' : 'draft',
      updated_at: new Date().toISOString(),
    }
    if (input.publish) {
      // Solo seteamos published_at la primera vez que se publica
      const { data: existing } = await supabase
        .from('kennel_posts')
        .select('published_at')
        .eq('id', input.postId)
        .single()
      if (!existing?.published_at) {
        patch.published_at = new Date().toISOString()
      }
    }
    const { data, error } = await supabase
      .from('kennel_posts')
      .update(patch)
      .eq('id', input.postId)
      .eq('kennel_id', input.kennelId) // defensa extra
      .select('id, slug')
      .single()
    if (error) throw new Error(error.message)
    revalidateKennelPages(kennel.slug)
    return { id: data.id, slug: data.slug }
  }

  // ── INSERT ──
  // Slug único dentro del kennel: si choca, sufijo numérico
  let candidate = slugify(title)
  for (let i = 1; i <= 10; i++) {
    const { data: dup } = await supabase
      .from('kennel_posts')
      .select('id')
      .eq('kennel_id', input.kennelId)
      .eq('slug', candidate)
      .maybeSingle()
    if (!dup) break
    candidate = `${slugify(title)}-${i + 1}`
  }

  const { data, error } = await supabase
    .from('kennel_posts')
    .insert({
      kennel_id: input.kennelId,
      slug: candidate,
      title,
      body_text: body,
      excerpt,
      reading_time_minutes: readingMins,
      cover_image_url: input.coverImageUrl || null,
      status: input.publish ? 'published' : 'draft',
      published_at: input.publish ? new Date().toISOString() : null,
    })
    .select('id, slug')
    .single()
  if (error) throw new Error(error.message)

  revalidateKennelPages(kennel.slug)
  return { id: data.id, slug: data.slug }
}

export async function deletePostAction(input: { postId: string; kennelId: string }): Promise<{ ok: true }> {
  const { supabase, kennel } = await requireOwnerOfProKennel(input.kennelId)
  const { error } = await supabase
    .from('kennel_posts')
    .delete()
    .eq('id', input.postId)
    .eq('kennel_id', input.kennelId)
  if (error) throw new Error(error.message)
  revalidateKennelPages(kennel.slug)
  return { ok: true }
}

// ═══ FAQ (knowledge_entries con kennel_id, is_active=true) ════════════════
//
// Las preguntas frecuentes viven en `knowledge_entries` — la misma tabla
// que usa el Emailbot. Las entries activas son tanto contexto para el bot
// como contenido público en la home Pro: el criador las escribe para
// responder a sus clientes y son siempre contenido válido para mostrar.
// Categoría default 'faq' (la del schema check constraint).

const FAQ_DEFAULT_CATEGORY = 'faq'

export async function upsertFAQEntryAction(input: {
  kennelId: string
  entryId?: string
  title: string
  content: string
}): Promise<{ id: string }> {
  const { supabase, kennel } = await requireOwnerOfProKennel(input.kennelId)
  const title = input.title.trim()
  const content = input.content.trim()
  if (title.length < 3) throw new Error('title_too_short')
  if (content.length < 5) throw new Error('content_too_short')

  if (input.entryId) {
    // Solo title/content/is_active — preservamos la category original
    const { data, error } = await supabase
      .from('knowledge_entries')
      .update({ title, content, is_active: true })
      .eq('id', input.entryId)
      .eq('kennel_id', input.kennelId)
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    revalidateKennelPages(kennel.slug)
    return { id: data.id }
  }

  // INSERT
  const { data: maxRow } = await supabase
    .from('knowledge_entries')
    .select('position')
    .eq('kennel_id', input.kennelId)
    .order('position', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  const nextPos = ((maxRow?.position as number | null) || 0) + 10

  const { data, error } = await supabase
    .from('knowledge_entries')
    .insert({
      kennel_id: input.kennelId,
      title, content,
      is_active: true,
      category: FAQ_DEFAULT_CATEGORY,
      position: nextPos,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidateKennelPages(kennel.slug)
  return { id: data.id }
}

export async function deleteFAQEntryAction(input: { entryId: string; kennelId: string }): Promise<{ ok: true }> {
  const { supabase, kennel } = await requireOwnerOfProKennel(input.kennelId)
  const { error } = await supabase
    .from('knowledge_entries')
    .delete()
    .eq('id', input.entryId)
    .eq('kennel_id', input.kennelId)
  if (error) throw new Error(error.message)
  revalidateKennelPages(kennel.slug)
  return { ok: true }
}

// ═══ Reseñas de clientes ═══════════════════════════════════════════════════

export async function upsertReviewAction(input: {
  kennelId: string
  reviewId?: string
  authorName: string
  body: string
  rating: number | null
}): Promise<{ id: string }> {
  const { supabase, kennel } = await requireOwnerOfProKennel(input.kennelId)
  const authorName = input.authorName.trim()
  const body = input.body.trim()
  if (authorName.length < 2) throw new Error('author_too_short')
  if (body.length < 10) throw new Error('body_too_short')
  if (input.rating !== null && (input.rating < 1 || input.rating > 5)) throw new Error('invalid_rating')

  if (input.reviewId) {
    const { data, error } = await supabase
      .from('kennel_reviews')
      .update({
        author_name: authorName,
        body,
        rating: input.rating,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.reviewId)
      .eq('kennel_id', input.kennelId)
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    revalidateKennelPages(kennel.slug)
    return { id: data.id }
  }

  const { data: maxRow } = await supabase
    .from('kennel_reviews')
    .select('position')
    .eq('kennel_id', input.kennelId)
    .order('position', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  const nextPos = ((maxRow?.position as number | null) || 0) + 10

  const { data, error } = await supabase
    .from('kennel_reviews')
    .insert({
      kennel_id: input.kennelId,
      author_name: authorName,
      body,
      rating: input.rating,
      position: nextPos,
      is_visible: true,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidateKennelPages(kennel.slug)
  return { id: data.id }
}

export async function deleteReviewAction(input: { reviewId: string; kennelId: string }): Promise<{ ok: true }> {
  const { supabase, kennel } = await requireOwnerOfProKennel(input.kennelId)
  const { error } = await supabase
    .from('kennel_reviews')
    .delete()
    .eq('id', input.reviewId)
    .eq('kennel_id', input.kennelId)
  if (error) throw new Error(error.message)
  revalidateKennelPages(kennel.slug)
  return { ok: true }
}

export async function toggleReviewVisibilityAction(input: {
  reviewId: string; kennelId: string; visible: boolean
}): Promise<{ ok: true }> {
  const { supabase, kennel } = await requireOwnerOfProKennel(input.kennelId)
  const { error } = await supabase
    .from('kennel_reviews')
    .update({ is_visible: input.visible, updated_at: new Date().toISOString() })
    .eq('id', input.reviewId)
    .eq('kennel_id', input.kennelId)
  if (error) throw new Error(error.message)
  revalidateKennelPages(kennel.slug)
  return { ok: true }
}

// ═══ Upload de cover image para posts ══════════════════════════════════════

export async function uploadPostCoverAction(formData: FormData): Promise<{ url: string }> {
  const kennelId = formData.get('kennelId') as string
  const file = formData.get('file')
  if (!kennelId) throw new Error('missing_kennel_id')
  if (!(file instanceof File)) throw new Error('no_file')
  if (!ALLOWED_MIME.includes(file.type)) throw new Error('invalid_mime')
  if (file.size > MAX_SIZE) throw new Error('file_too_large')

  const { kennel } = await requireOwnerOfProKennel(kennelId)
  const admin = createKennelAdminClient() as any

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 5)
  const ts = Date.now()
  const path = `${kennel.slug || kennel.id}/posts/covers/${ts}.${ext}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: upErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false })
  if (upErr) throw new Error(upErr.message)

  const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { url: pub.publicUrl }
}
