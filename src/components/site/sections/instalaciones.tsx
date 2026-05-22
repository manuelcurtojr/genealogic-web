import Link from 'next/link';
import { HeroBackground } from './common';
import { GalleryGridLightbox } from './gallery-grid-client';

// ──────────────────────────────────────────────────────────────────────
// Sección: facilities-hero
// ──────────────────────────────────────────────────────────────────────
export function FacilitiesHeroSection({
  eyebrow,
  title,
  body,
  bg_image_url,
  bg_overlay_opacity = 0.55,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  bg_image_url?: string;
  bg_overlay_opacity?: number;
}) {
  return (
    <section className="relative isolate">
      {bg_image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bg_image_url}
            alt=""
            aria-hidden
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 -z-10"
            style={{ background: `rgba(0,0,0,${bg_overlay_opacity})` }}
          />
        </>
      ) : (
        <HeroBackground />
      )}
      <div className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-center">
        {eyebrow && (
          <p data-pawdoq-edit="eyebrow" className="text-sm tracking-[0.3em] uppercase text-brand-400/80">{eyebrow}</p>
        )}
        <h1 data-pawdoq-edit="title" className="mt-6 font-serif text-5xl md:text-7xl leading-[1.05]">{title}</h1>
        {body && <p data-pawdoq-edit="body" className="mt-8 text-lg text-white/80 leading-relaxed">{body}</p>}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sección: facility-features
// ──────────────────────────────────────────────────────────────────────
type Feature = { icon?: string; label: string; value?: string };

export function FacilityFeaturesSection({ features }: { features: Feature[] }) {
  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-5xl px-6 py-20 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
        {features.map((f, i) => (
          <div key={i}>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              {f.label}
            </p>
            {f.value && <p className="mt-3 font-serif text-3xl text-white">{f.value}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sección: gallery-grid (con lightbox al hacer click)
// ──────────────────────────────────────────────────────────────────────
type Img = { url: string; alt?: string };

export function GalleryGridSection({
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
  cta?: { label: string; href: string };
}) {
  if (!images || images.length === 0) {
    return (
      <section className="border-t border-white/10 bg-neutral-950">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-white/40 italic">
            Galería próximamente — estamos preparando las fotos.
          </p>
        </div>
      </section>
    );
  }
  return (
    <GalleryGridLightbox
      images={images}
      layout={layout}
      columns={columns}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      cta={cta}
    />
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sección: visit-cta
// ──────────────────────────────────────────────────────────────────────
export function VisitCtaSection({
  headline,
  body,
  cta,
}: {
  headline: string;
  body?: string;
  cta: { label: string; href: string };
}) {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 data-pawdoq-edit="headline" className="font-serif text-4xl mb-4">{headline}</h2>
        {body && <p data-pawdoq-edit="body" className="text-white/70 mb-8 leading-relaxed">{body}</p>}
        <Link
          href={cta.href}
          className="inline-flex items-center rounded-full bg-white px-7 py-3 font-medium text-black hover:bg-brand-300 transition"
        >
          {cta.label} →
        </Link>
      </div>
    </section>
  );
}
