'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Galería de fotos con lightbox.
 *
 * Click en una foto → abre overlay con la foto en grande.
 * Navegación con flechas izquierda/derecha (botones + tecla).
 * Cierra con Esc, click fuera o botón "X".
 *
 * Sin dependencias externas: animación con CSS transitions.
 */

type Img = { url: string; alt?: string };

type Cta = { label: string; href: string };

export function GalleryGridLightbox({
  images,
  layout = 'uniform',
  columns = 3,
  eyebrow,
  title,
  subtitle,
  cta,
}: {
  images: Img[];
  layout?: 'uniform' | 'masonry';
  columns?: 2 | 3 | 4;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  cta?: Cta;
}) {
  const [active, setActive] = useState<number | null>(null);

  const open = useCallback((i: number) => setActive(i), []);
  const close = useCallback(() => setActive(null), []);

  const next = useCallback(() => {
    setActive((curr) =>
      curr === null ? null : (curr + 1) % images.length,
    );
  }, [images.length]);

  const prev = useCallback(() => {
    setActive((curr) =>
      curr === null ? null : (curr - 1 + images.length) % images.length,
    );
  }, [images.length]);

  // Listeners de teclado + bloqueo de scroll del body cuando hay overlay.
  useEffect(() => {
    if (active === null) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    }
    window.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, close, next, prev]);

  const colsClass =
    columns === 4
      ? 'md:grid-cols-4'
      : columns === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-3';

  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6 py-20">
        {(eyebrow || title || subtitle) && (
          <div className="text-center mb-12">
            {eyebrow && (
              <p className="text-sm tracking-[0.3em] uppercase text-brand-400/80">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-4 font-serif text-4xl md:text-5xl">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-4 text-white/70 max-w-2xl mx-auto">{subtitle}</p>
            )}
          </div>
        )}
        <div className={`grid grid-cols-2 ${colsClass} gap-3`}>
          {images.map((img, i) => (
            <button
              type="button"
              key={i}
              onClick={() => open(i)}
              aria-label={img.alt ?? `Foto ${i + 1}`}
              className={`group relative overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/5 transition-all duration-500 hover:ring-brand-400/40 hover:shadow-[0_20px_40px_-20px_rgba(215,71,9,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 animate-fade-up ${
                layout === 'masonry' && i % 3 === 0 ? 'row-span-2' : ''
              }`}
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt ?? ''}
                className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(215,71,9,0.25) 100%)',
                }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute right-3 bottom-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/90 text-white opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
              >
                {/* Icono "ampliar" */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              </span>
            </button>
          ))}
        </div>
        {cta && cta.label && cta.href && (
          <div className="mt-12 text-center">
            <a
              href={cta.href}
              className="inline-flex items-center px-7 py-3 rounded-full border border-white/30 text-white hover:bg-white/10 transition"
            >
              {cta.label} →
            </a>
          </div>
        )}
      </div>

      {active !== null && (
        <Lightbox
          image={images[active]!}
          index={active}
          total={images.length}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </section>
  );
}

function Lightbox({
  image,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  image: Img;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt ?? 'Foto ampliada'}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Botón cerrar */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Cerrar"
        className="fixed top-5 right-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>

      {/* Contador */}
      {total > 1 && (
        <p className="fixed top-6 left-1/2 -translate-x-1/2 font-mono text-xs tracking-widest text-white/60">
          {index + 1} / {total}
        </p>
      )}

      {/* Botón anterior */}
      {total > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Foto anterior"
          className="fixed left-3 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:left-6 md:h-14 md:w-14"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Botón siguiente */}
      {total > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Foto siguiente"
          className="fixed right-3 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-6 md:h-14 md:w-14"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Foto en grande — para que el click en la foto NO cierre */}
      <div
        className="relative max-h-[90vh] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={image.url}
          src={image.url}
          alt={image.alt ?? ''}
          className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain animate-[fadeInZoom_220ms_ease-out]"
        />
        {image.alt && (
          <p className="mt-4 text-center text-sm text-white/70">{image.alt}</p>
        )}
      </div>

      <style>{`
        @keyframes fadeInZoom {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
