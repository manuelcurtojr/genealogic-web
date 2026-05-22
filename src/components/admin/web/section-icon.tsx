/**
 * Iconos SVG para cada tipo de sección del catálogo del web builder.
 * Mismo estilo que los iconos del menú lateral del admin: stroke
 * currentColor 1.5, viewBox 24, lineas redondeadas. Usar siempre con
 * `text-…` Tailwind para colorear (hereda con `currentColor`).
 *
 * Si llega un type desconocido, fallback a un círculo neutro.
 */

const wrap = (children: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-full w-full"
  >
    {children}
  </svg>
);

const ICONS: Record<string, React.ReactNode> = {
  // ── Heroes ────────────────────────────────────────────────────────
  hero: wrap(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 10h10M7 14h6" />
      <circle cx="17" cy="6.5" r="1.5" />
    </>,
  ),
  'breed-hero': wrap(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 14c0-2 1.5-4 4-4s4 2 4 4M10 8.5h.01M14 8.5h.01" />
    </>,
  ),
  'story-hero': wrap(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8h10M7 12h10M7 16h6" />
    </>,
  ),
  'blog-hero': wrap(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8h6M7 12h10M7 16h8" />
    </>,
  ),
  'facilities-hero': wrap(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 14l4-4 4 4 3-3 7 6" />
      <circle cx="8" cy="8" r="1.5" />
    </>,
  ),

  // ── Layout ────────────────────────────────────────────────────────
  'page-header': wrap(
    <>
      <rect x="3" y="4" width="18" height="6" rx="1" />
      <path d="M3 14h12M3 18h8" />
    </>,
  ),
  'two-column-block': wrap(
    <>
      <rect x="3" y="5" width="8" height="14" rx="1" />
      <path d="M14 7h7M14 11h6M14 15h7M14 19h4" />
    </>,
  ),
  'three-pillars': wrap(
    <>
      <rect x="3" y="5" width="5" height="14" rx="1" />
      <rect x="9.5" y="5" width="5" height="14" rx="1" />
      <rect x="16" y="5" width="5" height="14" rx="1" />
    </>,
  ),
  'breed-temperament': wrap(
    <>
      <rect x="3" y="5" width="5" height="14" rx="1" />
      <rect x="9.5" y="5" width="5" height="14" rx="1" />
      <rect x="16" y="5" width="5" height="14" rx="1" />
    </>,
  ),

  // ── Dogs / live ───────────────────────────────────────────────────
  'available-puppies-strip': wrap(
    <>
      <rect x="2" y="7" width="6" height="10" rx="1" />
      <rect x="9" y="7" width="6" height="10" rx="1" />
      <rect x="16" y="7" width="6" height="10" rx="1" />
    </>,
  ),
  'available-puppies-grid': wrap(
    <>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </>,
  ),
  'breeding-dogs-grid': wrap(
    <>
      <ellipse cx="6" cy="9" rx="1.5" ry="2" fill="currentColor" />
      <ellipse cx="10" cy="7" rx="1.5" ry="2" fill="currentColor" />
      <ellipse cx="14" cy="7" rx="1.5" ry="2" fill="currentColor" />
      <ellipse cx="18" cy="9" rx="1.5" ry="2" fill="currentColor" />
      <path d="M8 16c0-2 2-3.5 4-3.5s4 1.5 4 3.5c0 1.5-1.5 2.5-4 2.5s-4-1-4-2.5z" fill="currentColor" />
    </>,
  ),
  'dogs-tabs': wrap(
    <>
      <path d="M3 8h18" />
      <path d="M8 8v-3h4v3" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="8" width="18" height="12" rx="1" />
      <path d="M7 13h10M7 16h6" />
    </>,
  ),

  // ── CTAs ──────────────────────────────────────────────────────────
  'cta-banner': wrap(
    <>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M14 12h4M16 10l2 2-2 2" />
    </>,
  ),
  'waitlist-cta': wrap(
    <>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10v-1M12 14v1" />
    </>,
  ),
  'visit-cta': wrap(
    <>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </>,
  ),
  'chat-promo': wrap(
    <>
      <path d="M21 12a8 8 0 01-12.5 6.6L3 20l1.4-5A8 8 0 1121 12z" />
    </>,
  ),

  // ── Breed details ─────────────────────────────────────────────────
  'breed-summary': wrap(
    <>
      <path d="M5 9h2v8H5zM11 5h2v12h-2zM17 12h2v5h-2z" fill="currentColor" stroke="none" />
      <path d="M3 19h18" />
    </>,
  ),
  'breed-colors': wrap(
    <>
      <circle cx="6" cy="8" r="2.5" />
      <circle cx="12" cy="8" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <circle cx="9" cy="16" r="2.5" />
      <circle cx="15" cy="16" r="2.5" />
    </>,
  ),
  'breed-traits': wrap(
    <>
      <path d="M3 6h12M3 12h18M3 18h7" strokeWidth="2" />
    </>,
  ),
  'kennel-stats': wrap(
    <>
      <path d="M5 17V9M10 17V5M15 17v-6M20 17v-9" strokeWidth="2" />
      <path d="M3 19h18" />
    </>,
  ),

  // ── Content ───────────────────────────────────────────────────────
  timeline: wrap(
    <>
      <path d="M12 3v18" />
      <circle cx="12" cy="6" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="18" r="2" fill="currentColor" />
      <path d="M14 6h5M14 12h6M14 18h4" />
    </>,
  ),
  team: wrap(
    <>
      <circle cx="6" cy="9" r="2.5" />
      <circle cx="12" cy="7" r="3" />
      <circle cx="18" cy="9" r="2.5" />
      <path d="M2 19c1-3 4-4 4-4M22 19c-1-3-4-4-4-4M7 19c1-4 5-5 5-5s4 1 5 5" />
    </>,
  ),
  'services-grid': wrap(
    <>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
      <path d="M5.5 7h3M15.5 7h3M5.5 17h3M15.5 17h3" />
    </>,
  ),
  'facility-features': wrap(
    <>
      <path d="M5 6l2 2 4-4" />
      <path d="M5 14l2 2 4-4" />
      <path d="M14 7h7M14 16h7" />
    </>,
  ),
  'gallery-grid': wrap(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <circle cx="6" cy="6" r="1" />
      <path d="M3 8l3-2 4 3" />
    </>,
  ),

  // ── Blog ──────────────────────────────────────────────────────────
  'featured-post': wrap(
    <>
      <rect x="3" y="3" width="18" height="11" rx="1" />
      <circle cx="7" cy="7" r="1.5" />
      <path d="M3 11l4-3 4 3 6-4 4 3M3 18h12M3 21h8" />
    </>,
  ),
  'posts-grid': wrap(
    <>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
      <path d="M5 9h4M15 9h4M5 19h4M15 19h4" />
    </>,
  ),
  'latest-posts': wrap(
    <>
      <rect x="3" y="5" width="6" height="14" rx="1" />
      <path d="M11 7h10M11 11h10M11 15h7M11 19h8" />
    </>,
  ),

  // ── Trust / form ──────────────────────────────────────────────────
  'trust-strip': wrap(
    <>
      <path d="M5 9c0-2 1.5-3 3-3v3H5v3c0 1.5 1 2.5 2 3" />
      <path d="M14 9c0-2 1.5-3 3-3v3h-3v3c0 1.5 1 2.5 2 3" />
    </>,
  ),
  reviews: wrap(
    <>
      <path d="M12 4l2.5 5 5.5.5-4 4 1 5.5-5-3-5 3 1-5.5-4-4 5.5-.5z" fill="currentColor" stroke="none" />
    </>,
  ),
  'press-logos': wrap(
    <>
      <rect x="2" y="9" width="4" height="6" rx="1" />
      <rect x="8" y="9" width="4" height="6" rx="1" />
      <rect x="14" y="9" width="4" height="6" rx="1" />
      <rect x="20" y="9" width="2" height="6" rx="1" />
    </>,
  ),
  'process-steps': wrap(
    <>
      <circle cx="5" cy="12" r="2.5" />
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="19" cy="12" r="2.5" />
      <path d="M7.5 12h2M14.5 12h2" />
    </>,
  ),
  faq: wrap(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2 1.5-2.5 3" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </>,
  ),

  // ── Media ─────────────────────────────────────────────────────────
  'video-embed': wrap(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </>,
  ),

  // ── Newsletter / contacto ────────────────────────────────────────
  newsletter: wrap(
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 8l9 6 9-6" />
    </>,
  ),
  'contact-form': wrap(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8h6M7 12h10M7 16h4" />
      <rect x="14" y="14" width="4" height="3" rx="0.5" />
    </>,
  ),
  'contact-info': wrap(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </>,
  ),
  'map-embed': wrap(
    <>
      <path d="M12 2c-3.5 0-6 2.5-6 6 0 4.5 6 12 6 12s6-7.5 6-12c0-3.5-2.5-6-6-6z" />
      <circle cx="12" cy="8" r="2" />
    </>,
  ),
};

export function SectionIcon({
  type,
  className = 'h-4 w-4',
}: {
  type: string;
  className?: string;
}) {
  const icon = ICONS[type] ?? wrap(<circle cx="12" cy="12" r="6" />);
  return <span className={className}>{icon}</span>;
}
