/**
 * DiscoveryHome — home master de Genealogic.
 *
 * Filosofía: el producto se vende solo enseñando el catálogo. La home no
 * es una landing comercial; es un escaparate del registro público con
 * counts en vivo y dos puertas claras "Soy criador" / "Soy propietario"
 * para cada audiencia.
 *
 * Composición:
 *   1) Hero: claim + búsqueda + counts live (criaderos, perros, razas)
 *   2) Dos cards grandes: Criador / Propietario con CTA dedicado
 *   3) Catálogo embebido: 6 perros recientes + 6 criaderos
 *   4) ¿Cómo funciona? · 3 pasos genéricos para ambos públicos
 *   5) CTA final + footer mínimo
 */
'use client'

import Link from 'next/link'
import {
  ArrowRight, Search, Store, Dog, GitBranch, ShieldCheck,
  Sparkles, Camera, Calendar, Globe, Mail, KanbanSquare,
} from 'lucide-react'
import LiveCounter from './live-counter'

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

export default function DiscoveryHome({
  counts, featuredDogs, featuredKennels,
}: {
  counts: { dogs: number; kennels: number; breeds: number }
  featuredDogs: Dog[]
  featuredKennels: Kennel[]
}) {
  return (
    <main className="bg-canvas">
      {/* ═════ HERO ═════ */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-12 py-14 sm:py-20 lg:py-24">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
            El registro público de genealogías caninas
          </p>
          <h1
            className="mt-4 max-w-[18ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(40px, 6.5vw, 72px)', lineHeight: 1.02, letterSpacing: '-0.04em' }}
          >
            Cada perro con su pedigree. Cada criador con su escaparate.
          </h1>
          <p
            className="mt-6 max-w-[560px] text-body"
            style={{ fontSize: 'clamp(16px, 1.5vw, 19px)', lineHeight: 1.55 }}
          >
            Genealogic es la plataforma donde criadores publican su trabajo y propietarios documentan a sus perros. Búsqueda real de genealogía, papeles digitales y calendario veterinario en un solo sitio.
          </p>

          {/* Search box prominente */}
          <form action="/search" method="get" className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-hairline bg-canvas px-4 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] focus-within:border-ink/40">
            <Search className="w-4 h-4 text-muted flex-shrink-0" />
            <input
              name="q"
              type="text"
              placeholder="Busca un perro, criador o raza…"
              className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2 text-sm font-bold hover:opacity-90 transition"
            >
              Buscar
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Live counts — orden: criaderos · razas · perros (último por ser
              el más grande visualmente, evita choque con número anterior). */}
          <div className="mt-12 grid grid-cols-3 gap-x-10 sm:gap-x-16 lg:gap-x-20 max-w-3xl">
            <LiveCounter initial={counts.kennels} kind="kennels" label="Criaderos" />
            <LiveCounter initial={counts.breeds} kind="breeds" label="Razas" />
            <LiveCounter initial={counts.dogs} kind="dogs" label="Perros" />
          </div>
          <p className="mt-4 text-[11px] text-muted">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Actualizado en tiempo real
          </p>
        </div>
      </section>

      {/* ═════ DUAL CTAs (las dos puertas) ═════ */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-12 py-14 sm:py-20">
          <div className="mb-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">¿Qué quieres hacer?</p>
            <h2 className="mt-2 text-[28px] sm:text-[36px] font-semibold tracking-[-0.04em] text-ink">
              Genealogic funciona para los dos lados.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Criador */}
            <Link
              href="/criadores"
              className="group rounded-2xl border-2 border-hairline bg-canvas p-6 sm:p-8 hover:border-ink/40 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FE6620] flex items-center justify-center mb-4">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-[22px] font-bold text-ink">Soy criador</h3>
              <p className="mt-2 text-[14.5px] text-body leading-[1.55]">
                Gestiona tu afijo, publica tus perros y camadas, recibe reservas y deja que el bot responda a leads mientras duermes.
              </p>
              <ul className="mt-5 space-y-1.5 text-[13.5px] text-body">
                <Feature icon={Globe}>Web pública de tu criadero</Feature>
                <Feature icon={KanbanSquare}>Pipeline de reservas + clientes</Feature>
                <Feature icon={Mail}>Emailbot que responde a interesados</Feature>
                <Feature icon={GitBranch}>Pedigrees verificables</Feature>
              </ul>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink group-hover:translate-x-1 transition-transform">
                Ver herramientas para criadores
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            {/* Propietario */}
            <Link
              href="/propietarios"
              className="group rounded-2xl border-2 border-hairline bg-canvas p-6 sm:p-8 hover:border-ink/40 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition"
            >
              <div className="w-12 h-12 rounded-xl bg-[#3b82f6] flex items-center justify-center mb-4">
                <Dog className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-[22px] font-bold text-ink">Soy propietario</h3>
              <p className="mt-2 text-[14.5px] text-body leading-[1.55]">
                Registra a tu perro, guarda su pedigree y sus papeles, recibe recordatorios de vacunas y descubre a sus antepasados.
              </p>
              <ul className="mt-5 space-y-1.5 text-[13.5px] text-body">
                <Feature icon={Camera}>Ficha completa con galería</Feature>
                <Feature icon={GitBranch}>Pedigree y árbol genealógico</Feature>
                <Feature icon={Calendar}>Calendario vet y recordatorios</Feature>
                <Feature icon={ShieldCheck}>Reclama el perfil de tu perro</Feature>
              </ul>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink group-hover:translate-x-1 transition-transform">
                Ver lo que te ofrecemos
                <ArrowRight className="w-4 h-4" />
              </span>
              <p className="mt-3 text-[11px] uppercase tracking-wider font-bold text-emerald-700">
                Gratis para siempre
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ═════ CATÁLOGO: PERROS DESTACADOS ═════ */}
      {featuredDogs.length > 0 && (
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-12 py-14 sm:py-20">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">Catálogo</p>
                <h2 className="mt-2 text-[24px] sm:text-[30px] font-semibold tracking-[-0.04em] text-ink">
                  Perros recientes
                </h2>
              </div>
              <Link href="/search" className="text-sm font-semibold text-ink hover:opacity-80 inline-flex items-center gap-1">
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {featuredDogs.slice(0, 6).map((dog) => (
                <Link
                  key={dog.id}
                  href={`/dogs/${dog.slug || dog.id}`}
                  className="group block overflow-hidden rounded-xl border border-hairline bg-canvas hover:border-ink/30 transition"
                >
                  <div className="aspect-square bg-surface-card relative">
                    {dog.thumbnail_url
                      ? <img src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform" />
                      : <div className="flex h-full w-full items-center justify-center text-muted"><Dog className="w-10 h-10 opacity-20" /></div>}
                  </div>
                  <div className="p-3">
                    <p className="text-[13.5px] font-semibold text-ink truncate">{dog.name}</p>
                    {dog.breed?.name && (
                      <p className="mt-0.5 text-[11.5px] text-muted truncate">{dog.breed.name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═════ CATÁLOGO: CRIADEROS DESTACADOS ═════ */}
      {featuredKennels.length > 0 && (
        <section className="border-b border-hairline bg-surface-soft/40">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-12 py-14 sm:py-20">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">Comunidad</p>
                <h2 className="mt-2 text-[24px] sm:text-[30px] font-semibold tracking-[-0.04em] text-ink">
                  Criaderos en Genealogic
                </h2>
              </div>
              <Link href="/kennels" className="text-sm font-semibold text-ink hover:opacity-80 inline-flex items-center gap-1">
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {featuredKennels.slice(0, 6).map((k) => (
                <Link
                  key={k.id}
                  href={`/kennels/${k.slug || k.id}`}
                  className="group block overflow-hidden rounded-xl border border-hairline bg-canvas hover:border-ink/30 transition p-4 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden bg-surface-card flex items-center justify-center">
                    {k.logo_url
                      ? <img src={k.logo_url} alt="" className="h-full w-full object-cover" />
                      : <Store className="w-8 h-8 text-muted opacity-30" />}
                  </div>
                  <p className="mt-3 text-[13.5px] font-semibold text-ink truncate">{k.name}</p>
                  {(k.city || k.country) && (
                    <p className="mt-0.5 text-[11px] text-muted truncate">
                      {[k.city, k.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═════ CÓMO FUNCIONA ═════ */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-12 py-14 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">Cómo funciona</p>
            <h2 className="mt-2 text-[28px] sm:text-[36px] font-semibold tracking-[-0.04em] text-ink">
              Crea tu cuenta, elige tu rol, empieza.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Step n={1} title="Regístrate gratis" desc="Cuenta en 30 segundos con email. Sin tarjeta." />
            <Step n={2} title="Elige tu rol" desc="Criador o propietario. Cada uno entra en una experiencia distinta optimizada para su trabajo." />
            <Step n={3} title="Empieza a documentar" desc="Crea tu primer perro o tu criadero. Todo lo demás se construye encima." />
          </div>
        </div>
      </section>

      {/* ═════ FINAL CTA ═════ */}
      <section className="border-b border-hairline bg-ink text-on-primary">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-12 py-16 sm:py-24 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-4 text-[#FE6620]" />
          <h2 className="text-[32px] sm:text-[44px] font-semibold tracking-[-0.04em] max-w-[18ch] mx-auto leading-[1.1]">
            Empieza gratis. Sin tarjeta.
          </h2>
          <p className="mt-4 text-[16px] text-white/70 max-w-md mx-auto">
            Únete a los criadores y propietarios que ya documentan a sus perros con Genealogic.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register?intent=breeder"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FE6620] text-white px-6 py-3 text-sm font-bold hover:opacity-90 transition"
            >
              <Store className="w-4 h-4" /> Soy criador
            </Link>
            <Link
              href="/register?intent=owner"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white text-ink px-6 py-3 text-sm font-bold hover:opacity-90 transition"
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

function Feature({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 mt-0.5 text-muted flex-shrink-0" />
      <span>{children}</span>
    </li>
  )
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-6">
      <span className="inline-flex w-8 h-8 rounded-full bg-ink text-on-primary items-center justify-center text-sm font-bold">
        {n}
      </span>
      <h3 className="mt-4 text-[18px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[14px] text-body leading-[1.55]">{desc}</p>
    </div>
  )
}
