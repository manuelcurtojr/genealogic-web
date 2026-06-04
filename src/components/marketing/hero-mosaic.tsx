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
    // `contain` (no `cover`): con solo width, cover deja el alto original
    // (imagen aplastada y pesada); contain escala proporcional. El encaje en el
    // mosaico lo hace el `object-cover` del CSS.
    return `${transformed}${sep}width=${width}&quality=${quality}&resize=contain`
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
      <div className="absolute inset-0 bg-canvas/92 sm:bg-canvas/60" />

      {/* Gradiente horizontal SOLO desktop para reforzar el lado izquierdo
          donde vive el texto del hero. */}
      <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-canvas via-canvas/70 to-canvas/40" />

      {/* Fundido a blanco SÓLIDO en la parte inferior — empieza alto para
          que el final de las fotos quede completamente tapado y la
          transición a la siguiente sección sea invisible. */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5 sm:h-2/3 bg-gradient-to-b from-transparent via-canvas to-canvas" />

      {/* NEBULOSA — capa de "aurora" con blobs radiales borrosos en colores
          de marca + cool. Se monta POR ENCIMA de los overlays blancos para
          que el color tinte visiblemente la escena (sin blending tricky).
          Las opacidades de los gradientes están ya bajas, así que el efecto
          es presente pero no satura el texto del hero. */}
      <NebulaLayer />
    </div>
  )
}

/**
 * Capa de nebulosa: 3 blobs radiales borrosos que se "respiran" con CSS
 * animation (drift + scale + opacity, todo GPU-friendly).
 *
 * Se monta POR ENCIMA del overlay blanco — sin blending modes — para que
 * el color sea visible sin trucos. Las opacidades de los radial-gradients
 * son intencionalmente altas (0.7-0.85) porque el blur-3xl + el tamaño
 * 80-100vh las dispersan mucho; aún así el texto del hero se lee bien por
 * estar el contenido encima en su propia capa.
 *
 * Respeta prefers-reduced-motion deteniendo la animación.
 */
function NebulaLayer() {
  return (
    <>
      <style>{`
        @keyframes nebula-drift-a {
          0%, 100% { transform: translate3d(-10%, -8%, 0) scale(1);    opacity: 0.35; }
          50%      { transform: translate3d(8%, 6%, 0)   scale(1.15);  opacity: 0.5;  }
        }
        @keyframes nebula-drift-b {
          0%, 100% { transform: translate3d(10%, 6%, 0)  scale(1.1);   opacity: 0.28; }
          50%      { transform: translate3d(-6%, -10%, 0) scale(0.95); opacity: 0.42; }
        }
        @keyframes nebula-drift-c {
          0%, 100% { transform: translate3d(-4%, 12%, 0) scale(0.95);  opacity: 0.22; }
          50%      { transform: translate3d(6%, -4%, 0)  scale(1.1);   opacity: 0.38; }
        }
        .nebula-a { animation: nebula-drift-a 22s ease-in-out infinite; will-change: transform, opacity; }
        .nebula-b { animation: nebula-drift-b 28s ease-in-out infinite; will-change: transform, opacity; }
        .nebula-c { animation: nebula-drift-c 32s ease-in-out infinite; will-change: transform, opacity; }
        @media (prefers-reduced-motion: reduce) {
          .nebula-a, .nebula-b, .nebula-c { animation: none; }
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden">
        {/* Blob A — naranja marca, top-left */}
        <div
          className="nebula-a absolute -top-1/3 -left-1/4 h-[90vh] w-[90vh] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(254,102,32,0.55) 0%, rgba(254,102,32,0.18) 40%, transparent 70%)',
          }}
        />
        {/* Blob B — azul cool, top-right */}
        <div
          className="nebula-b absolute -top-1/4 -right-1/4 h-[80vh] w-[80vh] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.45) 0%, rgba(59,130,246,0.15) 40%, transparent 70%)',
          }}
        />
        {/* Blob C — refuerzo naranja en center-bottom para equilibrar la
            composición (sustituye al magenta que se descartó). Más sutil que
            el blob A para no recargar la zona caliente del hero. */}
        <div
          className="nebula-c absolute top-1/3 left-1/4 h-[70vh] w-[70vh] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(254,102,32,0.35) 0%, rgba(254,102,32,0.1) 40%, transparent 70%)',
          }}
        />
      </div>
    </>
  )
}
