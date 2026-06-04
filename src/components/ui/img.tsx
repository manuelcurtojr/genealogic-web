import { transformImageUrl } from '@/lib/storage/image-url'

type ImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | null | undefined
  /** Ancho de descarga objetivo en px. Usa ~2× el tamaño renderizado (retina). */
  w?: number
  /** Alto objetivo opcional (para crops cuadrados/4:3). */
  h?: number
  /** Calidad 1-100 (def. 72 — buen balance peso/nitidez). */
  q?: number
  /** Cómo encajar en w/h. Por defecto 'cover'. */
  resize?: 'cover' | 'contain' | 'fill'
}

/**
 * <Img> — reemplazo directo de <img> que sirve una versión REDIMENSIONADA desde
 * el CDN de Supabase (image transforms, `/storage/v1/render/image/...`) en lugar
 * del original — que a menudo pesa varios MB aunque se pinte en 56px. Reduce el
 * peso de KB↓↓ y arregla el "tarda un montón en cargar las fotos".
 *
 * - Componente PURO (sin 'use client', sin hooks): válido en server y client.
 * - URLs no-Supabase (scrapes externos, data:, youtube posters) pasan sin tocar.
 * - `loading="lazy"` + `decoding="async"` por defecto (override con las props).
 * - Acepta TODAS las props de <img> (className, alt, style, onError, draggable…).
 *
 * Uso:  <Img src={dog.thumbnail_url} w={120} alt="" className="h-full w-full object-cover" />
 * Para imágenes above-the-fold (hero/LCP) pasa loading="eager".
 */
export function Img({ src, w, h, q = 72, resize, loading, decoding, ...rest }: ImgProps) {
  const out =
    typeof src === 'string' && src
      ? transformImageUrl(src, { width: w, height: h, quality: q, resize }) ?? undefined
      : undefined
  return <img {...rest} src={out} loading={loading ?? 'lazy'} decoding={decoding ?? 'async'} />
}
