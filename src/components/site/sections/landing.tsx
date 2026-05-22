import Link from 'next/link';
import Image from 'next/image';
import { InquiryTrigger } from '@/components/inquiry/inquiry-trigger';
import { createKennelAdminClient } from '@/lib/supabase/server';
import { getCurrentKennel } from '@/lib/kennel-context';
import { FadeUp } from '@/components/site/fade-up';
import { CountUp } from '@/components/site/count-up';

type Cta = { label: string; href: string; variant?: 'primary' | 'outline' | 'ghost' };

function CtaButton({ cta }: { cta: Cta }) {
  const base =
    'inline-flex items-center px-7 py-3 rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]';
  const variant = cta.variant ?? 'primary';
  const cls =
    variant === 'outline'
      ? `${base} border border-white/30 text-white hover:border-brand-400 hover:bg-brand-500/10 hover:text-brand-300`
      : variant === 'ghost'
        ? `${base} text-white hover:bg-white/5 hover:text-brand-300`
        : `${base} bg-white text-black font-medium hover:bg-brand-500 hover:text-white shadow-[0_0_0_0_rgba(215,71,9,0)] hover:shadow-[0_8px_24px_-4px_rgba(215,71,9,0.45)]`;
  if (cta.href === '#chat') {
    return <InquiryTrigger className={cls}>{cta.label}</InquiryTrigger>;
  }
  return (
    <Link href={cta.href} className={cls}>
      {cta.label}
    </Link>
  );
}

// ────────────────────────────────────────────────────────────────────
// two-column-block
// Foto + texto/botón en 2 columnas. La foto puede ir a izquierda o derecha.
// ────────────────────────────────────────────────────────────────────
export function TwoColumnBlockSection({
  eyebrow,
  title,
  body,
  cta,
  image,
  imagePosition = 'left',
  background = 'dark',
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  cta?: Cta;
  image?: { url: string; alt?: string };
  imagePosition?: 'left' | 'right';
  background?: 'dark' | 'darker';
}) {
  const bgClass = background === 'darker' ? 'bg-black' : 'bg-neutral-950';
  const imageFirst = imagePosition === 'left';
  return (
    <section className={`border-t border-white/10 ${bgClass}`}>
      <div className="mx-auto max-w-6xl px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <FadeUp className={`${imageFirst ? 'md:order-1' : 'md:order-2'}`}>
          {image?.url ? (
            <div className="group overflow-hidden rounded-2xl bg-neutral-900 aspect-[4/5] relative ring-1 ring-white/10 hover:ring-brand-400/30 transition-all duration-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt ?? ''}
                className="h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.04]"
              />
            </div>
          ) : (
            <div className="aspect-[4/5] rounded-2xl bg-neutral-900 flex items-center justify-center">
              <p className="font-mono text-xs uppercase tracking-widest text-white/30">Foto</p>
            </div>
          )}
        </FadeUp>
        <FadeUp delay={150} className={`${imageFirst ? 'md:order-2' : 'md:order-1'}`}>
          {eyebrow && (
            <p data-pawdoq-edit="eyebrow" className="text-sm tracking-[0.3em] uppercase text-brand-400/80">{eyebrow}</p>
          )}
          <h2 data-pawdoq-edit="title" className="mt-4 font-serif text-4xl md:text-5xl leading-[1.1]">{title}</h2>
          {body && (
            <p data-pawdoq-edit="body" className="mt-6 text-white/75 leading-relaxed text-lg whitespace-pre-line">{body}</p>
          )}
          {cta?.label && cta.href && (
            <div className="mt-8">
              <CtaButton cta={cta} />
            </div>
          )}
        </FadeUp>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// reviews
// Reseñas: manual o (futuro) Google Places API.
// ────────────────────────────────────────────────────────────────────
type Review = {
  author: string;
  rating?: number; // 1-5
  text: string;
  date?: string;
  source?: 'google' | 'facebook' | 'manual';
  avatar_url?: string;
};

function ReviewStars({ rating = 5 }: { rating?: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5 text-brand-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? 'text-brand-500' : 'text-white/15'}>
          ★
        </span>
      ))}
    </div>
  );
}

