'use server';

import { revalidatePath } from 'next/cache';
import { getMyKennel } from '@/lib/kennel-site';
import { createClient, createKennelAdminClient } from '@/lib/supabase/server';
import {
  listKennelMedia,
  uploadKennelMedia,
  deleteKennelMedia,
  type MediaItem,
} from '@/lib/kennel/media';

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
]);

export type DogPhoto = {
  url: string
  name: string
  source: 'my-dogs' | 'bred-by-me' | 'site-section'
  meta?: string
}

async function assertOwner() {
  const kennel = await getMyKennel();
  return { kennel };
}

export async function listMediaAction(): Promise<MediaItem[]> {
  const { kennel } = await assertOwner();
  return listKennelMedia(kennel.id, 200);
}

export async function uploadMediaAction(formData: FormData): Promise<{ url: string; path: string }> {
  const { kennel } = await assertOwner();
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('no_file');
  if (file.size === 0) throw new Error('empty_file');
  if (file.size > MAX_BYTES) throw new Error('file_too_large');
  if (!ALLOWED_MIME.has(file.type)) throw new Error('mime_not_allowed');

  const buffer = new Uint8Array(await file.arrayBuffer());
  const result = await uploadKennelMedia(kennel.id, buffer, file.type, file.name);
  revalidatePath('/web', 'layout');
  return result;
}

export async function deleteMediaAction(path: string): Promise<void> {
  const { kennel } = await assertOwner();
  await deleteKennelMedia(kennel.id, path);
  revalidatePath('/web', 'layout');
}

/**
 * Lista fotos disponibles en 3 fuentes distintas para el MediaPicker:
 *  - my-dogs:      thumbnails de los perros donde owner_id = current user
 *  - bred-by-me:   thumbnails de los perros del kennel (kennel_id=current)
 *                  o cuyo breeder_id coincide con el owner del kennel
 *  - site-section: URLs únicas extraídas de las secciones publicadas
 *                  (gallery-grid, hero bg, two-column, cover_image, etc.)
 */
export async function listDogPhotosAction(): Promise<DogPhoto[]> {
  const { kennel } = await assertOwner();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any;

  // 1. Mis perros (owner_id === user.id)
  const { data: myDogs } = await admin
    .from('dogs')
    .select('id, name, thumbnail_url, sex, breed:breeds(name)')
    .eq('owner_id', user.id)
    .eq('is_public', true)
    .not('thumbnail_url', 'is', null)
    .order('birth_date', { ascending: false })
    .limit(200);

  // 2. Criados por mí (kennel actual OR breeder_id matches)
  const { data: bredDogs } = await admin
    .from('dogs')
    .select('id, name, thumbnail_url, sex, breed:breeds(name)')
    .or(`kennel_id.eq.${kennel.id},breeder_id.eq.${user.id}`)
    .eq('is_public', true)
    .not('thumbnail_url', 'is', null)
    .order('birth_date', { ascending: false })
    .limit(200);

  const myIds = new Set<string>((myDogs ?? []).map((d: { id: string }) => d.id));

  const fromMine: DogPhoto[] = (myDogs ?? []).map((d: {
    id: string; name: string; thumbnail_url: string; sex: 'male' | 'female';
    breed?: { name: string } | null;
  }) => ({
    url: d.thumbnail_url,
    name: d.name,
    source: 'my-dogs' as const,
    meta: [d.sex === 'male' ? 'Macho' : 'Hembra', d.breed?.name].filter(Boolean).join(' · '),
  }));

  const fromBred: DogPhoto[] = (bredDogs ?? [])
    .filter((d: { id: string }) => !myIds.has(d.id))
    .map((d: {
      id: string; name: string; thumbnail_url: string; sex: 'male' | 'female';
      breed?: { name: string } | null;
    }) => ({
      url: d.thumbnail_url,
      name: d.name,
      source: 'bred-by-me' as const,
      meta: [d.sex === 'male' ? 'Macho' : 'Hembra', d.breed?.name].filter(Boolean).join(' · '),
    }));

  // 3. Fotos ya usadas en secciones del web builder
  const { data: pages } = await admin
    .from('kennel_pages')
    .select('sections')
    .eq('kennel_id', kennel.id);
  const inSiteUrls = new Set<string>();
  for (const p of (pages ?? []) as { sections: unknown }[]) {
    const sections = Array.isArray(p.sections) ? p.sections : [];
    for (const s of sections as Array<{ props?: Record<string, unknown> }>) {
      const props = (s?.props ?? {}) as Record<string, unknown>;
      for (const key of [
        'bg_image_url', 'background_image_url', 'image_url',
        'logo_url', 'cover_image_url',
      ]) {
        const v = props[key];
        if (typeof v === 'string' && v.startsWith('http')) inSiteUrls.add(v);
      }
      const images = props.images;
      if (Array.isArray(images)) {
        for (const img of images) {
          if (typeof img === 'object' && img && typeof (img as { url?: unknown }).url === 'string') {
            inSiteUrls.add((img as { url: string }).url);
          }
        }
      }
      const image = props.image;
      if (typeof image === 'object' && image && typeof (image as { url?: unknown }).url === 'string') {
        inSiteUrls.add((image as { url: string }).url);
      }
    }
  }
  const fromSite: DogPhoto[] = Array.from(inSiteUrls).map((url) => ({
    url,
    name: 'En la web',
    source: 'site-section' as const,
    meta: 'Ya publicada',
  }));

  return [...fromMine, ...fromBred, ...fromSite];
}
