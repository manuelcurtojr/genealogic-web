'use server';

import { revalidatePath } from 'next/cache';
import { getMyKennel } from '@/lib/kennel-site';
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
