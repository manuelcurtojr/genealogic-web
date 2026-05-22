import Link from 'next/link';
import { NewsletterForm } from '@/components/site/newsletter-form';

/** Fondo radial cálido reutilizable. */
export function HeroBackground() {
  return (
    <div
      className="absolute inset-0 -z-10"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 0%, #6b1f08 0%, #2a0a04 45%, #000 80%)',
      }}
    />
  );
}

type Cta = { label: string; href: string; variant?: 'primary' | 'outline' | 'ghost' };

function CtaButton({ cta }: { cta: Cta }) {
  const base = 'inline-flex items-center px-7 py-3 rounded-full transition';
  if (cta.variant === 'primary' || !cta.variant) {
    return (
      <Link href={cta.href} className={`${base} bg-white text-black font-medium hover:bg-white/90`}>
        {cta.label}
      </Link>
    );
  }
  if (cta.variant === 'outline') {
    return (
      <Link href={cta.href} className={`${base} border border-white/30 text-white hover:bg-white/10`}>
        {cta.label}
      </Link>
    );
  }
  return (
    <Link href={cta.href} className={`${base} text-white hover:bg-white/5`}>
      {cta.label}
    </Link>
  );
}

/** Renderiza un Cta delegando estilos por variante. */
export function CtaButtonExport({ cta }: { cta: Cta }) {
  return <CtaButton cta={cta} />;
}

// ──────────────────────────────────────────────────────────────────────
// Sección: page-header
// ──────────────────────────────────────────────────────────────────────
export function PageHeaderSection({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative isolate">
      <HeroBackground />
      <div className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-center">
        {eyebrow && (
          <p data-pawdoq-edit="eyebrow" className="text-sm tracking-[0.3em] uppercase text-brand-400/80">{eyebrow}</p>
        )}
        <h1 data-pawdoq-edit="title" className="mt-6 font-serif text-5xl md:text-7xl leading-[1.05]">{title}</h1>
        {subtitle && (
          <p data-pawdoq-edit="subtitle" className="mt-8 text-lg text-white/80 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sección: newsletter
// ──────────────────────────────────────────────────────────────────────
export function NewsletterSection({
  headline = 'Boletín',
  body = 'Recibe las últimas noticias en tu correo.',
  placeholderEmail = 'tu@email.com',
  ctaLabel = 'Suscribirse',
}: {
  headline?: string;
  body?: string;
  placeholderEmail?: string;
  ctaLabel?: string;
}) {
  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h3 data-pawdoq-edit="headline" className="font-serif text-3xl mb-4">{headline}</h3>
        <p data-pawdoq-edit="body" className="text-white/70 mb-8">{body}</p>
        <NewsletterForm placeholderEmail={placeholderEmail} ctaLabel={ctaLabel} />
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sección: trust-strip
// ──────────────────────────────────────────────────────────────────────
export function TrustStripSection({
  headline,
  body,
}: {
  headline: string;
  body?: string;
}) {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 data-pawdoq-edit="headline" className="font-serif text-4xl md:text-5xl">{headline}</h2>
        {body && (
          <p data-pawdoq-edit="body" className="mt-6 mx-auto max-w-2xl text-white/70 leading-relaxed">{body}</p>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sección: cta-banner
// ──────────────────────────────────────────────────────────────────────
export function CtaBannerSection({
  headline,
  body,
  cta,
}: {
  headline: string;
  body?: string;
  cta: Cta;
}) {
  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 data-pawdoq-edit="headline" className="font-serif text-4xl mb-4">{headline}</h2>
        {body && <p data-pawdoq-edit="body" className="text-white/70 mb-8 leading-relaxed">{body}</p>}
        <CtaButton cta={cta} />
      </div>
    </section>
  );
}
