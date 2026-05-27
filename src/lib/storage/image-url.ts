/**
 * transformImageUrl — devuelve una URL de Supabase Storage con
 * transformaciones aplicadas (resize + quality + format).
 *
 * Supabase Storage soporta transformaciones on-the-fly servidas desde
 * `/storage/v1/render/image/public/...` en lugar de
 * `/storage/v1/object/public/...`. Params soportados:
 *   - width, height (px)
 *   - resize: 'cover' | 'contain' | 'fill'
 *   - quality (1-100)
 *   - format: 'origin' | 'webp' | 'jpeg'
 *
 * Usado para reducir el peso de las imágenes en la home del kennel:
 * las teasers se renderizan a ~700-900px de ancho, pero el thumbnail
 * original suele venir a 1600px+ y 200-500 KB. Servirlas con
 * width=900&quality=72 baja el peso a ~50-80 KB.
 *
 * Si la URL no es de Supabase Storage (p.ej. URL externa o data URL),
 * devuelve la URL tal cual sin tocar.
 */
export interface ImageTransform {
  /** Ancho objetivo en px. Recomendado 400, 600, 800, 1200. */
  width?: number
  /** Alto objetivo en px (opcional, para crops cuadrados o 4:3). */
  height?: number
  /** Cómo encajar la imagen en width/height. Por defecto 'cover'. */
  resize?: 'cover' | 'contain' | 'fill'
  /** Calidad JPEG/WebP (1-100). Por defecto 72 — buen balance. */
  quality?: number
}

const SUPABASE_OBJECT_PREFIX = '/storage/v1/object/public/'
const SUPABASE_RENDER_PREFIX = '/storage/v1/render/image/public/'

export function transformImageUrl(
  url: string | null | undefined,
  opts: ImageTransform = {},
): string | null {
  if (!url) return null
  // URLs no-Supabase (externas, data:): se devuelven sin tocar
  if (!url.includes(SUPABASE_OBJECT_PREFIX) && !url.includes(SUPABASE_RENDER_PREFIX)) {
    return url
  }

  const { width, height, resize = 'cover', quality = 72 } = opts

  // Reescribimos a /render/image/public/ para activar el endpoint
  // de transformación (ya cubre tanto el caso `/object/` como una URL
  // que ya venga apuntando a `/render/`).
  let transformed = url.replace(SUPABASE_OBJECT_PREFIX, SUPABASE_RENDER_PREFIX)

  // Construimos los query params (limpios — sin trailing `?` ni `&`)
  const params = new URLSearchParams()
  if (width) params.set('width', String(width))
  if (height) params.set('height', String(height))
  if (resize) params.set('resize', resize)
  if (quality) params.set('quality', String(quality))

  const qs = params.toString()
  if (!qs) return transformed

  // Si la URL ya tiene query string previo, la respetamos
  transformed += transformed.includes('?') ? '&' + qs : '?' + qs
  return transformed
}

/** Atajos pre-configurados para los casos comunes de la home/perfil. */
export const ImagePresets = {
  /** Teaser grande de home (~700-900px de ancho según breakpoint) */
  teaserHero: { width: 900, quality: 72 } as ImageTransform,
  /** Card de perro destacado (~360px en grid, retina x2 = ~720px) */
  dogCard: { width: 720, quality: 72 } as ImageTransform,
  /** Thumbnail compacto de listado (~120-180px) */
  dogThumb: { width: 240, quality: 72 } as ImageTransform,
  /** Avatar / círculo de reseña/equipo */
  avatar: { width: 160, quality: 75 } as ImageTransform,
  /** Foto de galería en mosaico (~400-500px) */
  galleryTile: { width: 600, quality: 70 } as ImageTransform,
  /** Cover de blog post en slider (~340px desktop) */
  blogCover: { width: 680, quality: 72 } as ImageTransform,
}
