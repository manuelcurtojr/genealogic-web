/**
 * HeroMosaic — fondo del hero de la home: grid de fotos de perros que se
 * van rotando cada N segundos con cross-fade.
 *
 * Layout:
 *  - Mobile: 2 columnas, celdas rectangulares más altas (aspect-[4/5])
 *    para que ocupen más espacio hacia abajo.
 *  - Desktop (sm+): 6 columnas cuadradas pegadas (gap-0) sin huecos.
 *
 * Rotación: cada 4s una celda al azar cambia a otra thumbnail no usada.
 * Cross-fade con dos capas <img> apiladas (opacidad alterna).
 *
 * Degradado bottom muy fuerte a `bg-canvas` para que el contenido encima
 * (counts, search) tenga fondo casi blanco limpio.
 */
'use client'

import { useEffect, useRef, useState } from 'react'

const ROTATE_MS = 4000

export default function HeroMosaic({
  photos,
}: {
  /** Pool grande de URLs. Cuanto más grande, más variedad antes de repetir. */
  photos: string[]
}) {
  // Slots visibles: en mobile mostramos 6 (2x3 visible above the fold),
  // en desktop 12 (6x2). Con responsive `grid-cols-2 sm:grid-cols-6` cabe.
  // Usamos 12 slots SIEMPRE — los slots 7-12 quedan ocultos en mobile por
  // la altura del contenedor, no por display.
  const SLOTS = 12

  // Inicializamos cada slot con la primera vuelta de photos. Si hay menos
  // fotos que slots, repetimos.
  const initial = Array.from({ length: SLOTS }, (_, i) => photos[i % photos.length] || '')
  const [current, setCurrent] = useState<string[]>(initial)
  // Capa secundaria para el cross-fade
  const [next, setNext] = useState<string[]>(initial)
  // Cuál capa está visible por slot (true = current, false = next)
  const [topIsCurrent, setTopIsCurrent] = useState<boolean[]>(
    Array.from({ length: SLOTS }, () => true)
  )
  const indexRef = useRef(0)

  useEffect(() => {
    if (photos.length <= 1) return
    const id = setInterval(() => {
      // Elegir slot al azar
      const slot = Math.floor(Math.random() * SLOTS)
      // Buscar próxima foto no presente en ningún slot ahora mismo
      let candidate = ''
      for (let i = 0; i < photos.length; i++) {
        const idx = (indexRef.current + i) % photos.length
        const cand = photos[idx]
        if (!current.includes(cand) && !next.includes(cand)) {
          candidate = cand
          indexRef.current = (idx + 1) % photos.length
          break
        }
      }
      // Si no encontramos una nueva (pool muy pequeño), usamos cualquier
      // otra que no esté en el slot actual
      if (!candidate) {
        const idx = indexRef.current % photos.length
        candidate = photos[idx] === current[slot] ? photos[(idx + 1) % photos.length] : photos[idx]
        indexRef.current = (idx + 1) % photos.length
      }

      // Aplicar a la capa que NO está visible y togglear
      const visibleIsTop = topIsCurrent[slot]
      if (visibleIsTop) {
        setNext((arr) => {
          const copy = [...arr]
          copy[slot] = candidate
          return copy
        })
      } else {
        setCurrent((arr) => {
          const copy = [...arr]
          copy[slot] = candidate
          return copy
        })
      }
      // Tras montar la nueva imagen, toggleamos la capa visible
      setTimeout(() => {
        setTopIsCurrent((arr) => {
          const copy = [...arr]
          copy[slot] = !copy[slot]
          return copy
        })
      }, 50)
    }, ROTATE_MS)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* Grid: 2 cols mobile (fotos verticales grandes), 6 cols desktop sin gap */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-0 h-full w-full">
        {current.map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden aspect-[4/5] sm:aspect-square"
          >
            {/* Capa A (current) */}
            {current[i] && (
              <img
                src={current[i]}
                alt=""
                aria-hidden="true"
                loading="eager"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  topIsCurrent[i] ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
            {/* Capa B (next) */}
            {next[i] && (
              <img
                src={next[i]}
                alt=""
                aria-hidden="true"
                loading="eager"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  topIsCurrent[i] ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Overlays: oscurece para legibilidad y FUNDE A BLANCO la parte inferior */}
      <div className="absolute inset-0 bg-canvas/35 sm:bg-canvas/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/55 to-canvas/30 hidden sm:block" />
      {/* Fundido a blanco en la parte de abajo — clave para que la transición
          con la siguiente sección sea limpia y se "diluya". */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5 sm:h-1/2 bg-gradient-to-b from-transparent via-canvas/85 to-canvas" />
    </div>
  )
}
