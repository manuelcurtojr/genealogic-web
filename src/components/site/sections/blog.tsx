import Link from 'next/link';
import { HeroBackground } from './common';
import { getCurrentKennel } from '@/lib/kennel-context';
import { createKennelAdminClient } from '@/lib/supabase/server';

// ──────────────────────────────────────────────────────────────────────
// Sección: blog-hero
// ──────────────────────────────────────────────────────────────────────
export function BlogHeroSection({
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
        {subtitle && <p data-pawdoq-edit="subtitle" className="mt-8 text-lg text-white/80 leading-relaxed">{subtitle}</p>}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Helpers para leer posts publicados del tenant actual.
// ──────────────────────────────────────────────────────────────────────
type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number | null;
  category_slug: string | null;
};

async function getPublishedPosts(kennelId: string, limit: number, pinnedOnly = false): Promise<Post[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any;
  let q = admin
    .from('kennel_posts')
    .select('slug, title, excerpt, cover_image_url, published_at, reading_time_minutes, category_slug, pinned')
    .eq('kennel_id', kennelId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (pinnedOnly) q = q.eq('pinned', true);
  const { data } = await q;
  return (data as Post[] | null) ?? [];
}

// ──────────────────────────────────────────────────────────────────────
// Sección: featured-post
// ──────────────────────────────────────────────────────────────────────
export async function FeaturedPostSection({
  mode = 'latest',
  pinnedSlug,
}: {
  mode?: 'latest' | 'pinned';
  pinnedSlug?: string;
}) {
  const kennel = await getCurrentKennel();
  let post: Post | null = null;
  if (mode === 'pinned' && pinnedSlug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any;
    const { data } = await admin
      .from('kennel_posts')
      .select('slug, title, excerpt, cover_image_url, published_at, reading_time_minutes, category_slug')
      .eq('kennel_id', kennel.id)
      .eq('status', 'published')
      .eq('slug', pinnedSlug)
      .maybeSingle();
    post = (data as Post | null) ?? null;
  } else {
    const list = await getPublishedPosts(kennel.id, 1);
    post = list[0] ?? null;
  }

  if (!post) return null;

  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Link
          href={`/blog/${post.slug}`}
          className="group grid gap-10 md:grid-cols-2 items-center"
        >
          {post.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="aspect-[4/3] w-full rounded-2xl bg-neutral-900" />
          )}
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-400/80">
              {post.category_slug ?? 'Blog'}
            </p>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl group-hover:text-brand-300 transition">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="mt-6 text-white/75 leading-relaxed text-lg">{post.excerpt}</p>
            )}
            <p className="mt-6 text-sm uppercase tracking-widest text-brand-400">
              Leer artículo →
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sección: posts-grid
// ──────────────────────────────────────────────────────────────────────
export async function PostsGridSection({
  pageSize = 12,
  layout: _layout = 'grid',
}: {
  pageSize?: number;
  showCategories?: boolean;
  layout?: 'grid' | 'list';
}) {
  const kennel = await getCurrentKennel();
  const posts = await getPublishedPosts(kennel.id, pageSize);

  if (posts.length === 0) {
    return (
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-white/40 italic">
            Próximamente publicaremos los primeros artículos.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:border-brand-400/40 transition"
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
                <div className="p-6">
                  {p.category_slug && (
                    <p className="text-xs uppercase tracking-widest text-brand-400/80">
                      {p.category_slug}
                    </p>
                  )}
                  <h3 className="mt-2 font-serif text-2xl text-white group-hover:text-brand-300 transition">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-3 text-sm text-white/70 leading-relaxed">{p.excerpt}</p>
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
