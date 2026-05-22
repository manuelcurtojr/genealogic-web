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

function DogCard({ d }: { d: SiteDog }) {
  return (
    <Link
      href={`https://genealogic.io/dogs/${d.slug || d.id}`}
      target="_blank"
      className="block rounded-xl border border-hairline bg-canvas overflow-hidden hover:border-ink/30 hover:shadow-sm transition"
    >
      <div className="aspect-square bg-surface-card overflow-hidden">
        {d.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.thumbnail_url} alt={d.name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-ink truncate">{d.name}</p>
        <p className="text-[11px] text-muted">
          {d.sex === 'male' ? 'Macho' : 'Hembra'}
          {d.breed?.name ? ` · ${d.breed.name}` : ''}
          {d.color?.name ? ` · ${d.color.name}` : ''}
        </p>
        {d.is_for_sale && d.sale_price != null && (
          <p className="text-[11px] font-semibold text-ink mt-1">
            {d.sale_price.toLocaleString('es-ES')} {d.sale_currency || 'EUR'}
          </p>
        )}
      </div>
    </Link>
  )
}

function DogGrid({ dogs, empty }: { dogs: SiteDog[]; empty?: string }) {
  if (!dogs.length) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-canvas p-10 text-center">
        <p className="text-sm text-muted">{empty || 'Sin perros en esta categoría ahora mismo.'}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {dogs.map(d => <DogCard key={d.id} d={d} />)}
    </div>
  )
}

export async function AvailablePuppiesGridSection(props: { title?: string; subtitle?: string; empty_text?: string }) {
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
        <DogGrid dogs={dogs} empty={props.empty_text || 'No hay cachorros disponibles ahora mismo. Apúntate a la lista de espera para la próxima camada.'} />
      </div>
    </section>
  )
}

export async function BreedingDogsGridSection(props: { title?: string; subtitle?: string; sex?: 'male' | 'female' | 'all' }) {
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
        <DogGrid dogs={dogs} />
      </div>
    </section>
  )
}

export async function DogsTabsSection(props: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const kennel = await getCurrentKennel()
  const tab = (props.searchParams?.tab as string) || 'available'
  const all = await getDogsByKennel(kennel.id)
  const available = all.filter(d => d.is_for_sale)
  const males = all.filter(d => d.is_reproductive && d.sex === 'male')
  const females = all.filter(d => d.is_reproductive && d.sex === 'female')

  const tabs = [
    { key: 'available', label: `Disponibles (${available.length})`, dogs: available },
    { key: 'males', label: `Sementales (${males.length})`, dogs: males },
    { key: 'females', label: `Hembras de cría (${females.length})`, dogs: females },
  ]
  const active = tabs.find(t => t.key === tab) || tabs[0]

  return (
    <section className="py-10 lg:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(t => (
            <Link
              key={t.key}
              href={`?tab=${t.key}`}
              className={`text-sm font-medium px-4 py-2 rounded-full whitespace-nowrap transition ${
                t.key === active.key ? 'bg-ink text-on-primary' : 'border border-hairline text-body hover:text-ink hover:bg-surface-soft'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <DogGrid dogs={active.dogs} />
      </div>
    </section>
  )
}

export async function WaitlistCtaSection(props: { title?: string; subtitle?: string; href?: string; cta_label?: string }) {
  return (
    <section className="py-12 lg:py-16 bg-surface-card">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3 tracking-tight">
          {props.title || '¿Te interesa una próxima camada?'}
        </h2>
        <p className="text-body mb-6">
          {props.subtitle || 'Vendemos por reservas, no por disponibilidad. Apúntate a la lista de espera y te avisamos cuando haya cachorros.'}
        </p>
        <Link
          href={props.href || './contacto'}
          className="inline-flex items-center justify-center rounded-lg bg-ink text-on-primary px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
        >
          {props.cta_label || 'Apuntarme a la lista de espera'}
        </Link>
      </div>
    </section>
  )
}
