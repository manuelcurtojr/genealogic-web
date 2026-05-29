/**
 * Utilidades de vídeo para la galería del perro: parseo de enlaces de
 * YouTube/Vimeo, URLs de embed y miniaturas (portada por defecto).
 */

export type VideoProvider = 'upload' | 'youtube' | 'vimeo'

export interface ParsedVideo {
  provider: 'youtube' | 'vimeo'
  id: string
}

/** Detecta YouTube o Vimeo en un enlace pegado. Devuelve null si no reconoce. */
export function parseVideoUrl(input: string): ParsedVideo | null {
  const url = (input || '').trim()
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (yt) return { provider: 'youtube', id: yt[1] }
  const vm = url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)/)
  if (vm) return { provider: 'vimeo', id: vm[1] }
  return null
}

/** Miniatura por defecto de un vídeo de YouTube. */
export function youtubePoster(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

/** URL de reproducción embebida para el lightbox (con autoplay). */
export function videoEmbedUrl(provider: VideoProvider, source: string): string | null {
  const parsed = parseVideoUrl(source)
  if (provider === 'youtube' && parsed?.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&rel=0`
  }
  if (provider === 'vimeo' && parsed?.provider === 'vimeo') {
    return `https://player.vimeo.com/video/${parsed.id}?autoplay=1`
  }
  return null
}

/** Portada por defecto de Vimeo vía oEmbed (CORS permitido). null si falla. */
export async function fetchVimeoPoster(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1280`)
    if (!res.ok) return null
    const json = await res.json()
    return (json?.thumbnail_url as string) || null
  } catch {
    return null
  }
}
