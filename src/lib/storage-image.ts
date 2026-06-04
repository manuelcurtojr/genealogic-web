/**
 * resizedThumb — sirve una versión REDIMENSIONADA/optimizada de una imagen de
 * Supabase Storage usando el endpoint de transformación on-the-fly
 * (`/storage/v1/render/image/...`). Para previews/cards no tiene sentido cargar
 * la imagen original (a veces de varios MB): pedimos el ancho exacto + calidad.
 *
 * - Si la URL NO es de Supabase Storage (p.ej. un scrape externo), se devuelve
 *   tal cual (no rompe nada, simplemente no se optimiza).
 * - Si Supabase no tuviera image-transforms habilitado, el endpoint /render/
 *   fallaría; en este proyecto SÍ está habilitado (lo usa el mosaico del hero).
 *
 * Mismo patrón que `resized()` de hero-mosaic, extraído a lib para reutilizar.
 */
export function resizedThumb(
  src: string | null | undefined,
  width: number,
  quality = 60,
): string | undefined {
  if (!src) return undefined
  if (src.includes('/storage/v1/object/public/')) {
    const transformed = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    const sep = transformed.includes('?') ? '&' : '?'
    // `contain` (no `cover`): con solo width, Supabase NO escala el alto en modo
    // cover (deja el original → imagen aplastada y pesada). contain mantiene la
    // proporción. El recorte final lo hace el `object-cover` del CSS.
    return `${transformed}${sep}width=${width}&quality=${quality}&resize=contain`
  }
  return src
}
