/**
 * HeroMosaic — fondo del hero de la home: grid de fotos de perros.
 *
 * Estático (no client): las fotos solo cambian al recargar la página.
 * Esto evita el "parpadeo" molesto del cross-fade automático y deja al
 * server elegir un set distinto cada request.
 *
 * Layout:
 *  - Mobile: 2 cols × 3 rows = 6 fotos. Cada celda llena su row (h-full).
 *  - Desktop (sm+): 6 cols × 2 rows = 12 fotos. Cada celda llena su row.
 *
 * Usa grid-rows-N explícito + h-full en celdas (NO aspect-square) para
 * que las fotos llenen TODO el alto del contenedor sin gaps blancos
 * entre filas.
 *
 * Overlays:
 *  - Base: white/canvas opaca por encima para que las fotos queden muy
 *    suaves de fondo (no compitan con el texto).
 *  - Bottom: gradient a blanco sólido empezando alto (60% mobile,
 *    66% desktop) para que el final de las fotos quede totalmente
 *    fundido en blanco y la transición a la siguiente sección sea
 *    invisible.
 */

export default function HeroMosaic({ photos }: { photos: string[] }) {
  if (!photos || photos.length === 0) return null

  // Mobile: 6 slots (2 cols × 3 rows). Desktop: 12 slots (6 cols × 2 rows).
  // Renderizamos los 12 y los slots 7-12 se ocultan en mobile vía
  // grid-rows-3 sm:grid-rows-2 (la 3ª fila tiene 2 cells, las cells 7+
  // simplemente quedan fuera porque el grid no tiene más rows).
  // Mejor: dos arrays separados para garantizar que no se "pierdan"
  // celdas y cada layout use exactamente los slots correctos.

  const mobileSlots = Array.from({ length: 6 }, (_, i) => photos[i % photos.length])
  const desktopSlots = Array.from({ length: 12 }, (_, i) => photos[i % photos.length])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* MOBILE: 2 cols × 3 rows */}
      <div className="grid grid-cols-2 grid-rows-3 gap-0 h-full w-full sm:hidden">
        {mobileSlots.map((src, i) => (
          <div key={i} className="relative overflow-hidden">
            {src && (
              <img
                src={src}
                alt=""
                aria-hidden="true"
                loading="eager"
                className="h-full w-full object-cover filter grayscale"
              />
            )}
          </div>
        ))}
      </div>

      {/* DESKTOP: 6 cols × 2 rows */}
      <div className="hidden sm:grid sm:grid-cols-6 sm:grid-rows-2 sm:gap-0 sm:h-full sm:w-full">
        {desktopSlots.map((src, i) => (
          <div key={i} className="relative overflow-hidden">
            {src && (
              <img
                src={src}
                alt=""
                aria-hidden="true"
                loading="eager"
                className="h-full w-full object-cover filter grayscale"
              />
            )}
          </div>
        ))}
      </div>

      {/* OVERLAY blanco más opaco — las fotos quedan muy suaves de fondo */}
      <div className="absolute inset-0 bg-canvas/65 sm:bg-canvas/60" />

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
