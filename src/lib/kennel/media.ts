import 'server-only';
import { createKennelAdminClient } from '@/lib/supabase/server';

export type MediaItem = {
  name: string; // path completo dentro del bucket: tenant_id/timestamp_filename.ext
  url: string; // URL pública para usar en src
  size: number;
  created_at: string;
  mime_type?: string;
};

// En Genealogic reusamos el bucket `kennels` (ya existe, público).
// Path: <kennel_id>/media/<timestamp>_<filename>
const BUCKET = 'kennels';
const PATH_PREFIX = 'media';

function fullPathFor(kennelId: string, name: string) {
  return `${kennelId}/${PATH_PREFIX}/${name}`;
}

function publicUrlFor(path: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any;
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl as string;
}

/**
 * Lista los archivos de un tenant ordenados por fecha (más reciente primero).
 * Solo expone los del prefijo `${tenant_id}/`.
 */
export async function listKennelMedia(kennelId: string, limit = 100): Promise<MediaItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any;
  const { data, error } = await admin.storage
    .from(BUCKET)
    .list(`${kennelId}/${PATH_PREFIX}`, {
      limit,
      sortBy: { column: 'created_at', order: 'desc' },
    });
  if (error || !data) return [];
  return (
    data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((f: any) => f.id) // ignora carpetas vacías
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((f: any): MediaItem => {
        const fullPath = fullPathFor(kennelId, f.name);
        return {
          name: fullPath,
          url: publicUrlFor(fullPath),
          size: f.metadata?.size ?? 0,
          created_at: f.created_at ?? '',
          mime_type: f.metadata?.mimetype,
        };
      })
  );
}

/**
 * Sube un archivo al bucket bajo el prefijo del tenant. Devuelve la URL pública.
 *
 * `originalFilename` se sanea y se prefija con timestamp para evitar colisiones.
 */
export async function uploadKennelMedia(
  kennelId: string,
  buffer: ArrayBuffer | Uint8Array,
  contentType: string,
  originalFilename: string,
): Promise<{ url: string; path: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any;

  const safeName = originalFilename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'file';
  const ts = Date.now();
  const path = fullPathFor(kennelId, `${ts}_${safeName}`);

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return { url: publicUrlFor(path), path };
}

/** Borra un archivo. La path debe empezar con kennelId. */
export async function deleteKennelMedia(kennelId: string, path: string): Promise<void> {
  if (!path.startsWith(`${kennelId}/`)) {
    throw new Error('forbidden_path');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any;
  const { error } = await admin.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
