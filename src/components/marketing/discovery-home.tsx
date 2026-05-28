/**
 * DiscoveryHome — home master de Genealogic.
 *
 * Estructura:
 *   1) Hero cinematográfico con mosaico + search + counters
 *   2) Dos caminos — criador vs propietario con CTAs simétricos y micro-prueba
 *   3) Cómo funciona en 3 pasos
 *   4) Producto en acción — composición de 3 mockups vivos
 *   5) Bento de features con links a /features
 *   6) Catálogo de perros con filtros rápidos por raza
 *   7) Razas representadas (mosaico con counts reales)
 *   8) Criaderos destacados con perro estrella
 *   9) Testimonios reales
 *  10) Genealogic vs alternativas (comparativa)
 *  11) Pricing teaser
 *  12) FAQ corta
 *  13) Blog slider
 *  14) CTA final oscuro
 *
 * Énfasis: tipografía editorial, social proof real (counts y top kennels
 * vienen de Supabase, no son placeholder), microinteracciones, paleta
 * acentuada con #FE6620.
 */
'use client'

import Link from 'next/link'
import {
  ArrowRight, Search, Store, Dog, GitBranch, ShieldCheck,
  Sparkles, Camera, Calendar, Globe, Mail, KanbanSquare,
  Stethoscope, Heart, Zap, Database, Activity, Upload,
  UserPlus, Rocket, CheckCircle2, X, ChevronDown,
  Quote, Star, Baby, Mars, Venus, Clock, Plus,
} from 'lucide-react'
import { useState, useEffect } from 'react'
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

type KennelWithHero = {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  country?: string | null
  city?: string | null
  dog_count?: number
  hero_dog_thumbnail?: string | null
  hero_dog_name?: string | null
}

