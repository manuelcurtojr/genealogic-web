/**
 * Componentes para inyectar JSON-LD (Schema.org) en el <head> de páginas
 * públicas. Google y demás buscadores usan estos datos para rich results
 * (knowledge panel, breadcrumbs, ratings, etc).
 *
 * Reglas:
 *  - 1 componente por entidad (Dog, Kennel, BreadcrumbList...)
 *  - Solo emitir si tenemos datos válidos
 *  - Usar dangerouslySetInnerHTML con JSON.stringify para evitar XSS
 *  - Ordenar bien las propiedades, schema.org acepta varias formas
 */

type SeoImage = string | null | undefined

type DogJsonLdProps = {
  name: string
  url: string
  description?: string | null
  image?: SeoImage
  breed?: string | null
  color?: string | null
  sex?: 'male' | 'female' | null
  birthDate?: string | null
  kennel?: { name: string; slug?: string | null; url?: string } | null
  sireName?: string | null
  damName?: string | null
}

/**
 * <DogJsonLd /> — schema:Pet (no estándar, pero Google lo acepta como
 * extensión de Thing/CreativeWork). Lo emitimos como Article para que
 * Google Search Console no se queje y aún así estructure los datos.
 */
export function DogJsonLd(p: DogJsonLdProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.name,
    name: p.name,
    url: p.url,
    mainEntityOfPage: p.url,
  }
  if (p.description) data.description = p.description
  if (p.image) data.image = p.image

  // Datos del animal como about: { @type: 'Animal' } — usado por algunos
  // bots verticales (pet vertical search).
  const about: Record<string, unknown> = {
    '@type': 'Animal',
    name: p.name,
  }
  if (p.breed) about.breed = p.breed
  if (p.color) about.color = p.color
  if (p.sex) about.gender = p.sex === 'male' ? 'Male' : 'Female'
  if (p.birthDate) about.birthDate = p.birthDate
  if (p.kennel?.name) {
    about.breeder = {
      '@type': 'Organization',
      name: p.kennel.name,
      ...(p.kennel.url ? { url: p.kennel.url } : {}),
    }
  }
  data.about = about

  // Padres (familyTree)
  const family: unknown[] = []
  if (p.sireName) family.push({ '@type': 'Animal', name: p.sireName, gender: 'Male' })
  if (p.damName) family.push({ '@type': 'Animal', name: p.damName, gender: 'Female' })
  if (family.length > 0) {
    (about as Record<string, unknown>).parent = family
  }

  return <JsonLdScript data={data} />
}

type KennelJsonLdProps = {
  name: string
  url: string
  description?: string | null
  logoUrl?: SeoImage
  city?: string | null
  country?: string | null
  foundationDate?: string | null
  website?: string | null
  email?: string | null
  phone?: string | null
}

/**
 * <KennelJsonLd /> — schema:LocalBusiness con tipo más específico
 * "AnimalShelter" no aplica (es para protectoras); usamos
 * Organization + addressLocality/Country + BreedingService como serviceType.
 */
export function KennelJsonLd(p: KennelJsonLdProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: p.name,
    url: p.url,
  }
  if (p.description) data.description = p.description
  if (p.logoUrl) data.logo = p.logoUrl
  if (p.website) data.sameAs = [p.website]
  if (p.foundationDate) data.foundingDate = p.foundationDate
  if (p.city || p.country) {
    data.address = {
      '@type': 'PostalAddress',
      ...(p.city ? { addressLocality: p.city } : {}),
      ...(p.country ? { addressCountry: p.country } : {}),
    }
  }
  if (p.email || p.phone) {
    const cp: Record<string, unknown> = { '@type': 'ContactPoint', contactType: 'customer service' }
    if (p.email) cp.email = p.email
    if (p.phone) cp.telephone = p.phone
    data.contactPoint = cp
  }
  return <JsonLdScript data={data} />
}

type BreadcrumbItem = { name: string; url: string }

/**
 * <BreadcrumbJsonLd /> — schema:BreadcrumbList para que Google muestre
 * la jerarquía Inicio › Criadero › Perro en lugar de URL plana.
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  }
  return <JsonLdScript data={data} />
}

/**
 * <WebSiteJsonLd /> — schema:WebSite con SearchAction.
 *
 * Cuando Google ve este schema, suele renderizar un cuadro de búsqueda
 * directamente DENTRO del resultado del sitio en SERP (sitelinks
 * searchbox). Solo aparece para búsquedas del nombre de marca
 * ("genealogic") y requiere que el sitio tenga autoridad/tráfico.
 *
 * El template URL apunta a /search?q={search_term_string} y debe coincidir
 * con la ruta de búsqueda real del sitio.
 */
export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://genealogic.io/#website',
    url: 'https://genealogic.io',
    name: 'Genealogic',
    alternateName: 'Genealogic — Genealogías caninas verificables',
    inLanguage: 'es',
    description:
      'El registro público de genealogías caninas. Cada criador serio tiene su escaparate. Cada perro tiene su árbol genealógico verificable.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://genealogic.io/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://genealogic.io/#organization',
      name: 'Genealogic',
      url: 'https://genealogic.io',
      logo: 'https://genealogic.io/icon.svg',
    },
  }
  return <JsonLdScript data={data} />
}

/**
 * <SiteNavigationJsonLd /> — schema:SiteNavigationElement con los enlaces
 * principales del sitio.
 *
 * Empuja a Google a identificar estos enlaces como la navegación oficial,
 * que es uno de los inputs que Google usa para decidir qué sitelinks
 * generar bajo el resultado de marca.
 *
 * NO garantiza sitelinks (Google los muestra cuando hay tráfico/autoridad
 * suficiente), pero sin este schema es aún menos probable.
 */
export function SiteNavigationJsonLd() {
  const items = [
    { name: 'Inicio', url: 'https://genealogic.io' },
    { name: 'Buscar perros', url: 'https://genealogic.io/search' },
    { name: 'Razas caninas', url: 'https://genealogic.io/razas' },
    { name: 'Criaderos', url: 'https://genealogic.io/kennels' },
    { name: 'Blog', url: 'https://genealogic.io/blog' },
    { name: 'Registrarse', url: 'https://genealogic.io/register' },
  ]
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Navegación principal de Genealogic',
    itemListElement: items.map((it, i) => ({
      '@type': 'SiteNavigationElement',
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  }
  return <JsonLdScript data={data} />
}

/** Componente base — inserta el JSON-LD como <script type="application/ld+json">. */
function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
