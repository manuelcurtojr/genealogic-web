import { getCurrentKennel } from '@/lib/kennel-context'
import { getPage, type Section } from '@/lib/kennel/pages'
import { notFound } from 'next/navigation'

import {
  PageHeaderSection,
  NewsletterSection,
  TrustStripSection,
  CtaBannerSection,
} from './common'
import {
  HeroSection,
  ThreePillarsSection,
  AvailablePuppiesStripSection,
} from './home'
import {
  AvailablePuppiesGridSection,
  BreedingDogsGridSection,
  DogsTabsSection,
  WaitlistCtaSection,
} from './perros'
import {
  BreedHeroSection,
  BreedSummarySection,
  BreedTemperamentSection,
  BreedColorsSection,
  BreedTraitsSection,
} from './raza'
import { StoryHeroSection, TimelineSection, TeamSection } from './historia'
import { ServicesGridSection } from './servicios'
import {
  FacilitiesHeroSection,
  FacilityFeaturesSection,
  GalleryGridSection,
  VisitCtaSection,
} from './instalaciones'
import { BlogHeroSection, FeaturedPostSection, PostsGridSection } from './blog'
import { ContactFormSection, ContactInfoSection, MapEmbedSection } from './contacto'
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
} from './landing'

export type SectionContext = {
  searchParams?: Record<string, string | string[] | undefined>
  editMode?: boolean
}

/**
 * Dispatch por section.type.
 *
 * CRÍTICO: para que AsyncLocalStorage propague el kennel a las secciones async,
 * llamamos a cada componente como función (await Comp(props)) en lugar de
 * devolverlo como JSX (<Comp/>). Si retornamos JSX, React lo evalúa más tarde
 * fuera del scope de runWithKennel y getCurrentKennel() lanza.
 */
export async function renderSection(
  s: Section,
  ctx: SectionContext = {},
): Promise<React.ReactNode> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = (s.props ?? {}) as any
  switch (s.type) {
    // common
    case 'page-header':       return await PageHeaderSection(props)
    case 'newsletter':        return await NewsletterSection(props)
    case 'trust-strip':       return await TrustStripSection(props)
    case 'cta-banner':        return await CtaBannerSection(props)

    // home
    case 'hero':                       return await HeroSection(props)
    case 'three-pillars':              return await ThreePillarsSection(props)
    case 'available-puppies-strip':    return await AvailablePuppiesStripSection({ ...props, editMode: ctx.editMode })

    // perros
    case 'available-puppies-grid':     return await AvailablePuppiesGridSection(props)
    case 'breeding-dogs-grid':         return await BreedingDogsGridSection(props)
    case 'dogs-tabs':                  return await DogsTabsSection({ ...props, searchParams: ctx.searchParams })
    case 'waitlist-cta':               return await WaitlistCtaSection(props)

    // raza
    case 'breed-hero':         return await BreedHeroSection(props)
    case 'breed-summary':      return await BreedSummarySection(props)
    case 'breed-temperament':  return await BreedTemperamentSection(props)
    case 'breed-colors':       return await BreedColorsSection(props)
    case 'breed-traits':       return await BreedTraitsSection(props)

    // historia
    case 'story-hero':  return await StoryHeroSection(props)
    case 'timeline':    return await TimelineSection(props)
    case 'team':        return await TeamSection(props)

    // servicios
    case 'services-grid':  return await ServicesGridSection(props)

    // instalaciones
    case 'facilities-hero':    return await FacilitiesHeroSection(props)
    case 'facility-features':  return await FacilityFeaturesSection(props)
    case 'gallery-grid':       return await GalleryGridSection(props)
    case 'visit-cta':          return await VisitCtaSection(props)

    // blog
    case 'blog-hero':       return await BlogHeroSection(props)
    case 'featured-post':   return await FeaturedPostSection(props)
    case 'posts-grid':      return await PostsGridSection(props)

    // contacto
    case 'contact-form':  return await ContactFormSection(props)
    case 'contact-info':  return await ContactInfoSection(props)
    case 'map-embed':     return await MapEmbedSection(props)

    // landing extras
    case 'two-column-block':  return await TwoColumnBlockSection(props)
    case 'reviews':           return await ReviewsSection(props)
    case 'video-embed':       return await VideoEmbedSection(props)
    case 'press-logos':       return await PressLogosSection(props)
    case 'kennel-stats':      return await KennelStatsSection(props)
    case 'process-steps':     return await ProcessStepsSection(props)
    case 'faq':               return await FaqSection(props)
    case 'latest-posts':      return await LatestPostsSection(props)
    case 'chat-promo':        return await ChatPromoSection(props)

    default:
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[PageRenderer] sección desconocida: "${s.type}"`)
      }
      return null
  }
}

export async function PageRenderer({
  slug, searchParams,
}: {
  slug: string
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (await searchParams) ?? {}
  const kennel = await getCurrentKennel()
  const page = await getPage(kennel.id, slug)
  if (!page) notFound()

  // Secuencial para que el ALS context se preserve a través de cada await.
  // (Promise.all funciona con ALS pero algunos runtimes son flaky con N tareas
  // concurrentes — secuencial es seguro y suficientemente rápido a esta escala.)
  const rendered: React.ReactNode[] = []
  for (const sec of page.sections) {
    rendered.push(await renderSection(sec, { searchParams: sp }))
  }
  return (
    <>
      {rendered.map((node, i) => (
        <div key={page.sections[i]?.id ?? i}>{node}</div>
      ))}
    </>
  )
}

export async function generatePageMetadata(slug: string) {
  const kennel = await getCurrentKennel()
  const page = await getPage(kennel.id, slug)
  if (!page) return {}
  return {
    title: page.meta_title ?? undefined,
    description: page.meta_description ?? undefined,
  }
}
