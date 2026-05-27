/**
 * AboutGallery — galería mosaico para la página "Sobre nosotros".
 *
 * Mezcla fotos de la galería del kennel (`kennel_photos` kind='gallery'
 * o 'facilities'). En desktop pinta un grid bento de 4-6 fotos con
 * tamaños alternados; en mobile cae a un grid simple de 2 columnas.
 *
 * Cada foto enlaza a la página de Galería completa o de Instalaciones
 * según su tipo, para que el visitante pueda seguir el rabbit hole.
 *
 * Si hay menos de 2 fotos el componente no se renderiza (la página
 * decide eso antes de invocarlo).
 */
import Link from 'next/link'
import { ArrowRight, ImageIcon } from 'lucide-react'

type Photo = {
  id: string
  url: string
  caption: string | null
  kind: 'gallery' | 'facilities'
}

export default function AboutGallery({
  photos, kennelName, kennelSlug,
}: {
  photos: Photo[]
  kennelName: string
  kennelSlug: string
}) {
  if (photos.length < 2) return null

  // Tomamos 4 ó 6 según haya — números pares para que el grid quede
  // equilibrado en mobile (2 cols).
  const display = photos.slice(0, photos.length >= 6 ? 6 : 4)
  const hasFacilities = display.some(p => p.kind === 'facilities')
  const hasGallery = display.some(p => p.kind === 'gallery')

  // Patrón de tamaños desktop (col-span / row-span). Para 4 fotos: 1 grande
  // + 3 medianas. Para 6: clásico bento alternado.
  const layouts4 = ['md:col-span-2 md:row-span-2', '', '', ''] as const
  const layouts6 = [
    'md:col-span-2 md:row-span-2',
    '',
    '',
    'md:col-span-2',
    '',
    '',
  ] as const
  const layouts = display.length === 6 ? layouts6 : layouts4

  return (
    <section>
      <div className="mb-6 sm:mb-8 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#FE6620]">
            Conoce el lugar
          </p>
          <h2 className="mt-1.5 text-[22px] sm:text-[28px] font-semibold tracking-[-0.03em] text-ink leading-[1.15]">
            Donde vive {kennelName}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {hasFacilities && (
            <Link
              href={`/kennels/${kennelSlug}/instalaciones`}
              className="text-[12.5px] font-semibold text-body hover:text-ink inline-flex items-center gap-1 transition"
            >
              Instalaciones <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          {hasGallery && (
            <Link
              href={`/kennels/${kennelSlug}/galeria`}
              className="text-[12.5px] font-semibold text-body hover:text-ink inline-flex items-center gap-1 transition"
            >
              Galería <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 md:auto-rows-[160px] gap-2 sm:gap-3">
        {display.map((p, i) => {
          const isWide = layouts[i]?.includes('col-span-2')
          const isTall = layouts[i]?.includes('row-span-2')
          const targetHref = `/kennels/${kennelSlug}/${p.kind === 'facilities' ? 'instalaciones' : 'galeria'}`
          return (
            <Link
              key={p.id}
              href={targetHref}
              className={`relative group overflow-hidden rounded-xl bg-surface-card border border-hairline ${
                layouts[i] || ''
              } ${
                // En mobile, la primera ocupa 2 cols
                i === 0 ? 'col-span-2 md:col-span-2 aspect-[16/9] md:aspect-auto' : 'aspect-square md:aspect-auto'
              }`}
            >
              {p.url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.url}
                  alt={p.caption || `${kennelName} — foto`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              {/* Etiqueta de tipo en esquina */}
              <span className="absolute top-2 left-2 inline-flex items-center rounded-full bg-canvas/95 backdrop-blur-sm px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-ink shadow-sm">
                {p.kind === 'facilities' ? 'Instalaciones' : 'Galería'}
              </span>
              {/* Caption opcional, solo si es ancha y tiene texto */}
              {p.caption && (isWide || isTall) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 sm:p-4">
                  <p className="text-[12px] sm:text-[12.5px] font-medium text-white leading-snug line-clamp-2">
                    {p.caption}
                  </p>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
