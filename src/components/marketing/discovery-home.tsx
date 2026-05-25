/**
 * DiscoveryHome — home master de Genealogic, versión visual potente.
 *
 * Estructura:
 *   1) Hero cinematográfico — fondo con mosaico de perros + overlay, hero
 *      text centrado, search box prominente, counts en vivo
 *   2) Dual CTAs — dos cards grandes con imagen de fondo (criador/owner)
 *   3) Bento grid de features — 6 capabilities mostradas tipo Apple
 *   4) Catálogo de perros — grid editorial con cards hover
 *   5) Criaderos destacados — fila horizontal con scroll
 *   6) Blog slider
 *   7) CTA final dark
 *
 * Énfasis en:
 *  - Tipografía Fraunces para headings (más editorial)
 *  - Spacing generoso, alturas grandes (hero 90vh)
 *  - Imágenes reales del catálogo como fondo (en lugar de placeholders)
 *  - Microinteracciones (hover scale, transitions)
 *  - Paleta acentuada (#FE6620 naranja Genealogic)
 */
'use client'

import Link from 'next/link'
import {
  ArrowRight, Search, Store, Dog, GitBranch, ShieldCheck,
  Sparkles, Camera, Calendar, Globe, Mail, KanbanSquare,
  Stethoscope, FileText, Heart, Zap,
} from 'lucide-react'
import LiveCounter from './live-counter'
import BlogSlider from './blog-slider'
import HeroMosaic from './hero-mosaic'

type Dog = {
  id: string
  name: string
  slug: string | null
  thumbnail_url: string | null
  breed?: { name?: string } | null
}

type Kennel = {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  country?: string | null
  city?: string | null
}

type BlogCard = {
  slug: string
  title: string
  excerpt: string
  category: string
  heroImage: string
  heroAlt: string
  readMinutes: number
  date: string
}

