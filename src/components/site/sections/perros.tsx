/**
 * Secciones de "Nuestros perros" — versiones simplificadas con queries locales.
 */
import Link from 'next/link'
import { getCurrentKennel } from '@/lib/kennel-context'
import {
  getDogsByKennel,
  getReproductiveDogsByKennel,
  getAvailablePuppiesByKennel,
  type SiteDog,
} from '@/lib/kennel/data'
import { SectionHeader } from '@/components/site/section-primitives'
import { resizedThumb } from '@/lib/storage-image'
import { isContactPageEnabled, resolveContactHref } from '@/lib/kennel/pages'
import { HeroCtaButton } from '@/components/site/hero-cta-button'
import { getKennelReproductiveBreedNames } from '@/lib/kennel/breeds'
import { createClient } from '@/lib/supabase/server'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

type Tr = (key: string) => string

function DogCard({ d, t }: { d: SiteDog; t: Tr }) {
  return (
    <Link
      href={`https://genealogic.io/dogs/${d.slug || d.id}`}
      target="_blank"
      className="group block overflow-hidden bg-surface-card ring-1 ring-hairline hover:ring-2 hover:ring-theme-accent hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-2xl"
      style={{ borderRadius: 'var(--button-radius, 12px)' }}
    >
      <div className="relative aspect-square bg-canvas overflow-hidden">
        {d.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resizedThumb(d.thumbnail_url, 400)}
            alt={d.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-3xl opacity-50">
            {d.name[0]?.toUpperCase()}
          </div>
        )}
        {d.is_for_sale && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-canvas/95 backdrop-blur px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink shadow-sm" style={{ borderRadius: 'var(--button-radius, 999px)' }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('Disponible')}
          </span>
        )}
      </div>
      <div className="p-4">
        <p
          className="text-[15px] font-bold text-ink truncate tracking-[-0.01em] group-hover:text-theme-accent transition-colors"
          style={{ fontFamily: 'var(--font-display, inherit)' }}
        >
          {d.name}
        </p>
        <p className="text-[11px] text-muted mt-1 uppercase tracking-[0.08em]">
          {d.sex === 'male' ? `♂ ${t('Macho')}` : `♀ ${t('Hembra')}`}
          {d.breed?.name ? ` · ${d.breed.name}` : ''}
          {d.color?.name ? ` · ${d.color.name}` : ''}
        </p>
        {d.is_for_sale && d.sale_price != null && (
          <p className="text-[12px] font-bold text-theme-accent mt-2">
            {d.sale_price.toLocaleString('es-ES')} {d.sale_currency || 'EUR'}
          </p>
        )}
      </div>
    </Link>
  )
}