export async function ReviewsSection({
  title = 'Lo que dicen nuestras familias',
  subtitle,
  mode: _mode = 'manual',
  reviews = [],
  showAverage = true,
  google_maps_url,
}: {
  title?: string;
  subtitle?: string;
  mode?: 'manual' | 'google';
  reviews?: Review[];
  googlePlaceId?: string;
  showAverage?: boolean;
  google_maps_url?: string;
}) {
  // En el futuro: si hay GOOGLE_PLACES_API_KEY + place_id, hacer fetch
  // a Places API y mezclar con las manuales. De momento solo manuales.
  const list = reviews;
  if (list.length === 0 && !google_maps_url) return null;

  const avg =
    list.length > 0
      ? list.reduce((a, r) => a + (r.rating ?? 5), 0) / list.length
      : 0;

  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-sm tracking-[0.3em] uppercase text-brand-400/80">Testimonios</p>
          <h2 data-pawdoq-edit="title" className="mt-4 font-serif text-4xl md:text-5xl">{title}</h2>
          {subtitle && (
            <p data-pawdoq-edit="subtitle" className="mt-4 text-white/70 max-w-2xl mx-auto">{subtitle}</p>
          )}
          {showAverage && avg > 0 && (
            <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/5 px-5 py-2.5 ring-1 ring-white/10">
              <ReviewStars rating={avg} />
              <span className="font-serif text-lg text-white">{avg.toFixed(1)}</span>
              <span className="text-xs text-white/50">/ 5 · {list.length} reseñas</span>
            </div>
          )}
        </div>
        {list.length > 0 && (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((r, i) => (
              <FadeUp
                key={i}
                as="li"
                delay={i * 110}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-brand-400/40 hover:bg-white/[0.04] hover:shadow-[0_20px_40px_-20px_rgba(215,71,9,0.35)]"
              >
                <ReviewStars rating={r.rating} />
                <p data-pawdoq-edit={`reviews[${i}].text`} className="mt-4 text-white/85 leading-relaxed flex-1">&ldquo;{r.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  {r.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.avatar_url} alt={r.author} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-400 font-semibold">
                      {r.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p data-pawdoq-edit={`reviews[${i}].author`} className="font-medium text-white truncate">{r.author}</p>
                    <p className="text-xs text-white/50">
                      <span data-pawdoq-edit={`reviews[${i}].date`}>{r.date ?? ''}</span>
                      {r.source === 'google' && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          · <span className="text-white/70">Google</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </ul>
        )}
        {google_maps_url && (
          <div className="mt-12 text-center">
            <a
              href={google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-5 py-2.5 text-sm text-white/80 hover:border-white/40 hover:text-white transition"
            >
              <svg className="h-4 w-4 text-brand-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
              Ver todas las reseñas en Google
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// video-embed (YouTube / Vimeo)
// ────────────────────────────────────────────────────────────────────
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([^?&"'>]+)/);
  return m ? m[1]! : null;
}
function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1]! : null;
}
/**
 * Extrae el timestamp inicial (en segundos) de una URL de YouTube.
 * Acepta `?t=336s`, `&t=5m36s`, `&start=336`. Devuelve null si no hay.
 */
function youtubeStart(url: string): number | null {
  const direct = url.match(/[?&](?:start|t)=([0-9]+)s?(?:&|$)/);
  if (direct) return parseInt(direct[1]!, 10);
  // formato 1m23s o 1h2m3s
  const human = url.match(/[?&]t=(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?/);
  if (human) {
    const h = parseInt(human[1] ?? '0', 10);
    const m = parseInt(human[2] ?? '0', 10);
    const s = parseInt(human[3] ?? '0', 10);
    const total = h * 3600 + m * 60 + s;
    return total > 0 ? total : null;
  }
  return null;
}

export function VideoEmbedSection({
  eyebrow,
  title,
  url,
  caption,
  aspectRatio = '16:9',
}: {
  eyebrow?: string;
  title?: string;
  url: string;
  caption?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}) {
  const yt = youtubeId(url);
  const vm = vimeoId(url);
  let embedUrl: string | null = null;
  if (yt) {
    const start = youtubeStart(url);
    embedUrl = `https://www.youtube-nocookie.com/embed/${yt}${
      start ? `?start=${start}` : ''
    }`;
  } else if (vm) embedUrl = `https://player.vimeo.com/video/${vm}`;

  if (!embedUrl) return null;
  const ratio =
    aspectRatio === '9:16' ? 'aspect-[9/16] max-w-md mx-auto' : aspectRatio === '1:1' ? 'aspect-square max-w-2xl mx-auto' : 'aspect-video';

  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-5xl px-6 py-24">
        {(eyebrow || title) && (
          <div className="text-center mb-10">
            {eyebrow && (
              <p className="text-sm tracking-[0.3em] uppercase text-brand-400/80">{eyebrow}</p>
            )}
            {title && <h2 className="mt-4 font-serif text-4xl md:text-5xl">{title}</h2>}
          </div>
        )}
        <div className={`overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 ${ratio}`}>
          <iframe
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            className="h-full w-full"
            title={title ?? 'Vídeo'}
          />
        </div>
        {caption && (
          <p className="mt-4 text-center text-sm text-white/60 italic">{caption}</p>
        )}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// press-logos / featured-in
// ────────────────────────────────────────────────────────────────────
type PressItem = { name: string; logo_url?: string; link_url?: string; year?: string };

export function PressLogosSection({
  title = 'Hemos aparecido en',
  items,
}: {
  title?: string;
  items: PressItem[];
}) {
  if (!items || items.length === 0) return null;
  // Duplicamos los items para que el marquee sea visualmente continuo.
  const loop = [...items, ...items];
  return (
    <section className="border-t border-white/10 bg-neutral-950 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-center text-sm tracking-[0.3em] uppercase text-white/50 mb-10">
          {title}
        </p>
        <div
          className="marquee-container relative"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <div className="flex w-max gap-x-12 gap-y-6 animate-marquee">
            {loop.map((it, i) => {
              const Inner = (
                <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition group whitespace-nowrap">
                  {it.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.logo_url}
                      alt={it.name}
                      className="h-8 max-w-[140px] object-contain grayscale brightness-150 contrast-50 group-hover:grayscale-0 group-hover:brightness-100 group-hover:contrast-100 transition-all duration-500"
                    />
                  ) : (
                    <span className="font-serif text-2xl text-white/80 group-hover:text-brand-300 transition-colors duration-500">
                      {it.name}
                    </span>
                  )}
                  {it.year && (
                    <span className="text-xs text-white/40 group-hover:text-brand-400/70 transition-colors duration-500">
                      {it.year}
                    </span>
                  )}
                </div>
              );
              return it.link_url ? (
                <a key={i} href={it.link_url} target="_blank" rel="noreferrer" className="flex items-center px-2">
                  {Inner}
                </a>
              ) : (
                <span key={i} className="flex items-center px-2">{Inner}</span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// kennel-stats
// ────────────────────────────────────────────────────────────────────
type Stat = { value: string; label: string; suffix?: string };

export function KennelStatsSection({
  eyebrow,
  title,
  stats,
}: {
  eyebrow?: string;
  title?: string;
  stats: Stat[];
}) {
  return (
    <section className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-6 py-20">
        {(eyebrow || title) && (
          <div className="text-center mb-12">
            {eyebrow && (
              <p className="text-sm tracking-[0.3em] uppercase text-brand-400/80">{eyebrow}</p>
            )}
            {title && <h2 className="mt-4 font-serif text-3xl md:text-4xl">{title}</h2>}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <FadeUp key={i} delay={i * 120}>
              <p className="font-serif text-5xl md:text-6xl text-white">
                <CountUp value={s.value} suffix={s.suffix ?? ''} />
              </p>
              <p
                data-pawdoq-edit={`stats[${i}].label`}
                className="mt-2 text-xs uppercase tracking-widest text-white/50"
              >
                {s.label}
              </p>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// process-steps
// ────────────────────────────────────────────────────────────────────
type Step = { title: string; body: string };

export function ProcessStepsSection({
  eyebrow,
  title,
  steps,
}: {
  eyebrow?: string;
  title?: string;
  steps: Step[];
}) {
  if (!steps || steps.length === 0) return null;
  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6 py-24">
        {(eyebrow || title) && (
          <div className="text-center mb-14">
            {eyebrow && (
              <p className="text-sm tracking-[0.3em] uppercase text-brand-400/80">{eyebrow}</p>
            )}
            {title && <h2 className="mt-4 font-serif text-4xl md:text-5xl">{title}</h2>}
          </div>
        )}
        <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <FadeUp key={i} as="li" delay={i * 90} className="relative group">
              <p className="font-serif text-6xl text-brand-400/30 leading-none transition-colors duration-500 group-hover:text-brand-400/70" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 data-pawdoq-edit={`steps[${i}].title`} className="mt-4 font-serif text-2xl text-white">{s.title}</h3>
              <p data-pawdoq-edit={`steps[${i}].body`} className="mt-3 text-white/70 leading-relaxed">{s.body}</p>
            </FadeUp>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// faq
// ────────────────────────────────────────────────────────────────────
type FaqItem = { q: string; a: string };

export function FaqSection({
  eyebrow,
  title,
  items,
}: {
  eyebrow?: string;
  title?: string;
  items: FaqItem[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-3xl px-6 py-24">
        {(eyebrow || title) && (
          <div className="text-center mb-12">
            {eyebrow && (
              <p className="text-sm tracking-[0.3em] uppercase text-brand-400/80">{eyebrow}</p>
            )}
            {title && <h2 className="mt-4 font-serif text-4xl md:text-5xl">{title}</h2>}
          </div>
        )}
        <ul className="divide-y divide-white/10">
          {items.map((f, i) => (
            <FadeUp key={i} as="li" delay={i * 70} className="py-6">
              <details className="group">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none transition-colors hover:text-brand-300">
                  <h3 data-pawdoq-edit={`items[${i}].q`} className="font-serif text-xl text-white pr-4 group-hover:text-brand-300 transition-colors">{f.q}</h3>
                  <span className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-400/40 text-brand-400 text-2xl group-open:rotate-45 group-open:bg-brand-500/10 group-open:border-brand-400 transition-all duration-300">
                    +
                  </span>
                </summary>
                <p data-pawdoq-edit={`items[${i}].a`} className="mt-4 text-white/70 leading-relaxed whitespace-pre-line">{f.a}</p>
              </details>
            </FadeUp>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// latest-posts
// ────────────────────────────────────────────────────────────────────
type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  category_slug: string | null;
};

export async function LatestPostsSection({
  eyebrow = 'Blog',
  title = 'Últimas publicaciones',
  limit = 3,
}: {
  eyebrow?: string;
  title?: string;
  limit?: number;
}) {
  const kennel = await getCurrentKennel();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any;
  const { data } = await admin
    .from('kennel_posts')
    .select('slug, title, excerpt, cover_image_url, published_at, category_slug')
    .eq('kennel_id', kennel.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  const posts = (data as Post[] | null) ?? [];
  if (posts.length === 0) return null;

  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.3em] uppercase text-brand-400/80">{eyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl">{title}</h2>
          </div>
          <Link
            href="/blog"
            className="hidden sm:inline-flex items-center text-sm uppercase tracking-widest text-brand-400 hover:text-brand-300"
          >
            Ver blog →
          </Link>
        </div>
        <ul className="grid gap-8 md:grid-cols-3">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:border-brand-400/40 transition h-full"
              >
                {p.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.cover_image_url}
                    alt={p.title}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="aspect-[4/3] w-full bg-neutral-900" />
                )}
                <div className="flex flex-col flex-1 p-6">
                  {p.category_slug && (
                    <p className="text-xs uppercase tracking-widest text-brand-400/80">
                      {p.category_slug}
                    </p>
                  )}
                  <h3 className="mt-2 font-serif text-2xl text-white group-hover:text-brand-300 transition">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-3 text-sm text-white/70 leading-relaxed flex-1">
                      {p.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// chat-promo
// ────────────────────────────────────────────────────────────────────
export function ChatPromoSection({
  eyebrow,
  title = '¿Tienes dudas?',
  body = 'Habla con nuestro asistente — responde 24/7 sobre la raza, la reserva o cualquier cosa que necesites.',
  ctaLabel = 'Abrir chat',
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
}) {
  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        {eyebrow && (
          <p data-pawdoq-edit="eyebrow" className="text-sm tracking-[0.3em] uppercase text-brand-400/80">{eyebrow}</p>
        )}
        <h2 data-pawdoq-edit="title" className="mt-4 font-serif text-4xl md:text-5xl">{title}</h2>
        <p data-pawdoq-edit="body" className="mt-6 text-white/70 leading-relaxed mx-auto max-w-xl">{body}</p>
        <InquiryTrigger className="mt-8 inline-flex items-center px-7 py-3 rounded-full bg-white text-black font-medium hover:bg-brand-300 transition">
          {ctaLabel} →
        </InquiryTrigger>
      </div>
    </section>
  );
}

// Reservado para Image que pueda servir Next/Image en ambos modos
export const _Image = Image;
