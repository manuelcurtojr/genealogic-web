/**
 * HeroMosaic — fondo del hero de la home: grid de fotos de perros.
 *
 * Estático (no client): las fotos solo cambian al recargar la página.
 * Esto evita el "parpadeo" molesto del cross-fade automático y deja al
 * server elegir un set distinto cada request.
 *
 * Layout:
 *  - Mobile: 2 cols × 2 rows = 4 fotos (reducido desde 6 para acelerar
 *    el LCP móvil; el gradient inferior tapa la zona baja igual).
 *  - Desktop (sm+): 6 cols × 2 rows = 12 fotos. Cada celda llena su row.
 *
 * Estrategia de performance:
 *  - DOS bloques separados (mobile / desktop) con sm:hidden / hidden sm:grid
 *    para que el browser no descargue ambos sets.
 *  - `loading="lazy"` en TODAS las imágenes salvo la primera (LCP candidate),
 *    porque son decoración de fondo bajo un overlay blanco al 85%.
 *  - `decoding="async"` y dimensiones width/height para evitar CLS.
 *  - Si la URL es de Supabase Storage (`/storage/v1/object/public/...`)
 *    le añadimos transformación de tamaño/calidad on-the-fly via
 *    `/render/image/...` para servir versiones más pequeñas en mobile.
 *
 * Overlays:
 *  - Base: white/canvas opaca por encima para que las fotos queden muy
 *    suaves de fondo (no compitan con el texto).
 *  - Bottom: gradient a blanco sólido empezando alto (60% mobile,
 *    66% desktop) para que el final de las fotos quede totalmente
 *    fundido en blanco y la transición a la siguiente sección sea
 *    invisible.
 */

/**
 * Pide a Supabase Storage una versión redimensionada/optimizada de la imagen.
 * Si la URL no es de Supabase Storage, la devuelve tal cual.
 * Si Supabase no tiene image transforms habilitado, el browser cae al
 * endpoint normal (sin transform) — no rompe nada.
 */
function resized(src: string | undefined, width: number, quality = 65): string | undefined {
  if (!src) return undefined
  // /storage/v1/object/public/... → /storage/v1/render/image/public/...?width=X&quality=Y
  if (src.includes('/storage/v1/object/public/')) {
    const transformed = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    const sep = transformed.includes('?') ? '&' : '?'
    return `${transformed}${sep}width=${width}&quality=${quality}&resize=cover`
  }
  return src
}

export default function HeroMosaic({ photos }: { photos: string[] }) {
  if (!photos || photos.length === 0) return null

  // Mobile: 4 slots (2 cols × 2 rows) — la zona inferior la tapa el
  // gradient blanco, no merece la pena cargar 2 fotos extra.
  // Desktop: 12 slots (6 cols × 2 rows).
  const mobileSlots = Array.from({ length: 4 }, (_, i) => photos[i % photos.length])
  const desktopSlots = Array.from({ length: 12 }, (_, i) => photos[i % photos.length])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* MOBILE: 2 cols × 2 rows */}
      <div className="grid grid-cols-2 grid-rows-2 gap-0 h-full w-full sm:hidden">
        {mobileSlots.map((src, i) => {
          const optimized = resized(src, 400)
          return (
            <div key={i} className="relative overflow-hidden">
              {optimized && (
                <img
                  src={optimized}
                  alt=""
                  aria-hidden="true"
                  width={400}
                  height={500}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  className="h-full w-full object-cover filter grayscale"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* DESKTOP: 6 cols × 2 rows */}
      <div className="hidden sm:grid sm:grid-cols-6 sm:grid-rows-2 sm:gap-0 sm:h-full sm:w-full">
        {desktopSlots.map((src, i) => {
          const optimized = resized(src, 320)
          return (
            <div key={i} className="relative overflow-hidden">
              {optimized && (
                <img
                  src={optimized}
                  alt=""
                  aria-hidden="true"
                  width={320}
                  height={400}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  className="h-full w-full object-cover filter grayscale"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* OVERLAY blanco — más opaco en mobile (las fotos verticales tipo 4/5 son
          mucho más visibles a esa escala) y algo más translúcido en desktop. */}
      <div className="absolute inset-0 bg-canvas/85 sm:bg-canvas/60" />

      {/* Gradiente horizontal SOLO desktop para reforzar el lado izquierdo
          donde vive el texto del hero. */}
      <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-canvas via-canvas/70 to-canvas/40" />

      {/* Fundido a blanco SÓLIDO en la parte inferior — empieza alto para
          que el final de las fotos quede completamente tapado y la
          transición a la siguiente sección sea invisible. */}
      <div className="absolute bottom-0 left-0 right-0 h-3/5 sm:h-2/3 bg-gradient-to-b from-transparent via-canvas to-canvas" />
    </div>
  )
}
