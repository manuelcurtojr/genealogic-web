import { getCurrentKennel } from '@/lib/kennel-context';
import { getPage, type Section } from '@/lib/kennel/pages';
import { notFound } from 'next/navigation';

import {
  PageHeaderSection,
  NewsletterSection,
  TrustStripSection,
  CtaBannerSection,
} from './common';
import {
  HeroSection,
  ThreePillarsSection,
  AvailablePuppiesStripSection,
} from './home';
import {
  AvailablePuppiesGridSection,
  BreedingDogsGridSection,
  DogsTabsSection,
  WaitlistCtaSection,
} from './perros';
import {
  BreedHeroSection,
  BreedSummarySection,
  BreedTemperamentSection,
  BreedColorsSection,
  BreedTraitsSection,
} from './raza';
import { StoryHeroSection, TimelineSection, TeamSection } from './historia';
import { ServicesGridSection } from './servicios';
import {
  FacilitiesHeroSection,
  FacilityFeaturesSection,
  GalleryGridSection,
  VisitCtaSection,
} from './instalaciones';
import { BlogHeroSection, FeaturedPostSection, PostsGridSection } from './blog';
import { ContactFormSection, ContactInfoSection, MapEmbedSection } from './contacto';
import {
  TwoColumnBlockSection,
  ReviewsSection,
  VideoEmbedSection,
  PressLogosSection,
  KennelStatsSection,
  ProcessStepsSection,
  FaqSection,
  LatestPostsSection,
  ChatPromoSection,
} from './landing';

export type SectionContext = {
  searchParams?: Record<string, string | string[] | undefined>;
  /**
   * `true` cuando estamos renderizando desde el iframe del editor
   * (/admin/web-preview). Las secciones live-data lo usan para NO
   * autodesvanecerse cuando están vacías — el editor siempre las
   * quiere ver para poder editarlas/borrarlas.
   *
   * En la web pública es siempre `false`.
   */
  editMode?: boolean;
};

/**
 * Dispatch por section.type. Si el tipo no existe en el registro, se ignora
 * silenciosamente (en dev se imprime un warning).
 */
export async function renderSection(
  s: Section,
  ctx: SectionContext = {},
): Promise<React.ReactNode> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = (s.props ?? {}) as any;
  switch (s.type) {
    // common
    case 'page-header':
      return <PageHeaderSection {...props} />;
    case 'newsletter':
      return <NewsletterSection {...props} />;
    case 'trust-strip':
      return <TrustStripSection {...props} />;
    case 'cta-banner':
      return <CtaBannerSection {...props} />;

    // home
    case 'hero':
      return <HeroSection {...props} />;
    case 'three-pillars':
      return <ThreePillarsSection {...props} />;
    case 'available-puppies-strip':
      return <AvailablePuppiesStripSection {...props} editMode={ctx.editMode} />;

    // perros
    case 'available-puppies-grid':
      return <AvailablePuppiesGridSection {...props} />;
    case 'breeding-dogs-grid':
      return <BreedingDogsGridSection {...props} />;
    case 'dogs-tabs':
      return <DogsTabsSection {...props} searchParams={ctx.searchParams} />;
    case 'waitlist-cta':
      return <WaitlistCtaSection {...props} />;

    // raza
    case 'breed-hero':
      return <BreedHeroSection {...props} />;
    case 'breed-summary':
      return <BreedSummarySection {...props} />;
    case 'breed-temperament':
      return <BreedTemperamentSection {...props} />;
    case 'breed-colors':
      return <BreedColorsSection {...props} />;
    case 'breed-traits':
      return <BreedTraitsSection {...props} />;

    // historia
    case 'story-hero':
      return <StoryHeroSection {...props} />;
    case 'timeline':
      return <TimelineSection {...props} />;
    case 'team':
      return <TeamSection {...props} />;

    // servicios
    case 'services-grid':
      return <ServicesGridSection {...props} />;

    // instalaciones
    case 'facilities-hero':
      return <FacilitiesHeroSection {...props} />;
    case 'facility-features':
      return <FacilityFeaturesSection {...props} />;
    case 'gallery-grid':
      return <GalleryGridSection {...props} />;
    case 'visit-cta':
      return <VisitCtaSection {...props} />;

    // blog
    case 'blog-hero':
      return <BlogHeroSection {...props} />;
    case 'featured-post':
      return <FeaturedPostSection {...props} />;
    case 'posts-grid':
      return <PostsGridSection {...props} />;

    // contacto
    case 'contact-form':
      return <ContactFormSection {...props} />;
    case 'contact-info':
      return <ContactInfoSection {...props} />;
    case 'map-embed':
      return <MapEmbedSection {...props} />;

    // landing extras
    case 'two-column-block':
      return <TwoColumnBlockSection {...props} />;
    case 'reviews':
      return <ReviewsSection {...props} />;
    case 'video-embed':
      return <VideoEmbedSection {...props} />;
    case 'press-logos':
      return <PressLogosSection {...props} />;
    case 'kennel-stats':
      return <KennelStatsSection {...props} />;
    case 'process-steps':
      return <ProcessStepsSection {...props} />;
    case 'faq':
      return <FaqSection {...props} />;
    case 'latest-posts':
      return <LatestPostsSection {...props} />;
    case 'chat-promo':
      return <ChatPromoSection {...props} />;

    default:
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[PageRenderer] sección desconocida: "${s.type}"`);
      }
      return null;
  }
}

/**
 * Renderiza una página completa por slug. Lee kennel_pages y monta
 * todas las secciones en orden. Si la página no existe o está deshabilitada
 * → 404.
 */
export async function PageRenderer({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const kennel = await getCurrentKennel();
  const page = await getPage(kennel.id, slug);
  if (!page) notFound();

  const rendered = await Promise.all(
    page.sections.map((s) => renderSection(s, { searchParams: sp })),
  );
  return (
    <>
      {rendered.map((node, i) => (
        <div key={page.sections[i]?.id ?? i}>{node}</div>
      ))}
    </>
  );
}

/**
 * Genera metadata desde el page row.
 */
export async function generatePageMetadata(slug: string) {
  const kennel = await getCurrentKennel();
  const page = await getPage(kennel.id, slug);
  if (!page) return {};
  return {
    title: page.meta_title ?? undefined,
    description: page.meta_description ?? undefined,
  };
}