export default function DiscoveryHome({
  counts, featuredDogs, featuredKennels, blogPosts, mosaicPhotos,
}: {
  counts: { dogs: number; kennels: number; breeds: number }
  featuredDogs: Dog[]
  featuredKennels: Kennel[]
  blogPosts: BlogCard[]
  /** 12 thumbnails de razas distintas para el mosaico del hero.
   *  Se eligen server-side cada request (cambian al recargar). */
  mosaicPhotos: string[]
}) {
  // Mosaico del hero: ya viene filtrado por raza única desde page.tsx.
  // Si por lo que sea viene vacío, fallback a thumbnails de featuredDogs.
  const heroThumbs = mosaicPhotos.length > 0
    ? mosaicPhotos
    : (featuredDogs.map((d) => d.thumbnail_url).filter(Boolean) as string[])

  return (
    <main className="bg-canvas">
      {/* ═════ HERO CINEMATOGRÁFICO ═════ */}
      <section className="relative overflow-hidden border-b border-hairline">
        {/* Fondo: mosaico rotativo de perros (componente client con cross-fade) */}
        <HeroMosaic photos={heroThumbs} />

        {/* Contenido hero */}
        <div className="relative z-10 mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-12 py-14 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas/80 backdrop-blur-md px-3 py-1.5 text-[10.5px] sm:text-[11.5px] font-semibold uppercase tracking-[0.08em] sm:tracking-[0.1em] text-ink shadow-sm">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FE6620] animate-pulse" />
              <span className="line-clamp-1">El registro público de genealogías caninas</span>
            </div>

            <h1
              className="mt-5 sm:mt-7 font-semibold text-ink"
              style={{
                fontSize: 'clamp(34px, 7vw, 80px)',
                lineHeight: 1.05,
                letterSpacing: '-0.045em',
              }}
            >
              Cada perro con su pedigree.{' '}
              <span style={{ color: '#FE6620' }} className="font-medium">Cada criador con su escaparate.</span>
            </h1>

            <p
              className="mt-5 sm:mt-7 max-w-[580px] text-body"
              style={{ fontSize: 'clamp(15px, 1.6vw, 21px)', lineHeight: 1.5 }}
            >
              Genealogía verificable, papeles digitales y calendario veterinario.
              Para criadores que se toman su trabajo en serio y propietarios que
              merecen tenerlo todo documentado.
            </p>

            {/* Search box prominente — padding reducido en mobile */}
            <form
              action="/search"
              method="get"
              className="mt-7 sm:mt-9 flex max-w-2xl items-center gap-2 rounded-2xl border-2 border-ink/10 bg-canvas px-3.5 sm:px-5 py-2.5 sm:py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] focus-within:border-ink/40 transition-all"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted flex-shrink-0" />
              <input
                name="q"
                type="text"
                placeholder="Busca un perro, criador o raza…"
                className="flex-1 bg-transparent text-[14px] sm:text-[16px] text-ink placeholder:text-muted focus:outline-none min-w-0"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-3 sm:px-5 py-2 sm:py-2.5 text-[13px] sm:text-[14px] font-bold hover:opacity-90 transition shrink-0"
              >
                <span className="hidden sm:inline">Buscar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* CTAs duales secundarios */}
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted">
              <span>Empieza:</span>
              <Link href="/register?intent=breeder" className="font-semibold text-ink hover:opacity-80 inline-flex items-center gap-1">
                <Store className="w-3.5 h-3.5" /> Como criador
              </Link>
              <span className="opacity-40 hidden sm:inline">·</span>
              <Link href="/register?intent=owner" className="font-semibold text-ink hover:opacity-80 inline-flex items-center gap-1">
                <Dog className="w-3.5 h-3.5" /> Como propietario
              </Link>
            </div>
          </div>

          {/* Live counts en card flotante.
              w-fit + max-w-full + overflow-x-auto: la caja se ajusta al
              contenido en desktop y permite scroll horizontal en mobile
              si los números son extremadamente largos (caso edge). */}
          <div className="mt-10 sm:mt-16 lg:mt-20 rounded-2xl border border-hairline bg-canvas/95 backdrop-blur-md px-5 sm:px-8 lg:px-10 py-5 sm:py-7 lg:py-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] w-fit max-w-full overflow-x-auto">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted">El catálogo crece en tiempo real</p>
            </div>
            <div className="flex items-end gap-6 sm:gap-12 lg:gap-16">
              <div className="min-w-[70px] sm:min-w-[90px]">
                <LiveCounter initial={counts.kennels} kind="kennels" label="Criaderos" />
              </div>
              <div className="min-w-[55px] sm:min-w-[70px]">
                <LiveCounter initial={counts.breeds} kind="breeds" label="Razas" />
              </div>
              <div className="min-w-[110px] sm:min-w-[160px] lg:min-w-[180px]">
                <LiveCounter initial={counts.dogs} kind="dogs" label="Perros" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ DUAL CTAs ═════ */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="mb-8 sm:mb-10 max-w-3xl">
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">Dos caminos</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              ¿Qué te trae a Genealogic?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Criador */}
            <Link
              href="/criadores"
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-hairline bg-gradient-to-br from-orange-50 via-canvas to-amber-50 p-6 sm:p-8 lg:p-10 hover:shadow-[0_12px_48px_rgba(254,102,32,0.15)] transition-all hover:-translate-y-1 duration-300"
            >
              {/* Big icon de fondo — más pequeño en mobile */}
              <Store className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-32 h-32 sm:w-48 sm:h-48 text-[#FE6620]/10 group-hover:text-[#FE6620]/20 transition-colors" strokeWidth={1} />

              <div className="relative">
                <div className="inline-flex w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FE6620] items-center justify-center shadow-[0_8px_24px_rgba(254,102,32,0.3)]">
                  <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <p className="mt-4 sm:mt-5 text-[11px] font-bold uppercase tracking-wider text-[#FE6620]">Para criadores</p>
                <h3 className="mt-1 font-semibold text-ink tracking-[-0.02em] leading-tight" style={{ fontSize: 'clamp(22px, 3.5vw, 32px)' }}>
                  Vende más con menos esfuerzo.
                </h3>
                <p className="mt-2.5 sm:mt-3 text-[14px] sm:text-[15px] text-body leading-[1.55] max-w-md">
                  Gestiona tu afijo, publica perros y camadas, recibe reservas y deja que el emailbot responda a leads.
                </p>
                <ul className="mt-5 sm:mt-6 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px] sm:text-[13px] text-body">
                  <MiniFeature icon={Globe}>Web pública</MiniFeature>
                  <MiniFeature icon={KanbanSquare}>Pipeline</MiniFeature>
                  <MiniFeature icon={Mail}>Emailbot</MiniFeature>
                  <MiniFeature icon={GitBranch}>Pedigrees</MiniFeature>
                </ul>
                <span className="mt-6 sm:mt-7 inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2.5 text-sm font-bold group-hover:gap-3 transition-all">
                  Ver herramientas
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* Propietario */}
            <Link
              href="/propietarios"
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-hairline bg-gradient-to-br from-blue-50 via-canvas to-sky-50 p-6 sm:p-8 lg:p-10 hover:shadow-[0_12px_48px_rgba(59,130,246,0.15)] transition-all hover:-translate-y-1 duration-300"
            >
              <Dog className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-32 h-32 sm:w-48 sm:h-48 text-blue-500/10 group-hover:text-blue-500/20 transition-colors" strokeWidth={1} />

              <div className="relative">
                <div className="inline-flex w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 items-center justify-center shadow-[0_8px_24px_rgba(59,130,246,0.3)]">
                  <Dog className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="mt-4 sm:mt-5 flex items-center gap-2 flex-wrap">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Para propietarios</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    Gratis siempre
                  </span>
                </div>
                <h3 className="mt-1 font-semibold text-ink tracking-[-0.02em] leading-tight" style={{ fontSize: 'clamp(22px, 3.5vw, 32px)' }}>
                  Tu perro merece su historia.
                </h3>
                <p className="mt-2.5 sm:mt-3 text-[14px] sm:text-[15px] text-body leading-[1.55] max-w-md">
                  Registra a tu perro, guarda su pedigree y sus papeles, recibe recordatorios de vacunas.
                </p>
                <ul className="mt-5 sm:mt-6 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px] sm:text-[13px] text-body">
                  <MiniFeature icon={Camera}>Ficha completa</MiniFeature>
                  <MiniFeature icon={GitBranch}>Pedigree</MiniFeature>
                  <MiniFeature icon={Calendar}>Vacunas</MiniFeature>
                  <MiniFeature icon={ShieldCheck}>Reclama tu perro</MiniFeature>
                </ul>
                <span className="mt-6 sm:mt-7 inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2.5 text-sm font-bold group-hover:gap-3 transition-all">
                  Crear cuenta gratis
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═════ BENTO de FEATURES ═════ */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="mb-8 sm:mb-10 max-w-3xl">
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">Una sola plataforma</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              Todo lo que tu perro o criadero necesita.
            </h2>
          </div>

          {/* Auto-rows menor en mobile para que las cards no sean cajas
              gigantes vacías. La card 2x2 sigue ocupando 2 cols en sm+. */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[150px] sm:auto-rows-[200px]">
            {/* Card grande: en mobile fila entera (col-span-2, 1 row),
                en sm+ es un 2x2 dominante. */}
            <BentoCard
              className="col-span-2 sm:row-span-2"
              icon={GitBranch}
              title="Pedigree verificable"
              desc="Árbol genealógico hasta 5 generaciones, COI calculado, ancestros enlazados al criadero original. Más fiable que un Excel."
              color="#FE6620"
              size="large"
            />
            <BentoCard
              icon={KanbanSquare}
              title="Pipeline de reservas"
              desc="Kanban con tus leads."
              color="#8b5cf6"
            />
            <BentoCard
              icon={Mail}
              title="Emailbot"
              desc="Responde por ti, 24/7."
              color="#3b82f6"
            />
            <BentoCard
              icon={Globe}
              title="Web pública"
              desc="Tu kennel con dominio."
              color="#06b6d4"
            />
            <BentoCard
              icon={Calendar}
              title="Calendario vet"
              desc="Vacunas y revisiones."
              color="#34d399"
            />
            <BentoCard
              icon={FileText}
              title="Papeles digitalizados"
              desc="Cartilla, contratos, pedigree."
              color="#f59e0b"
            />
            <BentoCard
              icon={Camera}
              title="Galería"
              desc="Fotos de cada perro."
              color="#ec4899"
            />
            <BentoCard
              icon={Stethoscope}
              title="Historial clínico"
              desc="Cada visita registrada."
              color="#0ea5e9"
            />
            <BentoCard
              icon={Zap}
              title="Importer IA"
              desc="Pedigrees en segundos."
              color="#a855f7"
            />
          </div>
        </div>
      </section>

      {/* ═════ CATÁLOGO PERROS — editorial ═════ */}
      {featuredDogs.length > 0 && (
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
            <div className="mb-6 sm:mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">El catálogo</p>
                <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                  Perros recién registrados
                </h2>
              </div>
              <Link href="/search" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:opacity-80">
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Grid uniforme 6 columnas en desktop, todas aspect-square — sin
                card 2x2 que rompe el ritmo y deja huecos en breakpoints intermedios. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {featuredDogs.slice(0, 6).map((dog) => (
                <Link
                  key={dog.id}
                  href={`/dogs/${dog.slug || dog.id}`}
                  className="group relative block overflow-hidden rounded-2xl bg-surface-card aspect-square"
                >
                  {dog.thumbnail_url ? (
                    <img
                      src={dog.thumbnail_url}
                      alt={dog.name}
                      className="h-full w-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <Dog className="w-10 h-10 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                    <p className="text-sm font-bold text-white truncate">{dog.name}</p>
                    {dog.breed?.name && (
                      <p className="text-[11px] text-white/80 truncate">{dog.breed.name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/search"
              className="sm:hidden mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:opacity-80"
            >
              Ver todos los perros <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* ═════ CRIADEROS ═════ */}
      {featuredKennels.length > 0 && (
        <section className="border-b border-hairline bg-surface-soft/40">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
            <div className="mb-6 sm:mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">La comunidad</p>
                <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                  Criaderos en Genealogic
                </h2>
              </div>
              <Link href="/kennels" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:opacity-80">
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {featuredKennels.slice(0, 6).map((k) => (
                <Link
                  key={k.id}
                  href={`/kennels/${k.slug || k.id}`}
                  className="group flex flex-col items-center text-center rounded-2xl border border-hairline bg-canvas p-5 hover:border-ink/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-card ring-4 ring-canvas group-hover:ring-[#FE6620]/10 transition">
                    {k.logo_url ? (
                      <img src={k.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><Store className="w-9 h-9 text-muted opacity-30" /></div>
                    )}
                  </div>
                  <p className="mt-4 text-[14px] font-bold text-ink truncate w-full">{k.name}</p>
                  {(k.city || k.country) && (
                    <p className="mt-0.5 text-[11px] text-muted truncate w-full">
                      {[k.city, k.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═════ BLOG SLIDER ═════ */}
      {blogPosts.length > 0 && <BlogSlider posts={blogPosts} />}

      {/* ═════ CTA FINAL OSCURO ═════ */}
      <section className="relative overflow-hidden bg-ink text-on-primary">
        {/* Decoración glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#FE6620]/30 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-12 py-16 sm:py-24 lg:py-28 text-center">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-5 sm:mb-6 text-[#FE6620]" />
          <h2
            className="font-semibold mx-auto leading-[1.05]"
            style={{
              fontSize: 'clamp(28px, 5vw, 56px)',
              letterSpacing: '-0.04em',
              maxWidth: '18ch',
            }}
          >
            Empieza gratis.{' '}
            <span className="text-white/60 font-medium">Sin tarjeta.</span>
          </h2>
          <p className="mt-4 sm:mt-5 text-[14px] sm:text-[18px] text-white/60 max-w-md mx-auto px-2">
            Únete a los criadores y propietarios que ya documentan a sus perros con Genealogic.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register?intent=breeder"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FE6620] text-white px-7 py-3.5 text-sm font-bold hover:scale-105 transition-transform"
            >
              <Store className="w-4 h-4" /> Soy criador
            </Link>
            <Link
              href="/register?intent=owner"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-ink px-7 py-3.5 text-sm font-bold hover:scale-105 transition-transform"
            >
              <Dog className="w-4 h-4" /> Soy propietario
            </Link>
          </div>
        </div>
      </section>

      {/* Footer global lo aporta el layout. */}
    </main>
  )
}

function MiniFeature({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-muted flex-shrink-0" />
      <span>{children}</span>
    </li>
  )
}

function BentoCard({
  icon: Icon, title, desc, color, size, className,
}: {
  icon: React.ElementType
  title: string
  desc: string
  color: string
  size?: 'large'
  className?: string
}) {
  const isLarge = size === 'large'
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-hairline bg-canvas p-5 sm:p-6 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 ${className || ''}`}
    >
      {/* Glow color accent */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"
        style={{ background: color }}
      />
      <div className="relative flex flex-col h-full">
        <div
          className={`inline-flex items-center justify-center rounded-xl ${isLarge ? 'w-11 h-11 sm:w-12 sm:h-12' : 'w-9 h-9 sm:w-10 sm:h-10'}`}
          style={{ background: `${color}15`, color }}
        >
          <Icon className={isLarge ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'} />
        </div>
        <h3 className={`mt-3 sm:mt-4 font-bold text-ink ${isLarge ? 'text-[18px] sm:text-[22px] tracking-[-0.02em]' : 'text-[13px] sm:text-[14.5px]'}`}>
          {title}
        </h3>
        <p className={`mt-1 sm:mt-1.5 text-body leading-[1.5] ${isLarge ? 'text-[13px] sm:text-[15px]' : 'text-[11.5px] sm:text-[12.5px]'}`}>
          {desc}
        </p>
        {isLarge && (
          <Icon className="absolute -bottom-4 -right-4 w-24 h-24 sm:w-32 sm:h-32 opacity-[0.04]" strokeWidth={1} />
        )}
      </div>
    </div>
  )
}