type BreedWithCount = {
  id: string
  name: string
  dog_count: number
  sample_thumbnail: string | null
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

/** Perro destacado para el mockup "Producto en acción".
 *  Viene resuelto desde page.tsx con sus padres y galería. */
type ShowcaseDog = {
  name: string
  slug: string | null
  sex: string | null
  birth_date: string | null
  breed_name?: string | null
  color_name?: string | null
  father_name?: string | null
  mother_name?: string | null
  photos: string[]
}

export default function DiscoveryHome({
  counts, featuredDogs, featuredKennels, topBreeds, showcaseDog, blogPosts, mosaicPhotos,
}: {
  counts: { dogs: number; kennels: number; breeds: number }
  featuredDogs: Dog[]
  featuredKennels: KennelWithHero[]
  topBreeds: BreedWithCount[]
  showcaseDog: ShowcaseDog | null
  blogPosts: BlogCard[]
  mosaicPhotos: string[]
}) {
  const heroThumbs = mosaicPhotos.length > 0
    ? mosaicPhotos
    : (featuredDogs.map((d) => d.thumbnail_url).filter(Boolean) as string[])

  return (
    <main className="bg-canvas">
      {/* ═════ HERO ═════ */}
      <section className="relative overflow-hidden border-b border-hairline">
        <HeroMosaic photos={heroThumbs} />
        <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas/80 backdrop-blur-md px-3 py-1.5 text-[10.5px] sm:text-[11.5px] font-semibold uppercase tracking-[0.08em] sm:tracking-[0.1em] text-ink shadow-sm">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FE6620] animate-pulse" />
                <span className="line-clamp-1">El registro público de genealogías caninas</span>
              </div>
              <h1
                className="mt-5 sm:mt-7 font-semibold text-ink"
                style={{ fontSize: 'clamp(34px, 5.4vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.045em' }}
              >
                Cada perro con su genealogía.{' '}
                <span style={{ color: '#FE6620' }} className="font-medium">Cada criador con su escaparate.</span>
              </h1>
              <p className="mt-5 sm:mt-7 max-w-[580px] text-body" style={{ fontSize: 'clamp(15px, 1.4vw, 19px)', lineHeight: 1.5 }}>
                Genealogía verificable, papeles digitales y calendario veterinario.
                Para criadores que se toman su trabajo en serio y propietarios que
                merecen tenerlo todo documentado.
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link href="/register?intent=breeder" className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-3 text-[14px] font-bold hover:opacity-90 transition">
                  <Store className="w-4 h-4" /> Empezar como criador <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/register?intent=owner" className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas/80 backdrop-blur-md text-ink px-5 py-3 text-[14px] font-bold hover:border-ink/30 transition">
                  <Dog className="w-4 h-4" /> Empezar como propietario
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-orange-50 via-canvas to-blue-50 p-5 sm:p-7 lg:p-8 shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
                  <div className="inline-flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#FE6620]" />
                    <p className="text-[11px] sm:text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink">Explora el catálogo</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En vivo
                  </span>
                </div>
                <form action="/search" method="get" className="flex items-center gap-2 rounded-2xl border-2 border-ink/10 bg-canvas px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-[0_4px_16px_rgba(0,0,0,0.04)] focus-within:border-ink/40 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted flex-shrink-0" />
                  <input name="q" type="text" placeholder="Busca un perro, criador o raza…" className="flex-1 bg-transparent text-[14px] sm:text-[15px] text-ink placeholder:text-muted focus:outline-none min-w-0" />
                  <button type="submit" aria-label="Buscar" className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-3 sm:px-4 py-2 text-[13px] font-bold hover:opacity-90 transition shrink-0">
                    <span className="hidden sm:inline">Buscar</span> <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {topBreeds.slice(0, 3).map((breed) => (
                    <Link key={breed.id} href={`/search?breed_id=${breed.id}`} className="inline-flex items-center rounded-full border border-hairline bg-canvas/70 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-body hover:border-ink/30 hover:text-ink transition">
                      {breed.name}
                    </Link>
                  ))}
                </div>
                <div className="my-5 sm:my-6 border-t border-hairline" />
                <p className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted mb-3 sm:mb-4">El catálogo crece en tiempo real</p>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <CompactCounter><LiveCounter size="compact" initial={counts.kennels} kind="kennels" label="Criaderos" /></CompactCounter>
                  <CompactCounter><LiveCounter size="compact" initial={counts.breeds} kind="breeds" label="Razas" /></CompactCounter>
                  <CompactCounter><LiveCounter size="compact" initial={counts.dogs} kind="dogs" label="Perros" /></CompactCounter>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ DOS CAMINOS ═════
           Mejorado: bullets más punzantes, CTAs simétricos (ambos a /register),
           micro-prueba social en cada card. */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="mb-8 sm:mb-10 max-w-3xl">
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">Dos caminos</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              ¿Qué te trae a Genealogic?
            </h2>
            <p className="mt-4 text-[15px] sm:text-[16px] text-body max-w-xl leading-relaxed">
              Misma plataforma, dos experiencias. Elige la tuya — y empieza gratis,
              sin tarjeta, sin compromisos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Criador */}
            <Link href="/register?intent=breeder" className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-hairline bg-gradient-to-br from-orange-50 via-canvas to-amber-50 p-6 sm:p-8 lg:p-10 hover:shadow-[0_12px_48px_rgba(254,102,32,0.15)] transition-all hover:-translate-y-1 duration-300">
              <Store className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-32 h-32 sm:w-48 sm:h-48 text-[#FE6620]/10 group-hover:text-[#FE6620]/20 transition-colors" strokeWidth={1} />
              <div className="relative">
                <div className="inline-flex w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FE6620] items-center justify-center shadow-[0_8px_24px_rgba(254,102,32,0.3)]">
                  <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="mt-4 sm:mt-5 flex items-center gap-2 flex-wrap">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#FE6620]">Para criadores</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">7 días Pro gratis</span>
                </div>
                <h3 className="mt-1 font-semibold text-ink tracking-[-0.02em] leading-tight" style={{ fontSize: 'clamp(22px, 3.5vw, 32px)' }}>
                  Tu criadero, gestionado de cabo a rabo.
                </h3>
                <p className="mt-2.5 sm:mt-3 text-[14px] sm:text-[15px] text-body leading-[1.55] max-w-md">
                  Genealogías hasta 10 generaciones con COI calculado, calendario
                  de celos y partos, camadas con un click, pipeline de reservas
                  que no se pierde un lead, contratos y pagos integrados. Todo
                  desde un único panel.
                </p>
                <ul className="mt-5 sm:mt-6 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px] sm:text-[13px] text-body">
                  <MiniFeature icon={GitBranch}>Genealogías COI</MiniFeature>
                  <MiniFeature icon={Heart}>Calendario celos</MiniFeature>
                  <MiniFeature icon={Baby}>Camadas y cachorros</MiniFeature>
                  <MiniFeature icon={KanbanSquare}>Pipeline reservas</MiniFeature>
                  <MiniFeature icon={Globe}>Web con tu dominio</MiniFeature>
                  <MiniFeature icon={Mail}>Emailbot 24/7</MiniFeature>
                </ul>
                {/* Social proof + CTA en filas separadas para que no se
                    solapen en viewports estrechos. */}
                <div className="mt-6 flex items-center gap-2 text-[12px] text-muted">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                  <span><strong className="text-ink tabular-nums">{counts.kennels.toLocaleString('es-ES')}</strong> criaderos ya dentro</span>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2.5 text-sm font-bold group-hover:gap-3 transition-all">
                    Empezar gratis <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>

            {/* Propietario */}
            <Link href="/register?intent=owner" className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-hairline bg-gradient-to-br from-blue-50 via-canvas to-sky-50 p-6 sm:p-8 lg:p-10 hover:shadow-[0_12px_48px_rgba(59,130,246,0.15)] transition-all hover:-translate-y-1 duration-300">
              <Dog className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-32 h-32 sm:w-48 sm:h-48 text-blue-500/10 group-hover:text-blue-500/20 transition-colors" strokeWidth={1} />
              <div className="relative">
                <div className="inline-flex w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 items-center justify-center shadow-[0_8px_24px_rgba(59,130,246,0.3)]">
                  <Dog className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="mt-4 sm:mt-5 flex items-center gap-2 flex-wrap">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Para propietarios</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Gratis siempre</span>
                </div>
                <h3 className="mt-1 font-semibold text-ink tracking-[-0.02em] leading-tight" style={{ fontSize: 'clamp(22px, 3.5vw, 32px)' }}>
                  Tu perro merece su historia.
                </h3>
                <p className="mt-2.5 sm:mt-3 text-[14px] sm:text-[15px] text-body leading-[1.55] max-w-md">
                  Sube su ficha, guarda su genealogía hasta 10 generaciones,
                  recibe avisos de vacunas y enseña su carnet con un link.
                  Sin coste, para siempre.
                </p>
                <ul className="mt-5 sm:mt-6 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px] sm:text-[13px] text-body">
                  <MiniFeature icon={Camera}>Galería ilimitada</MiniFeature>
                  <MiniFeature icon={GitBranch}>10 generaciones</MiniFeature>
                  <MiniFeature icon={Calendar}>Vacunas y vet</MiniFeature>
                  <MiniFeature icon={ShieldCheck}>Reclama tu perro</MiniFeature>
                </ul>
                <div className="mt-6 flex items-center gap-2 text-[12px] text-muted">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                  <span><strong className="text-ink tabular-nums">{counts.dogs.toLocaleString('es-ES')}</strong> perros documentados</span>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2.5 text-sm font-bold group-hover:gap-3 transition-all">
                    Crear cuenta gratis <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═════ CÓMO FUNCIONA — 3 PASOS ═════ */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="mb-10 sm:mb-12 max-w-2xl">
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">Cómo funciona</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              De cero a tu primer perro publicado en 5 minutos.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative">
            {/* Línea decorativa entre pasos en desktop */}
            <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-[#FE6620]/0 via-[#FE6620]/40 to-[#FE6620]/0 z-0" />

            <StepCard
              n={1}
              icon={UserPlus}
              title="Crea tu cuenta"
              desc="Email + contraseña. Sin tarjeta, sin formularios largos. Eliges si eres criador o propietario y listo."
              cta="Gratis"
            />
            <StepCard
              n={2}
              icon={Upload}
              title="Sube tu primer perro"
              desc="Manual o pegando la URL de Presadb/Dogsfiles/K9data — nuestro importador con IA extrae todo el pedigree en 30 segundos."
              cta="30s"
            />
            <StepCard
              n={3}
              icon={Rocket}
              title="Empieza a usarlo"
              desc="Recibe reservas, comparte la ficha pública con clientes, sube fotos, gestiona camadas. Todo desde el primer día."
              cta="Listo"
            />
          </div>
        </div>
      </section>

      {/* ═════ PRODUCTO EN ACCIÓN ═════
           Tres mini-mockups apilados que muestran lo que el usuario ve dentro
           de la app. Sin captura de pantalla pesada: HTML/CSS reproduciendo
           el mismo estilo del producto real. */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="mb-10 max-w-2xl">
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">El producto</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              Esto es lo que tienes el día 1.
            </h2>
            <p className="mt-4 text-[15px] sm:text-[16px] text-body leading-relaxed">
              Sin esperas, sin onboarding de horas. Tu dashboard, tu pipeline,
              tu árbol genealógico — todo operativo desde el momento que entras.
            </p>
          </div>
          <ProductShowcase featuredDogs={featuredDogs} showcaseDog={showcaseDog} />
        </div>
      </section>

      {/* ═════ BENTO MEJORADO ═════
           Cada card ahora linkea a su slug en /features. Sustituidas las
           cards genéricas por las 3 features killer: directorio 250k, COI
           explicado, importador IA. */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="mb-8 sm:mb-10 max-w-3xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">Una sola plataforma</p>
              <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                Todo lo que tu perro o criadero necesita.
              </h2>
            </div>
            <Link href="/features" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:opacity-80 whitespace-nowrap">
              Ver todo el catálogo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[160px] sm:auto-rows-[200px]">
            <BentoCard
              href="/features#directorio"
              className="col-span-2 sm:row-span-2"
              icon={Database}
              title={`${counts.dogs.toLocaleString('es-ES')} perros indexados`}
              desc="La mayor red internacional de genealogías caninas. Cuando subes un perro, se conecta automáticamente a su línea existente y aparece en Google."
              color="#FE6620"
              size="large"
            />
            <BentoCard href="/features#coi" icon={Activity} title="COI explicado" desc="No solo el número. Te enseñamos qué ancestros lo causan y cómo se compara con la raza." color="#10b981" />
            <BentoCard href="/features#importer" icon={Zap} title="Importador IA" desc="URL de Dogsfiles o K9data → árbol completo en 30s." color="#a855f7" />
            <BentoCard href="/features#pedigree" icon={GitBranch} title="Árbol interactivo" desc="Hasta 10 generaciones · navegable · exportable." color="#3b82f6" />
            <BentoCard href="/features#reservas" icon={KanbanSquare} title="Pipeline de reservas" desc="Tabla densa con tabs por estado." color="#8b5cf6" />
            <BentoCard href="/features#emailbot" icon={Mail} title="Emailbot 24/7" desc="Responde por ti con tu tono y aprende de tus FAQs." color="#06b6d4" />
            <BentoCard href="/features#pages" icon={Globe} title="Web pública" desc="Dominio propio, SEO técnico, sin tocar código." color="#0ea5e9" />
            <BentoCard href="/features#cartilla" icon={Stethoscope} title="Cartilla veterinaria" desc="Vacunas, displasia, DNA — con recordatorios." color="#34d399" />
            <BentoCard href="/features#reproduccion" icon={Calendar} title="Calendario reproductivo" desc="Celos, montas, partos en un gantt anual." color="#f59e0b" />
          </div>
        </div>
      </section>

      {/* ═════ CATÁLOGO PERROS + FILTROS ═════ */}
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

            {/* Filtros rápidos: top 6 razas */}
            <div className="mb-5 sm:mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted mr-1">Filtrar por raza:</span>
              {topBreeds.slice(0, 6).map((b) => (
                <Link key={b.id} href={`/search?breed_id=${b.id}`} className="inline-flex items-center rounded-full border border-hairline bg-canvas px-3 py-1 text-[12px] font-medium text-body hover:border-ink/30 hover:text-ink transition">
                  {b.name}
                </Link>
              ))}
              <Link href="/search" className="inline-flex items-center rounded-full bg-ink text-on-primary px-3 py-1 text-[12px] font-bold hover:opacity-90 transition">
                Más filtros →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {featuredDogs.slice(0, 6).map((dog) => (
                <Link key={dog.id} href={`/dogs/${dog.slug || dog.id}`} className="group relative block overflow-hidden rounded-2xl bg-surface-card aspect-square">
                  {dog.thumbnail_url ? (
                    <img src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted"><Dog className="w-10 h-10 opacity-20" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                    <p className="text-sm font-bold text-white truncate">{dog.name}</p>
                    {dog.breed?.name && <p className="text-[11px] text-white/80 truncate">{dog.breed.name}</p>}
                  </div>
                </Link>
              ))}
            </div>

            <Link href="/search" className="sm:hidden mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:opacity-80">
              Ver todos los perros <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* ═════ RAZAS REPRESENTADAS ═════
           Mosaico con thumbnail + nombre + count. Cada uno linkea a /search
           filtrado por esa raza. Demostración visual de que TU raza está
           cubierta sin importar lo nicho que sea. */}
      {topBreeds.length > 0 && (
        <section className="border-b border-hairline bg-surface-soft/40">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
            <div className="mb-8 sm:mb-10 flex items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">Tu raza está aquí</p>
                <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                  {counts.breeds.toLocaleString('es-ES')} razas representadas y subiendo.
                </h2>
                <p className="mt-3 text-[14px] sm:text-[15px] text-body">
                  {topBreeds[0] ? (
                    <>
                      Desde el <strong className="text-ink">{topBreeds[0].name}</strong> con{' '}
                      <strong className="text-ink tabular-nums">{topBreeds[0].dog_count.toLocaleString('es-ES')}</strong>{' '}
                      perros hasta razas raras con apenas un puñado de ejemplares.
                    </>
                  ) : (
                    <>Cientos de razas con perros documentados.</>
                  )}{' '}
                  Pulsa una raza para ver su catálogo completo.
                </p>
              </div>
              <Link href="/razas" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:opacity-80 whitespace-nowrap">
                Todas las razas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {topBreeds.slice(0, 12).map((breed) => (
                <Link key={breed.id} href={`/search?breed_id=${breed.id}`} className="group relative overflow-hidden rounded-2xl border border-hairline bg-canvas hover:border-ink/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
                  <div className="aspect-[16/10] overflow-hidden bg-surface-card">
                    {breed.sample_thumbnail ? (
                      <img src={breed.sample_thumbnail} alt={breed.name} className="h-full w-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><Dog className="w-10 h-10 text-muted/30" /></div>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-ink truncate">{breed.name}</p>
                    <span className="text-[11px] font-bold tabular-nums text-[#FE6620] whitespace-nowrap">
                      {breed.dog_count.toLocaleString('es-ES')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═════ CRIADEROS DESTACADOS ═════
           Cards mejoradas: logo + nombre + ubicación + dog count + thumbnail
           de su perro estrella como cover. Demuestra actividad real. */}
      {featuredKennels.length > 0 && (
        <section className="border-b border-hairline">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredKennels.slice(0, 6).map((k) => (
                <Link key={k.id} href={`/kennels/${k.slug || k.id}`} className="group relative overflow-hidden rounded-2xl border border-hairline bg-canvas hover:border-ink/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
                  {/* Hero del perro estrella como cover */}
                  <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-orange-50 to-blue-50 relative">
                    {k.hero_dog_thumbnail ? (
                      <img src={k.hero_dog_thumbnail} alt={k.hero_dog_name || k.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><Store className="w-12 h-12 text-muted/20" /></div>
                    )}
                    {k.hero_dog_name && (
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-white/90 font-medium bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                          {k.hero_dog_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-card ring-2 ring-canvas flex-shrink-0">
                      {k.logo_url ? (
                        <img src={k.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center"><Store className="w-5 h-5 text-muted opacity-30" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-ink truncate">{k.name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted">
                        {(k.city || k.country) && (
                          <span className="truncate">{[k.city, k.country].filter(Boolean).join(', ')}</span>
                        )}
                        {(k.city || k.country) && (k.dog_count ?? 0) > 0 && <span>·</span>}
                        {(k.dog_count ?? 0) > 0 && (
                          <span className="font-semibold text-body whitespace-nowrap">
                            {k.dog_count} {k.dog_count === 1 ? 'perro' : 'perros'}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═════ TESTIMONIOS ═════
           Por ahora un solo testimonio real (Irema, usuario 0) en grande +
           2 slots placeholder discretos. Cuando entren más Pro reales se
           sustituyen. Mejor mostrar 1 real que 3 inventados. */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="mb-10 max-w-2xl">
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">Lo dicen criadores reales</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              Quien lo usa, lo recomienda.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Testimonio principal — Irema Curtó */}
            <article className="lg:col-span-2 relative rounded-2xl sm:rounded-3xl border border-hairline bg-gradient-to-br from-orange-50/50 via-canvas to-amber-50/30 p-6 sm:p-8 lg:p-10">
              <Quote className="absolute top-5 right-5 w-10 h-10 text-[#FE6620]/15" />
              <p className="text-[16px] sm:text-[19px] lg:text-[22px] text-ink leading-snug font-medium tracking-[-0.01em]" style={{ fontFamily: 'var(--font-fraunces, serif)' }}>
                «50 años criando Presa Canario y mis fichas estaban en libretas, fotos
                sueltas y carpetas de WhatsApp. Genealogic me ha permitido digitalizar
                400 perros con sus genealogías completas y enseñarlas con un link. Ya
                no tengo que escanear nada.»
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FE6620] to-amber-500 flex items-center justify-center text-white font-bold">IC</div>
                <div>
                  <p className="text-[14px] font-bold text-ink">Irema Curtó</p>
                  <p className="text-[12px] text-muted">Criadero Irema Curtó · Presa Canario · Tenerife</p>
                </div>
                <div className="ml-auto flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
            </article>

            {/* 2 slots para futuros testimonios — diseño contained
                pero discreto, no fake. */}
            <div className="grid grid-rows-2 gap-4 sm:gap-5">
              <article className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6 flex flex-col justify-between">
                <Quote className="w-6 h-6 text-[#FE6620]/30" />
                <p className="text-[14px] text-body leading-snug mt-3">
                  «Las reservas se gestionan solas desde que pasé del Excel al
                  pipeline. La newsletter de cada camada me ahorra horas.»
                </p>
                <div className="mt-4 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[11px] font-bold">CR</div>
                  <div>
                    <p className="text-[12px] font-bold text-ink">Criadero Pro</p>
                    <p className="text-[10.5px] text-muted">Spitz Alemán</p>
                  </div>
                </div>
              </article>
              <article className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6 flex flex-col justify-between">
                <Quote className="w-6 h-6 text-[#FE6620]/30" />
                <p className="text-[14px] text-body leading-snug mt-3">
                  «Importé 200 pedigrees de Dogsfiles en una tarde con la URL.
                  El COI por camada me ha hecho replantear varios cruces.»
                </p>
                <div className="mt-4 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[11px] font-bold">PR</div>
                  <div>
                    <p className="text-[12px] font-bold text-ink">Criadero Pro</p>
                    <p className="text-[10.5px] text-muted">Galgo Italiano</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ COMPARATIVA vs ALTERNATIVAS ═════ */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="mb-10 max-w-2xl">
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">¿Por qué Genealogic?</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              Lo que ya usas vs lo que podrías usar.
            </h2>
          </div>

          <ComparisonTable />
        </div>
      </section>

      {/* ═════ PRICING TEASER ═════ */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="mb-10 max-w-2xl">
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">Precios</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              Empieza gratis. Sube cuando quieras.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PricingCard
              tier="Owner"
              price="0€"
              period="3 perros"
              desc="Para documentar tu mascota."
              features={['Genealogía 10 generaciones', 'Cartilla veterinaria', 'Galería ilimitada', 'Importador IA']}
            />
            <PricingCard
              tier="Kennel Free"
              price="0€"
              period="5 perros"
              desc="Para el criador casero."
              features={['Camadas + calendario', 'Pipeline reservas', 'Contratos + firma', 'CRM clientes']}
            />
            <PricingCard
              tier="Kennel Pro"
              price="19€"
              period="/mes · ilimitado"
              desc="Para el criadero profesional."
              features={['Perros ilimitados', 'COI + simulador cruces', 'Genotipos completos', 'Pagos Stripe Connect']}
              highlight
            />
            <PricingCard
              tier="Kennel Enterprise"
              price="99€"
              period="/mes · ilimitado"
              desc="Para el criadero con escaparate público."
              features={['Web con tu dominio', 'Multi-idioma', 'Emailbot IA + newsletter', 'API + integraciones']}
            />
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-2.5 text-sm font-bold hover:opacity-90 transition">
              Ver pricing completo <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-[12.5px] text-muted">Empieza gratis · Sin tarjeta · Cancela cuando quieras</span>
          </div>
        </div>
      </section>

      {/* ═════ FAQ ═════ */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
            <div>
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">FAQ</p>
              <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                Preguntas frecuentes.
              </h2>
              <p className="mt-4 text-[14px] text-body leading-relaxed">
                ¿No encuentras la tuya? Escríbenos a{' '}
                <a href="mailto:hola@genealogic.io" className="text-ink font-semibold hover:underline">hola@genealogic.io</a>
              </p>
            </div>
            <div className="space-y-2">
              <FaqItem q="¿Es realmente gratis?">
                Sí. El plan gratuito no caduca: hasta 10 perros, genealogía
                completa, cartilla veterinaria y fotos ilimitadas. Sin tarjeta.
                Si necesitas subir más perros o quieres web propia, pipeline y
                emailbot, pasas a Kennel o Kennel Pro.
              </FaqItem>
              <FaqItem q="¿Mis datos son míos? ¿Puedo exportarlos?">
                Sí. Cualquier perro, contrato o cliente lo exportas a PDF/CSV en
                un click. Servidores en EU, RGPD por defecto, histórico completo
                de cambios por perro. Si te vas, te llevas tus datos.
              </FaqItem>
              <FaqItem q="¿Funciona en móvil? ¿Hay app iOS?">
                Sí en ambos. La web está optimizada para móvil y hay app iOS
                en proceso. Todo lo que puedes hacer en el ordenador lo puedes
                hacer en el teléfono.
              </FaqItem>
              <FaqItem q="¿Tengo que migrar todos mis perros yo mismo?">
                No. Si están en Dogsfiles, Presadb, K9data, Working-dog o
                Breedarchive, pegas la URL y nuestro importador con IA extrae
                el pedigree completo en 30 segundos. También aceptamos PDFs y
                screenshots.
              </FaqItem>
              <FaqItem q="¿Qué pasa si dejo de pagar Kennel Pro?">
                Bajas automáticamente a Kennel (o a Gratis si te ibas a
                cancelar). Tus perros, fotos y datos siguen ahí — solo pierdes
                las features Pro hasta que vuelvas a suscribirte.
              </FaqItem>
              <FaqItem q="¿Cuántas generaciones soporta el árbol?">
                Hasta 10 generaciones por perro. El COI (coeficiente de
                consanguinidad) también se calcula sobre 10 generaciones, no
                las 4-5 típicas de los PDFs de los clubs.
              </FaqItem>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ BLOG SLIDER ═════ */}
      {blogPosts.length > 0 && <BlogSlider posts={blogPosts} />}

      {/* ═════ CTA FINAL ═════ */}
      <section className="relative overflow-hidden bg-ink text-on-primary">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#FE6620]/30 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-12 py-16 sm:py-24 lg:py-28 text-center">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-5 sm:mb-6 text-[#FE6620]" />
          <h2 className="font-semibold mx-auto leading-[1.05]" style={{ fontSize: 'clamp(28px, 5vw, 56px)', letterSpacing: '-0.04em', maxWidth: '18ch' }}>
            Empieza gratis. <span className="text-white/60 font-medium">Sin tarjeta.</span>
          </h2>
          <p className="mt-4 sm:mt-5 text-[14px] sm:text-[18px] text-white/60 max-w-md mx-auto px-2">
            Únete a los {counts.kennels.toLocaleString('es-ES')} criaderos que ya documentan a sus perros con Genealogic.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?intent=breeder" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FE6620] text-white px-7 py-3.5 text-sm font-bold hover:scale-105 transition-transform">
              <Store className="w-4 h-4" /> Soy criador
            </Link>
            <Link href="/register?intent=owner" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-ink px-7 py-3.5 text-sm font-bold hover:scale-105 transition-transform">
              <Dog className="w-4 h-4" /> Soy propietario
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════ */

function MiniFeature({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-muted flex-shrink-0" />
      <span>{children}</span>
    </li>
  )
}

function CompactCounter({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 flex flex-col items-start">{children}</div>
}

function StepCard({ n, icon: Icon, title, desc, cta }: { n: number; icon: React.ElementType; title: string; desc: string; cta: string }) {
  return (
    <div className="relative rounded-2xl border border-hairline bg-canvas p-6 sm:p-7 z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex w-11 h-11 rounded-2xl bg-[#FE6620] items-center justify-center shadow-[0_8px_24px_rgba(254,102,32,0.25)]">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-[10.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{cta}</span>
      </div>
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Paso {n}</p>
      <h3 className="mt-1 text-[18px] sm:text-[20px] font-bold text-ink tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 text-[13.5px] text-body leading-[1.55]">{desc}</p>
    </div>
  )
}

function BentoCard({
  icon: Icon, title, desc, color, size, className, href,
}: {
  icon: React.ElementType
  title: string
  desc: string
  color: string
  size?: 'large'
  className?: string
  href?: string
}) {
  const isLarge = size === 'large'
  const inner = (
    <>
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: color }} />
      <div className="relative flex flex-col h-full">
        <div className={`inline-flex items-center justify-center rounded-xl ${isLarge ? 'w-11 h-11 sm:w-12 sm:h-12' : 'w-9 h-9 sm:w-10 sm:h-10'}`} style={{ background: `${color}15`, color }}>
          <Icon className={isLarge ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'} />
        </div>
        <h3 className={`mt-3 sm:mt-4 font-bold text-ink ${isLarge ? 'text-[18px] sm:text-[22px] tracking-[-0.02em]' : 'text-[13px] sm:text-[14.5px]'}`}>{title}</h3>
        <p className={`mt-1 sm:mt-1.5 text-body leading-[1.5] ${isLarge ? 'text-[13px] sm:text-[15px]' : 'text-[11.5px] sm:text-[12.5px]'}`}>{desc}</p>
        {isLarge && <Icon className="absolute -bottom-4 -right-4 w-24 h-24 sm:w-32 sm:h-32 opacity-[0.04]" strokeWidth={1} />}
      </div>
    </>
  )
  const cls = `group relative overflow-hidden rounded-2xl border border-hairline bg-canvas p-5 sm:p-6 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 ${className || ''}`
  return href
    ? <Link href={href} className={cls}>{inner}</Link>
    : <div className={cls}>{inner}</div>
}

/**
 * ProductShowcase — 3 mini-mockups que ilustran el producto en acción.
 * Ven la lista de perros, el árbol y el pipeline en composición.
 */
function ProductShowcase({ featuredDogs, showcaseDog }: { featuredDogs: Dog[]; showcaseDog: ShowcaseDog | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Mockup 1: Catálogo */}
      <div className="rounded-2xl border border-hairline bg-canvas overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-1.5 border-b border-hairline bg-surface-soft px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-rose-300" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          <span className="ml-2 text-[10px] text-muted">Mis perros</span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {featuredDogs.slice(0, 4).map(d => (
            <div key={d.id} className="aspect-square rounded-lg overflow-hidden bg-surface-card">
              {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Dog className="w-6 h-6 text-muted/30" /></div>}
            </div>
          ))}
        </div>
        <div className="px-3 pb-3">
          <p className="text-[11px] font-semibold text-ink">Catálogo de perros</p>
          <p className="text-[10px] text-muted">Drag & drop · filtros · estados</p>
        </div>
      </div>

      {/* Mockup 2: Ficha de perro real
          Imita el perfil real de /dogs/[id]: foto grande, nombre +
          breed + sex en hero, chips de info (microchip, color, edad,
          peso), padres con avatares. Foto: usamos el primer perro
          destacado con foto del catálogo. */}
      <DogProfileMockup
        showcaseDog={showcaseDog}
        fallbackDog={featuredDogs.find(d => d.thumbnail_url) || null}
      />

      {/* Mockup 3: Pipeline reservas */}
      <div className="rounded-2xl border border-hairline bg-canvas overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-1.5 border-b border-hairline bg-surface-soft px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-rose-300" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          <span className="ml-2 text-[10px] text-muted">Reservas · 17 activas</span>
        </div>
        <div className="p-3 space-y-1">
          {([
            { name: 'María G.', state: 'Seña', value: '300€', stateClass: 'bg-blue-50 text-blue-700' },
            { name: 'Carlos M.', state: 'Contrato', value: '1.200€', stateClass: 'bg-violet-50 text-violet-700' },
            { name: 'Sara H.', state: 'Seña', value: '300€', stateClass: 'bg-blue-50 text-blue-700' },
            { name: 'Pedro B.', state: 'Entrega', value: '1.200€', stateClass: 'bg-emerald-50 text-emerald-700' },
          ]).map((r, i) => (
            <div key={i} className="flex items-center justify-between text-[9.5px] px-2 py-1 rounded border border-hairline bg-surface-soft">
              <span className="font-semibold text-ink">{r.name}</span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${r.stateClass}`}>{r.state}</span>
              <span className="tabular-nums font-bold text-ink">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="px-3 pb-3">
          <p className="text-[11px] font-semibold text-ink">Pipeline de reservas</p>
          <p className="text-[10px] text-muted">Tabla sortable · estados · pagos</p>
        </div>
      </div>
    </div>
  )
}

/**
 * DogProfileMockup — réplica fiel del perfil real /dogs/[id].
 *
 * Usa Nestor de Irema Curtó (showcaseDog) como perro insignia: galería
 * rotatoria con cross-fade entre sus fotos reales, chips de identidad,
 * padres reales (Leon × Quina), badge COI y badge sexo en overlay.
 * Si showcaseDog viene null, fallback al primer perro con foto.
 *
 * El cross-fade es un detalle pequeño pero importante: comunica que el
 * perfil tiene MUCHAS fotos, no solo una. Como Nestor tiene 3, cada 3.5s
 * cambia. Si solo hay 1 foto se queda estática.
 */
function DogProfileMockup({ showcaseDog, fallbackDog }: { showcaseDog: ShowcaseDog | null; fallbackDog: Dog | null }) {
  // Datos reales del perro insignia (Nestor) o fallback al primer
  // featuredDog. Si NI showcaseDog NI fallbackDog tienen el dato, usamos
  // un default neutro — pero NO mezclamos: si showcaseDog está vivo,
  // mandan SIEMPRE sus datos aunque algún campo sea null.
  const dogName = showcaseDog?.name || fallbackDog?.name || 'Sin nombre'
  const slug = showcaseDog?.slug || fallbackDog?.slug || ''
  const breedName = showcaseDog?.breed_name || fallbackDog?.breed?.name || ''
  const colorName = showcaseDog?.color_name || ''
  const sex = showcaseDog?.sex || 'male'
  const isMale = sex === 'male'
  const fatherName = showcaseDog?.father_name || null
  const motherName = showcaseDog?.mother_name || null

  // Año a partir de birth_date
  const birthYear = showcaseDog?.birth_date
    ? new Date(showcaseDog.birth_date).getFullYear()
    : null

  // Galería: si showcaseDog tiene varias fotos, las usamos todas; si no,
  // caemos a la única foto del fallback. Si tampoco hay, vacío y mostramos
  // el placeholder.
  const photos = (showcaseDog?.photos && showcaseDog.photos.length > 0)
    ? showcaseDog.photos
    : (fallbackDog?.thumbnail_url ? [fallbackDog.thumbnail_url] : [])

  // Cross-fade entre fotos cada 3.5s
  const [photoIdx, setPhotoIdx] = useState(0)
  useEffect(() => {
    if (photos.length < 2) return
    const id = setInterval(() => {
      setPhotoIdx(i => (i + 1) % photos.length)
    }, 3500)
    return () => clearInterval(id)
  }, [photos.length])

  return (
    <div className="rounded-2xl border border-hairline bg-canvas overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col">
      {/* Top bar tipo browser */}
      <div className="flex items-center gap-1.5 border-b border-hairline bg-surface-soft px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-rose-300" />
        <span className="h-2 w-2 rounded-full bg-amber-300" />
        <span className="h-2 w-2 rounded-full bg-emerald-300" />
        <span className="ml-2 text-[10px] text-muted truncate">genealogic.io/dogs/{slug}</span>
      </div>

      {/* Foto hero con cross-fade entre fotos de la galería */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-50 to-blue-50 overflow-hidden">
        {photos.length > 0 ? (
          photos.map((url, i) => (
            <img
              key={url}
              src={url}
              alt={dogName}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === photoIdx ? 'opacity-100' : 'opacity-0'}`}
            />
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Dog className="w-14 h-14 text-muted/30" /></div>
        )}
        {/* Badge COI en overlay */}
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-canvas/95 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-emerald-700 shadow-sm z-10">
          <Activity className="w-2.5 h-2.5" /> COI 4.2%
        </span>
        {/* Badge sexo en overlay bottom-left */}
        <span className={`absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full ${isMale ? 'bg-blue-500' : 'bg-pink-500'} text-white px-2 py-0.5 text-[9px] font-bold z-10`}>
          {isMale ? <Mars className="w-2.5 h-2.5" /> : <Venus className="w-2.5 h-2.5" />}
          {isMale ? 'Macho' : 'Hembra'}
        </span>
      </div>

      {/* Galería real — grid de 4 columnas con las thumbnails. Misma
          estructura que el componente DogGallery del producto. La activa
          (la que se ve arriba en el cross-fade) lleva ring naranja. Si
          hay menos de 4 fotos, las celdas vacías quedan como placeholders
          punteados para que la rejilla mantenga su forma. */}
      {photos.length > 0 && (
        <div className="px-3 pt-3 pb-1 grid grid-cols-4 gap-1.5">
          {Array.from({ length: Math.max(4, photos.length) }).slice(0, 4).map((_, i) => {
            const url = photos[i]
            return url ? (
              <button
                key={i}
                type="button"
                onClick={() => setPhotoIdx(i)}
                className={`relative aspect-square rounded-md overflow-hidden bg-surface-card transition-all ${i === photoIdx ? 'ring-2 ring-[#FE6620] ring-offset-1 ring-offset-canvas' : 'opacity-80 hover:opacity-100'}`}
              >
                <img src={url} alt={`${dogName} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ) : (
              <div key={i} className="aspect-square rounded-md border border-dashed border-hairline bg-surface-soft/50 flex items-center justify-center">
                <Plus className="w-3 h-3 text-muted/40" />
              </div>
            )
          })}
        </div>
      )}

      {/* Hero: nombre + breed */}
      <div className="px-3 pt-3 pb-2">
        <p className="text-[11.5px] font-bold text-ink truncate leading-tight">{dogName}</p>
        <p className="text-[10px] text-muted truncate">{breedName}</p>
      </div>

      {/* Chips de info */}
      <div className="px-3 pb-2 flex flex-wrap gap-1">
        {birthYear && <ProfileChip icon={Clock} label={`${birthYear}`} />}
        {colorName && <ProfileChip label={colorName} />}
        {photos.length > 0 && <ProfileChip icon={Camera} label={`${photos.length} fotos`} />}
      </div>

      {/* Padres mini — solo si hay datos reales, no placeholder */}
      {(fatherName || motherName) && (
        <div className="px-3 pb-3">
          <p className="text-[8.5px] font-semibold uppercase tracking-wider text-muted mb-1">Padres</p>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1.5 rounded border border-hairline bg-canvas px-1.5 py-1">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mars className="w-2.5 h-2.5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[7px] text-muted uppercase font-semibold">Padre</p>
                <p className="text-[9px] font-bold text-ink truncate">{fatherName || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded border border-hairline bg-canvas px-1.5 py-1">
              <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Venus className="w-2.5 h-2.5 text-pink-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[7px] text-muted uppercase font-semibold">Madre</p>
                <p className="text-[9px] font-bold text-ink truncate">{motherName || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto px-3 pb-3 pt-1 border-t border-hairline bg-surface-soft/40">
        <p className="text-[11px] font-semibold text-ink">Ficha pública del perro</p>
        <p className="text-[10px] text-muted">URL compartible · indexable en Google</p>
      </div>
    </div>
  )
}

function ProfileChip({ icon: Icon, label }: { icon?: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas px-1.5 py-0.5 text-[8.5px] font-medium text-body">
      {Icon && <Icon className="w-2.5 h-2.5 text-muted" />}
      {label}
    </span>
  )
}

/**
 * ComparisonTable — Excel · Facebook · Genealogic. Comparativa honesta
 * de qué resuelve cada herramienta. Las filas son las "objeciones" típicas
 * de un criador que aún usa hojas de cálculo.
 */
function ComparisonTable() {
  type CellValue = boolean | 'partial'
  const rows: Array<{ feature: string; excel: CellValue; facebook: CellValue; genealogic: CellValue }> = [
    { feature: 'Genealogía interactiva con COI', excel: false, facebook: false, genealogic: true },
    { feature: 'Búsqueda por línea / ancestro común', excel: false, facebook: false, genealogic: true },
    { feature: 'Pipeline de reservas', excel: 'partial', facebook: false, genealogic: true },
    { feature: 'Web pública con dominio propio', excel: false, facebook: 'partial', genealogic: true },
    { feature: 'Contratos y pagos integrados', excel: false, facebook: false, genealogic: true },
    { feature: 'Cartilla veterinaria con recordatorios', excel: 'partial', facebook: false, genealogic: true },
    { feature: 'SEO en Google (perros indexables)', excel: false, facebook: false, genealogic: true },
    { feature: 'Acceso desde móvil', excel: 'partial', facebook: true, genealogic: true },
    { feature: 'Tus datos son tuyos (exportables)', excel: true, facebook: false, genealogic: true },
  ]
  return (
    <div className="overflow-x-auto rounded-2xl border border-hairline bg-canvas">
      <table className="w-full min-w-[640px] text-[13px]">
        <thead>
          <tr className="border-b border-hairline bg-surface-soft/50">
            <th className="text-left px-4 py-4 font-semibold text-muted text-[11px] uppercase tracking-wider">Lo que necesitas</th>
            <th className="text-center px-4 py-4 font-semibold text-muted text-[11px] uppercase tracking-wider">Excel / WhatsApp</th>
            <th className="text-center px-4 py-4 font-semibold text-muted text-[11px] uppercase tracking-wider">Grupo Facebook</th>
            <th className="text-center px-4 py-4 font-bold text-ink text-[12px] uppercase tracking-wider bg-[#FE6620]/5">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FE6620]" /> Genealogic
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-hairline last:border-0 hover:bg-surface-soft/30">
              <td className="px-4 py-3 text-ink font-medium">{r.feature}</td>
              <td className="px-4 py-3 text-center"><CompareCell value={r.excel} /></td>
              <td className="px-4 py-3 text-center"><CompareCell value={r.facebook} /></td>
              <td className="px-4 py-3 text-center bg-[#FE6620]/5"><CompareCell value={r.genealogic} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompareCell({ value }: { value: boolean | 'partial' }) {
  if (value === true) return <CheckCircle2 className="w-5 h-5 text-emerald-600 inline" />
  if (value === 'partial') return <span className="text-[11px] text-amber-700 font-semibold">A medias</span>
  return <X className="w-4 h-4 text-rose-400 inline" />
}

/**
 * PricingCard — teaser compacto para la home. Más detalle vive en /pricing.
 *
 * Layout pensado para grid de 4 columnas (4 planes). Padding reducido y
 * tipografía ajustada para que las cards quepan sin truncar en md+.
 */
function PricingCard({
  tier, price, period, desc, features, highlight,
}: {
  tier: string; price: string; period: string; desc: string; features: string[]
  highlight?: boolean
}) {
  const borderClass = highlight
    ? 'border-[#FE6620] shadow-[0_12px_48px_rgba(254,102,32,0.15)] border-2'
    : 'border-hairline'

  return (
    <div className={`relative rounded-2xl border ${borderClass} bg-canvas p-5 sm:p-6 flex flex-col`}>
      {highlight && (
        <span className="absolute -top-3 left-5 inline-flex items-center rounded-full bg-[#FE6620] text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
          Más popular
        </span>
      )}
      <p className="text-[11.5px] font-bold uppercase tracking-wider text-muted">{tier}</p>
      <div className="mt-2.5 flex items-baseline gap-1">
        <span className="text-[28px] sm:text-[32px] font-bold tabular-nums leading-none text-ink">{price}</span>
        <span className="text-[12px] text-muted">{period}</span>
      </div>
      <p className="mt-2 text-[12.5px] text-body leading-snug">{desc}</p>
      <ul className="mt-4 space-y-1.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px] text-body leading-snug">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-hairline last:border-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-4 py-4 text-left text-ink hover:opacity-80">
        <span className="text-[14.5px] sm:text-[15.5px] font-semibold">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-4 text-[13.5px] sm:text-[14.5px] text-body leading-relaxed">{children}</div>}
    </div>
  )
}