function DogGrid({ dogs, empty, t }: { dogs: SiteDog[]; empty?: string; t: Tr }) {
  if (!dogs.length) {
    return (
      <div className="border border-dashed border-hairline bg-canvas p-12 text-center" style={{ borderRadius: 'var(--button-radius, 12px)' }}>
        <p className="text-sm text-muted">{empty || t('Sin perros en esta categoría ahora mismo.')}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
      {dogs.map(d => <DogCard key={d.id} d={d} t={t} />)}
    </div>
  )
}

export async function AvailablePuppiesGridSection(props: { title?: string; subtitle?: string; empty_text?: string }) {
  const t = getTranslator(await getLocale())
  const kennel = await getCurrentKennel()
  const dogs = await getAvailablePuppiesByKennel(kennel.id)
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {(props.title || props.subtitle) && (
          <div className="mb-8">
            {props.title && <h2 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">{props.title}</h2>}
            {props.subtitle && <p className="text-body mt-2 max-w-2xl">{props.subtitle}</p>}
          </div>
        )}
        <DogGrid dogs={dogs} t={t} empty={props.empty_text || t('No hay cachorros disponibles ahora mismo. Apúntate a la lista de espera para la próxima camada.')} />
      </div>
    </section>
  )
}

export async function BreedingDogsGridSection(props: { title?: string; subtitle?: string; sex?: 'male' | 'female' | 'all' }) {
  const t = getTranslator(await getLocale())
  const kennel = await getCurrentKennel()
  let dogs = await getReproductiveDogsByKennel(kennel.id)
  if (props.sex === 'male') dogs = dogs.filter(d => d.sex === 'male')
  if (props.sex === 'female') dogs = dogs.filter(d => d.sex === 'female')
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {(props.title || props.subtitle) && (
          <div className="mb-8">
            {props.title && <h2 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">{props.title}</h2>}
            {props.subtitle && <p className="text-body mt-2 max-w-2xl">{props.subtitle}</p>}
          </div>
        )}
        <DogGrid dogs={dogs} t={t} />
      </div>
    </section>
  )
}

export async function DogsTabsSection(props: {
  title?: string
  subtitle?: string
  eyebrow?: string
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const t = getTranslator(await getLocale())
  const kennel = await getCurrentKennel()
  const tab = (props.searchParams?.tab as string) || 'available'
  const all = await getDogsByKennel(kennel.id)

  const available = all.filter(d => d.is_for_sale)
  const males = all.filter(d => d.is_reproductive && d.sex === 'male')
  const females = all.filter(d => d.is_reproductive && d.sex === 'female')
  // "Criados por nosotros" = el resto del catálogo público del kennel: perros
  // adultos ya entregados a familias, retirados, ejemplares de pedigree, etc.
  // Quedan fuera los reproductores activos y los disponibles (ya tienen tab).
  const bredByUs = all.filter(d => !d.is_for_sale && !d.is_reproductive)

  // Auto-hide tabs vacíos. Si TODO está vacío, mostramos solo el primero con
  // mensaje de empty state.
  const allTabs = [
    { key: 'available', label: t('Disponibles'), dogs: available, empty: t('No hay cachorros disponibles ahora mismo. Apúntate a la lista de espera.') },
    { key: 'males', label: t('Sementales'), dogs: males, empty: t('Aún no hay sementales publicados.') },
    { key: 'females', label: t('Hembras de cría'), dogs: females, empty: t('Aún no hay hembras de cría publicadas.') },
    { key: 'bred', label: t('Criados por nosotros'), dogs: bredByUs, empty: t('Aún no hay perros criados publicados.') },
  ]
  const tabs = allTabs.filter(tb => tb.dogs.length > 0)
  // Si NADA tiene perros, mantenemos el primero como vacío para que la sección no quede mocha
  const visibleTabs = tabs.length > 0 ? tabs : [allTabs[0]]
  const active = visibleTabs.find(tb => tb.key === tab) || visibleTabs[0]

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
        {(props.title || props.eyebrow) && (
          <SectionHeader
            number="01"
            eyebrow={props.eyebrow ?? t('Cachorros')}
            title={props.title}
            subtitle={props.subtitle}
            align="left"
          />
        )}
        {/* Tabs estilo BMW M: uppercase tracking, active con border-bottom accent */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto border-b border-hairline">
          {visibleTabs.map(tb => {
            const isActive = tb.key === active.key
            return (
              <Link
                key={tb.key}
                href={`?tab=${tb.key}`}
                className={`text-[12px] font-semibold uppercase tracking-[0.14em] px-5 py-4 whitespace-nowrap transition-all relative -mb-px border-b-2 ${
                  isActive
                    ? 'border-theme-accent text-ink'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {tb.label}
                <span className={`ml-2 text-[10px] font-mono ${isActive ? 'text-theme-accent' : 'text-muted'}`}>
                  {String(tb.dogs.length).padStart(2, '0')}
                </span>
              </Link>
            )
          })}
        </div>
        <DogGrid dogs={active.dogs} empty={active.empty} t={t} />
      </div>
    </section>
  )
}

/** Botón del WaitlistCta que respeta el modal de contacto si la página de
 *  contacto está desactivada (delega en HeroCtaButton). */
function WaitlistCtaButton({
  href, label, kennelId, kennelName, contactFormConfig, reproBreedNames,
}: {
  href: string
  label: string
  kennelId: string
  kennelName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactFormConfig: any
  reproBreedNames?: string[]
}) {
  return (
    <div className="inline-block">
      <HeroCtaButton
        href={href}
        label={label}
        variant="primary"
        kennelId={kennelId}
        kennelName={kennelName}
        contactFormConfig={contactFormConfig}
        reproBreedNames={reproBreedNames}
      />
    </div>
  )
}

export async function WaitlistCtaSection(props: { title?: string; subtitle?: string; href?: string; cta_label?: string }) {
  const t = getTranslator(await getLocale())
  const kennel = await getCurrentKennel()
  const contactPageEnabled = await isContactPageEnabled(kennel.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = ((kennel as any).contact_form_config ?? null)
  // Razas de los reproductores para el selector "Raza de interés" del modal.
  const reproBreedNames = await getKennelReproductiveBreedNames(await createClient(), kennel.id)
  const resolvedHref = resolveContactHref({
    href: props.href || './contacto',
    contactPageEnabled,
  })
  return (
    <section className="py-16 lg:py-24 bg-surface-card border-y border-hairline">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-ink mb-4 tracking-[-0.02em]"
          style={{ fontFamily: 'var(--font-display, inherit)' }}
        >
          {props.title || t('¿Te interesa una próxima camada?')}
        </h2>
        <p className="text-body mb-8 leading-relaxed max-w-xl mx-auto">
          {props.subtitle || t('Vendemos por reservas, no por disponibilidad. Apúntate a la lista de espera y te avisamos cuando haya cachorros.')}
        </p>
        <WaitlistCtaButton
          href={resolvedHref}
          label={props.cta_label || t('Apuntarme a la lista de espera')}
          kennelId={kennel.id}
          kennelName={kennel.name}
          contactFormConfig={config}
          reproBreedNames={reproBreedNames}
        />
      </div>
    </section>
  )
}
