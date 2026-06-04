/**
 * DiscoveryHome — home master de Genealogic.
 *
 * Pensada OWNER-FIRST: todo lo que un propietario quiere y Genealogic ofrece.
 * Lo de criador (COI, web/SEO) vive en la card de "dos caminos" como puerta a
 * /criadores, no en las secciones owner-facing.
 *
 * Estructura:
 *   1) Hero cinematográfico con mosaico + search + counters
 *   2) Dos caminos — propietario (primario) vs criador (puerta a /criadores)
 *   3) Cómo funciona en 3 pasos
 *   4) Producto en acción — composición de 3 mockups vivos
 *   5) Árbol genealógico del perro (mockup destacado, generaciones ilimitadas)
 *   6) Pilares del propietario (ficha+galería, salud, papeles, reservas…)
 *   7) Catálogo de perros con filtros rápidos por raza
 *   8) Razas representadas (mosaico con counts reales)
 *   9) Criaderos destacados con perro estrella
 *  10) Testimonios reales
 *  11) Pricing teaser (gratis para propietario)
 *  12) FAQ corta (orientada a propietario)
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
  Stethoscope, Heart, Zap, Database, Upload,
  UserPlus, Rocket, CheckCircle2, ChevronDown,
  Quote, Star, Baby, Mars, Venus, Clock, Plus, Syringe, Bug, Trophy,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useT } from '@/components/i18n/locale-provider'
import LiveCounter from './live-counter'
import BlogSlider from './blog-slider'
import HeroMosaic from './hero-mosaic'
import PedigreeTreeMockup from '@/components/marketing/pedigree-tree-mockup'

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
  image_url: string | null
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

/** Perro con datos para clonar la card real del backend (mockup "Mis perros"). */
type MiniDog = {
  id: string
  name: string
  slug: string | null
  sex: string | null
  thumbnail_url: string | null
  birth_date: string | null
  breed?: { name?: string } | null
  color?: { name?: string } | null
}

export default function DiscoveryHome({
  counts, featuredDogs, featuredKennels, topBreeds, showcaseDog, blogPosts, mosaicPhotos, galgoDogs,
}: {
  counts: { dogs: number; kennels: number; breeds: number }
  featuredDogs: Dog[]
  featuredKennels: KennelWithHero[]
  topBreeds: BreedWithCount[]
  showcaseDog: ShowcaseDog | null
  blogPosts: BlogCard[]
  mosaicPhotos: string[]
  galgoDogs: MiniDog[]
}) {
  const t = useT()
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
                <span className="line-clamp-1">{t('El registro público de genealogías caninas')}</span>
              </div>
              <h1
                className="mt-5 sm:mt-7 font-semibold text-ink"
                style={{ fontSize: 'clamp(34px, 5.4vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.045em' }}
              >
                {t('La base de datos de perros más grande del mundo.')}{' '}
                <span style={{ color: '#FE6620' }} className="font-medium">{t('La construyes tú.')}</span>
              </h1>
              <p className="mt-5 sm:mt-7 max-w-[580px] text-body" style={{ fontSize: 'clamp(15px, 1.4vw, 19px)', lineHeight: 1.5 }}>
                {t('Mantén el perfil de tu perro al día —genealogía, vacunas, salud, premios— y a cambio tienes gratis las mejores herramientas para gestionarlo. Cada perro cuenta: así preservamos las razas.')}
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link href="/register?intent=owner" className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-3 text-[14px] font-bold hover:opacity-90 transition">
                  <Dog className="w-4 h-4" /> {t('Crear mi cuenta gratis')} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/criadores" className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas/80 backdrop-blur-md text-ink px-5 py-3 text-[14px] font-bold hover:border-ink/30 transition">
                  <Store className="w-4 h-4" /> {t('¿Eres criador? →')}
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-orange-50 via-canvas to-blue-50 p-5 sm:p-7 lg:p-8 shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
                  <div className="inline-flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#FE6620]" />
                    <p className="text-[11px] sm:text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink">{t('Explora el catálogo')}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {t('En vivo')}
                  </span>
                </div>
                <form action="/search" method="get" className="flex items-center gap-2 rounded-2xl border-2 border-ink/10 bg-canvas px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-[0_4px_16px_rgba(0,0,0,0.04)] focus-within:border-ink/40 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted flex-shrink-0" />
                  <input name="q" type="text" placeholder={t('Busca un perro, criador o raza…')} className="flex-1 bg-transparent text-[14px] sm:text-[15px] text-ink placeholder:text-muted focus:outline-none min-w-0" />
                  <button type="submit" aria-label={t('Buscar')} className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-3 sm:px-4 py-2 text-[13px] font-bold hover:opacity-90 transition shrink-0">
                    <span className="hidden sm:inline">{t('Buscar')}</span> <ArrowRight className="w-4 h-4" />
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
                <p className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted mb-3 sm:mb-4">{t('El catálogo crece en tiempo real')}</p>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <CompactCounter><LiveCounter size="compact" initial={counts.kennels} kind="kennels" label={t('Criaderos')} /></CompactCounter>
                  <CompactCounter><LiveCounter size="compact" initial={counts.breeds} kind="breeds" label={t('Razas')} /></CompactCounter>
                  <CompactCounter><LiveCounter size="compact" initial={counts.dogs} kind="dogs" label={t('Perros')} /></CompactCounter>
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
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">{t('El trato')}</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              {t('Genealogic es de tu perro. Y es gratis.')}
            </h2>
            <p className="mt-4 text-[15px] sm:text-[16px] text-body max-w-xl leading-relaxed">
              {t('Un trato sencillo: mantienes el perfil de tu perro al día y, a cambio, tienes gratis las mejores herramientas para gestionarlo. Cada perro que documentas hace la base de datos más grande y fiable — y ayuda a preservar su raza.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* TÚ APORTAS — la misión, en claro (sustituye la caja negra) */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-hairline bg-gradient-to-br from-orange-50 via-canvas to-amber-50 p-6 sm:p-8 lg:p-10">
              <Database className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-32 h-32 sm:w-48 sm:h-48 text-[#FE6620]/10" strokeWidth={1} />
              <div className="relative">
                <div className="inline-flex w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FE6620] items-center justify-center shadow-[0_8px_24px_rgba(254,102,32,0.3)]">
                  <Database className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <p className="mt-4 sm:mt-5 text-[11px] font-bold uppercase tracking-wider text-[#FE6620]">{t('Tú aportas')}</p>
                <h3 className="mt-1 font-semibold text-ink tracking-[-0.02em] leading-tight" style={{ fontSize: 'clamp(22px, 3.5vw, 30px)' }}>
                  {t('Mantén su perfil al día.')}
                </h3>
                <p className="mt-2.5 sm:mt-3 text-[14px] sm:text-[15px] text-body leading-[1.55] max-w-md">
                  {t('Su genealogía, sus fotos, sus datos. Cada perro que documentas hace la base de datos de perros más grande, completa y fiable del mundo — y ayuda a preservar su raza. Porque cada perro cuenta.')}
                </p>
                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
                  <div>
                    <p className="text-[22px] font-bold tabular-nums leading-none text-ink">{counts.dogs.toLocaleString('es-ES')}</p>
                    <p className="mt-1 text-[11px] text-muted">{t('perros')}</p>
                  </div>
                  <div>
                    <p className="text-[22px] font-bold tabular-nums leading-none text-ink">{counts.breeds.toLocaleString('es-ES')}</p>
                    <p className="mt-1 text-[11px] text-muted">{t('razas')}</p>
                  </div>
                  <div>
                    <p className="text-[22px] font-bold tabular-nums leading-none text-ink">{counts.kennels.toLocaleString('es-ES')}</p>
                    <p className="mt-1 text-[11px] text-muted">{t('criaderos')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TÚ RECIBES — las herramientas, gratis */}
            <Link href="/register?intent=owner" className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-hairline bg-gradient-to-br from-blue-50 via-canvas to-sky-50 p-6 sm:p-8 lg:p-10 hover:shadow-[0_12px_48px_rgba(59,130,246,0.15)] transition-all hover:-translate-y-1 duration-300">
              <Dog className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-32 h-32 sm:w-48 sm:h-48 text-blue-500/10 group-hover:text-blue-500/20 transition-colors" strokeWidth={1} />
              <div className="relative">
                <div className="inline-flex w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 items-center justify-center shadow-[0_8px_24px_rgba(59,130,246,0.3)]">
                  <Dog className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="mt-4 sm:mt-5 flex items-center gap-2 flex-wrap">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">{t('Tú recibes')}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">{t('Gratis · Sin límite')}</span>
                </div>
                <h3 className="mt-1 font-semibold text-ink tracking-[-0.02em] leading-tight" style={{ fontSize: 'clamp(22px, 3.5vw, 30px)' }}>
                  {t('Todo para gestionar a tu perro.')}
                </h3>
                <ul className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px] sm:text-[13px] text-body">
                  <MiniFeature icon={GitBranch}>{t('Genealogía sin límite')}</MiniFeature>
                  <MiniFeature icon={Calendar}>{t('Vacunas con recordatorios')}</MiniFeature>
                  <MiniFeature icon={ShieldCheck}>{t('Certificados de salud')}</MiniFeature>
                  <MiniFeature icon={Trophy}>{t('Premios y palmarés')}</MiniFeature>
                  <MiniFeature icon={KanbanSquare}>{t('Seguimiento de tu reserva')}</MiniFeature>
                  <MiniFeature icon={Globe}>{t('Comparte con un link')}</MiniFeature>
                </ul>
                <div className="mt-6">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2.5 text-sm font-bold group-hover:gap-3 transition-all">
                    {t('Crear mi cuenta gratis')} <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Enlace discreto a criadores */}
          <div className="mt-6 text-center sm:text-left">
            <Link href="/criadores" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink transition-colors">
              <Store className="w-3.5 h-3.5" /> {t('¿Tienes un criadero? Conoce Genealogic Breeders')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═════ CÓMO FUNCIONA — 3 PASOS ═════ */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="mb-10 sm:mb-12 max-w-2xl">
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">{t('Cómo funciona')}</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              {t('De cero a tu perro documentado en 5 minutos.')}
            </h2>
            <p className="mt-4 text-[15px] sm:text-[16px] text-body max-w-xl leading-relaxed">
              {t('Sencillo, rápido y sin límites: añade los perros que quieras, gratis. Cada uno suma a la base de datos.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative">
            {/* Línea decorativa entre pasos en desktop */}
            <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-[#FE6620]/0 via-[#FE6620]/40 to-[#FE6620]/0 z-0" />

            <StepCard
              n={1}
              icon={UserPlus}
              title={t('Crea tu cuenta')}
              desc={t('Email + contraseña. Sin tarjeta, sin formularios largos. Empieza gratis y listo.')}
              cta={t('Gratis')}
            />
            <StepCard
              n={2}
              icon={Upload}
              title={t('Añade a tu perro')}
              desc={t('Manual, reclamándolo del catálogo o pegando la URL de Dogsfiles/K9data — nuestro importador con IA extrae toda la genealogía en 30 segundos.')}
              cta={t('30s')}
            />
            <StepCard
              n={3}
              icon={Rocket}
              title={t('Empieza a usarlo')}
              desc={t('Sube fotos, sigue la cartilla veterinaria con recordatorios, gestiona las reservas con tu criador y comparte su ficha con un link. Todo desde el primer día.')}
              cta={t('Listo')}
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
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">{t('El producto')}</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              {t('Esto es lo que tienes el día 1.')}
            </h2>
            <p className="mt-4 text-[15px] sm:text-[16px] text-body leading-relaxed">
              {t('Sin esperas, sin onboarding de horas. La ficha de tu perro, su árbol genealógico y tus reservas — todo operativo desde el momento que entras.')}
            </p>
          </div>
          <ProductShowcase featuredDogs={featuredDogs} galgoDogs={galgoDogs} showcaseDog={showcaseDog} />
        </div>
      </section>

      {/* ═════ ÁRBOL GENEALÓGICO ═════
           Sección destacada owner-first: el árbol de generaciones ilimitadas,
           con ancestros con foto y enlace al criadero de origen. Reusa el
           mockup compartido con /criadores (PedigreeTreeMockup). Si hay fotos
           reales de perros recientes, las pasa; si no, relleno determinista. */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-14 items-center">
            <div>
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">{t('Su linaje')}</p>
              <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                {t('El árbol genealógico de tu perro, sin límite de generaciones.')}
              </h2>
              <p className="mt-4 text-[15px] sm:text-[16px] text-body leading-relaxed max-w-xl">
                {t('Cada ancestro con su foto y un enlace al criadero de origen. Constrúyelo a mano, pega la URL de Dogsfiles, K9data o el club, o saca una foto a su pedigrí de papel: nuestro importador con IA extrae toda la línea en 30 segundos.')}
              </p>
              <ul className="mt-6 space-y-2.5 text-[14px] sm:text-[15px] text-body">
                <li className="flex items-start gap-2.5">
                  <GitBranch className="w-4 h-4 mt-0.5 text-[#FE6620] flex-shrink-0" />
                  <span>{t('Generaciones ilimitadas, navegables y exportables.')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Camera className="w-4 h-4 mt-0.5 text-[#FE6620] flex-shrink-0" />
                  <span>{t('Ancestros con foto y enlace a su criadero de origen.')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Camera className="w-4 h-4 mt-0.5 text-[#FE6620] flex-shrink-0" />
                  <span>{t('¿Tienes su pedigrí de papel? Hazle una foto y la IA lo digitaliza entero.')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Zap className="w-4 h-4 mt-0.5 text-[#FE6620] flex-shrink-0" />
                  <span>{t('Importa la genealogía desde Dogsfiles, K9data y más con IA.')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Search className="w-4 h-4 mt-0.5 text-[#FE6620] flex-shrink-0" />
                  <span>{t('Su ficha y genealogía se suman a nuestro motor de búsqueda, junto a todas las demás.')}</span>
                </li>
              </ul>
              <Link href="/register?intent=owner" className="mt-7 inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-3 text-[14px] font-bold hover:opacity-90 transition">
                <Dog className="w-4 h-4" /> {t('Crear mi cuenta gratis')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div>
              <PedigreeTreeMockup photos={featuredDogs.slice(0, 7).map((d) => d.thumbnail_url).filter(Boolean) as string[]} />
            </div>
          </div>
        </div>
      </section>

      {/* ═════ PILARES DEL PROPIETARIO ═════
           Rejilla de todo lo que un propietario tiene en Genealogic: ficha +
           galería, salud con recordatorios, papeles offline, reservas con su
           criador, reclamar su perro, compartir/privado, calendario,
           In Memoriam y app móvil. Sin COI ni SEO — eso es de criador. */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="mb-8 sm:mb-10 max-w-3xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">{t('Todo en un sitio')}</p>
              <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                {t('Todo lo que tu perro necesita, en su ficha.')}
              </h2>
            </div>
            <Link href="/features" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:opacity-80 whitespace-nowrap">
              {t('Ver todas las funciones')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[minmax(170px,auto)] sm:auto-rows-[200px]">
            <BentoCard
              href="/features#ficha"
              className="col-span-2 sm:row-span-2"
              icon={Camera}
              title={t('Su ficha con galería')}
              desc={t('Fotos y vídeos, microchip, color, peso y alzada. Toda la identidad de tu perro en un perfil cuidado, tan completo como tú quieras.')}
              color="#FE6620"
              size="large"
            />
            <BentoCard href="/features#cartilla" icon={Stethoscope} title={t('Salud con recordatorios')} desc={t('Cartilla, vacunas, desparasitaciones y visitas — con avisos automáticos.')} color="#34d399" />
            <BentoCard href="/features#certificados" icon={CheckCircle2} title={t('Certificados de salud')} desc={t('Displasias, pruebas oculares y genéticas, resultados del vet — guardados y a mano.')} color="#14b8a6" />
            <BentoCard href="/features#premios" icon={Trophy} title={t('Premios y palmarés')} desc={t('Exposiciones, títulos y trofeos. El historial deportivo de tu perro, ordenado.')} color="#eab308" />
            <BentoCard href="/features#calendario" icon={Calendar} title={t('Calendario del perro')} desc={t('Sus citas y avisos, para que no se te pase ni una.')} color="#f59e0b" />
            <BentoCard href="/features#reservas" icon={KanbanSquare} title={t('Reservas con tu criador')} desc={t('Sigue el estado, firma el contrato, paga y recibe sus documentos.')} color="#8b5cf6" />
            <BentoCard href="/features#papeles" icon={ShieldCheck} title={t('Papeles siempre a mano')} desc={t('Cartilla, contrato y microchip digitalizados — incluso sin cobertura en el vet.')} color="#0ea5e9" />
            <BentoCard href="/features#reclamar" icon={Database} title={t('Reclama tu perro')} desc={t('¿Ya está importado de un club? Búscalo y reclámalo como tuyo.')} color="#06b6d4" />
            <BentoCard href="/features#compartir" icon={Globe} title={t('Su ficha es pública')} desc={t('Su ficha y su genealogía son públicas: enséñalas con un link y entran en el catálogo de Genealogic. Esa es la gracia.')} color="#3b82f6" />
            <BentoCard href="/features#privacidad" icon={Heart} title={t('Tú lo gestionas')} desc={t('Controlas y editas todos sus datos. Lo sensible (cartilla, papeles) se queda contigo. Perros ilimitados, gratis.')} color="#10b981" />
          </div>
        </div>
      </section>

      {/* ═════ CATÁLOGO PERROS + FILTROS ═════ */}
      {featuredDogs.length > 0 && (
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
            <div className="mb-6 sm:mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">{t('La base de datos crece')}</p>
                <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                  {t('Perros recién registrados')}
                </h2>
                <p className="mt-2 text-[14px] text-body max-w-lg leading-relaxed">
                  {t('Cada perfil que añade un propietario entra aquí. Esto es lo último que ha llegado.')}
                </p>
              </div>
              <Link href="/search" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:opacity-80">
                {t('Ver todos')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Filtros rápidos: top 6 razas */}
            <div className="mb-5 sm:mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted mr-1">{t('Filtrar por raza:')}</span>
              {topBreeds.slice(0, 6).map((b) => (
                <Link key={b.id} href={`/search?breed_id=${b.id}`} className="inline-flex items-center rounded-full border border-hairline bg-canvas px-3 py-1 text-[12px] font-medium text-body hover:border-ink/30 hover:text-ink transition">
                  {b.name}
                </Link>
              ))}
              <Link href="/search" className="inline-flex items-center rounded-full bg-ink text-on-primary px-3 py-1 text-[12px] font-bold hover:opacity-90 transition">
                {t('Más filtros')} →
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
              {t('Ver todos los perros')} <ArrowRight className="w-3.5 h-3.5" />
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
                <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">{t('Tu raza está aquí')}</p>
                <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                  {counts.breeds.toLocaleString('es-ES')} {t('razas representadas y subiendo.')}
                </h2>
                <p className="mt-3 text-[14px] sm:text-[15px] text-body">
                  {topBreeds[0] ? (
                    <>
                      {t('Desde el')} <strong className="text-ink">{topBreeds[0].name}</strong> {t('con')}{' '}
                      <strong className="text-ink tabular-nums">{topBreeds[0].dog_count.toLocaleString('es-ES')}</strong>{' '}
                      {t('perros hasta razas raras con apenas un puñado de ejemplares.')}
                    </>
                  ) : (
                    <>{t('Cientos de razas con perros documentados.')}</>
                  )}{' '}
                  {t('Pulsa una raza para ver su catálogo completo.')}
                </p>
              </div>
              <Link href="/razas" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:opacity-80 whitespace-nowrap">
                {t('Todas las razas')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {topBreeds.slice(0, 12).map((breed) => (
                <Link key={breed.id} href={`/search?breed_id=${breed.id}`} className="group relative overflow-hidden rounded-2xl border border-hairline bg-canvas hover:border-ink/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
                  <div className="aspect-[16/10] overflow-hidden bg-surface-card">
                    {(breed.image_url || breed.sample_thumbnail) ? (
                      <img src={breed.image_url || breed.sample_thumbnail || ''} alt={breed.name} className="h-full w-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
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
                <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">{t('La comunidad')}</p>
                <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                  {t('Criaderos en Genealogic')}
                </h2>
              </div>
              <Link href="/kennels" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:opacity-80">
                {t('Ver todos')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 pl-[30px] pr-5 sm:mx-0 sm:pl-0 sm:pr-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {featuredKennels.slice(0, 3).map((k) => (
                <Link key={k.id} href={`/kennels/${k.slug || k.id}`} className="group relative overflow-hidden rounded-2xl border border-hairline bg-canvas hover:border-ink/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all snap-start shrink-0 w-[82%] sm:w-[46%] lg:w-[calc((100%-2rem)/3)]">
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
                            {k.dog_count} {k.dog_count === 1 ? t('perro') : t('perros')}
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
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">{t('Lo dice gente real')}</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              {t('Quien lo usa, lo recomienda.')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {([
              { initials: 'LM', avatar: 'bg-blue-100 text-blue-700', quote: t('«Tengo la cartilla de mi perro siempre en el móvil y los recordatorios de vacunas me avisan solos. En el vet ya no busco papeles.»'), role: 'Laura Méndez', breed: t('Propietaria · Pastor Alemán') },
              { initials: 'CR', avatar: 'bg-emerald-100 text-emerald-700', quote: t('«Pegué la URL de la genealogía que me pasó mi criador y se montó el árbol entero con fotos. Ahora comparto la ficha de mi perra con un link.»'), role: 'Carla Ruiz', breed: t('Propietaria · Galgo Italiano') },
              { initials: 'JT', avatar: 'bg-violet-100 text-violet-700', quote: t('«Reservé mi cachorro y desde Genealogic seguí el estado, firmé el contrato y vi sus papeles. Sin perseguir al criador por WhatsApp.»'), role: 'Javier Torres', breed: t('Propietario · Presa Canario') },
            ]).map((r, i) => (
              <article key={i} className="rounded-2xl border border-hairline bg-canvas p-6 sm:p-7 flex flex-col">
                <Quote className="w-7 h-7 text-[#FE6620]/25" />
                <p className="mt-3 flex-1 text-[14.5px] sm:text-[15px] text-ink leading-snug" style={{ fontFamily: 'var(--font-fraunces, serif)' }}>{r.quote}</p>
                <div className="mt-5 flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold ${r.avatar}`}>{r.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-bold text-ink">{r.role}</p>
                    <p className="text-[11px] text-muted truncate">{r.breed}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═════ PRICING BAND ═════
           Sin tabla de precios en la home: para el propietario es gratis y
           punto. El criador con criadero pasa a /criadores (Genealogic
           Breeders) donde sí hay planes. */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-10 sm:py-14">
          <div className="rounded-2xl sm:rounded-3xl border border-hairline bg-canvas p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> {t('Gratis para siempre')}
              </div>
              <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(20px, 3vw, 30px)', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                {t('Para propietarios, Genealogic es gratis para siempre, sin límite de perros.')}
              </h2>
              <p className="mt-2.5 text-[13.5px] sm:text-[14.5px] text-body leading-relaxed">
                {t('¿Tienes criadero? Genealogic Breeders te da camadas, pipeline de reservas, contratos y web propia.')}
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-shrink-0">
              <Link href="/register?intent=owner" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-3 text-sm font-bold hover:opacity-90 transition">
                <Dog className="w-4 h-4" /> {t('Crear mi cuenta gratis')} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/criadores" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-hairline bg-canvas px-5 py-3 text-sm font-bold text-body hover:text-ink hover:border-ink/30 transition">
                <Store className="w-4 h-4" /> {t('Ver Genealogic Breeders →')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ FAQ ═════ */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
            <div>
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">{t('FAQ')}</p>
              <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                {t('Preguntas frecuentes.')}
              </h2>
              <p className="mt-4 text-[14px] text-body leading-relaxed">
                {t('¿No encuentras la tuya? Escríbenos a')}{' '}
                <a href="mailto:hola@genealogic.io" className="text-ink font-semibold hover:underline">hola@genealogic.io</a>
              </p>
            </div>
            <div className="space-y-2">
              <FaqItem q={t('¿Es realmente gratis?')}>
                {t('Sí. Si eres propietario, Genealogic es gratis para siempre y sin límite de perros: ficha con galería, genealogía, cartilla veterinaria con recordatorios y reservas con tu criador. No pedimos tarjeta. Solo los criaderos que quieren el panel profesional (camadas, pipeline, web propia) pasan a un plan de pago en Genealogic Breeders.')}
              </FaqItem>
              <FaqItem q={t('¿Es público o privado?')}>
                {t('La ficha y la genealogía de tu perro son públicas — esa es la gracia: juntas forman el mayor catálogo de genealogías caninas, y las compartes con un link. Tú las gestionas y editas. Lo sensible (cartilla veterinaria, contratos, documentos) es privado, solo para ti. Servidores en la UE, RGPD, y exportas o borras tus datos cuando quieras.')}
              </FaqItem>
              <FaqItem q={t('¿Puedo tener varios perros?')}>
                {t('Sí. Perros ilimitados, gratis para siempre. Documenta a todos los que tengas —y también a los que ya no están, con In Memoriam, que conserva su ficha y su genealogía intactas.')}
              </FaqItem>
              <FaqItem q={t('¿Y los papeles de mi perro?')}>
                {t('Digitalizas la cartilla, el contrato, el certificado y el microchip una vez y los tienes siempre a mano —incluso sin cobertura en el veterinario. Se acabó buscar carpetas.')}
              </FaqItem>
              <FaqItem q={t('¿Hay app de iOS?')}>
                {t('Sí, ya está disponible en la App Store. La ficha, la genealogía, la cartilla veterinaria y los recordatorios de tu perro en el bolsillo — y la cartilla offline cuando el vet la pida. La web sigue optimizada para móvil para todo lo demás.')}
              </FaqItem>
              <FaqItem q={t('¿Tengo que montar la genealogía de mi perro yo mismo?')}>
                {t('No. Si está en Dogsfiles, Presadb, K9data, Working-dog o Breedarchive, pegas la URL y nuestro importador con IA extrae la genealogía completa en 30 segundos. También aceptamos PDFs y capturas de pantalla.')}
              </FaqItem>
              <FaqItem q={t('¿Puedo reclamar un perro que ya está en el catálogo?')}>
                {t('Sí. Hemos importado miles de perros de clubes y federaciones. Búscalo por nombre, microchip o afijo, pulsa «Reclamar» y sube tus papeles. Un humano lo revisa en menos de 72h y te transfiere la titularidad.')}
              </FaqItem>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ BLOG SLIDER ═════ */}
      {blogPosts.length > 0 && <BlogSlider posts={blogPosts} />}
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
  const t = useT()
  return (
    <div className="relative rounded-2xl border border-hairline bg-canvas p-6 sm:p-7 z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex w-11 h-11 rounded-2xl bg-[#FE6620] items-center justify-center shadow-[0_8px_24px_rgba(254,102,32,0.25)]">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-[10.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{cta}</span>
      </div>
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{t('Paso')} {n}</p>
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
function ProductShowcase({ featuredDogs, galgoDogs, showcaseDog }: { featuredDogs: Dog[]; galgoDogs: MiniDog[]; showcaseDog: ShowcaseDog | null }) {
  const t = useT()
  // Galgo italianos REALES (con foto). Si la query no trajo, caemos a los
  // perros destacados para no dejar el mockup vacío.
  const dogs: MiniDog[] = (galgoDogs.length > 0
    ? galgoDogs
    : featuredDogs.map((d) => ({ id: d.id, name: d.name, slug: d.slug, sex: null, thumbnail_url: d.thumbnail_url, birth_date: null, breed: d.breed, color: null }))
  ).slice(0, 4)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Mockup 1: Mis perros — clona la card real del backend (dog-card):
          foto 4:3, chip de raza arriba-derecha, barra de sexo abajo, nombre. */}
      <div className="rounded-2xl border border-hairline bg-canvas overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-1.5 border-b border-hairline bg-surface-soft px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-rose-300" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          <span className="ml-2 text-[10px] text-muted truncate">{t('Mis perros')}</span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {dogs.map((d) => {
            const sexColor = d.sex === 'male' ? '#017DFA' : d.sex === 'female' ? '#e84393' : '#9ca3af'
            const breedName = d.breed?.name
            return (
              <div key={d.id} className="overflow-hidden rounded-lg border border-hairline bg-canvas">
                <div className="relative aspect-[4/3] bg-surface-card overflow-hidden">
                  {d.thumbnail_url ? (
                    <img src={d.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><Dog className="w-6 h-6 text-muted/30" /></div>
                  )}
                  {breedName && (
                    <span className="absolute right-1 top-1 rounded-full bg-canvas px-1.5 py-0.5 text-[7px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">{breedName}</span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: sexColor }} />
                </div>
                <div className="px-1.5 py-1">
                  <p className="truncate text-[9px] font-semibold text-ink">{d.name}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="px-3 pb-3">
          <p className="text-[11px] font-semibold text-ink">{t('Mis perros')}</p>
          <p className="text-[10px] text-muted">{t('Foto, raza, sexo y edad de cada perro')}</p>
        </div>
      </div>

      {/* Mockup 2: Ficha de perro real (réplica de /dogs/[id], perro insignia). */}
      <DogProfileMockup
        showcaseDog={showcaseDog}
        fallbackDog={featuredDogs.find(d => d.thumbnail_url) || null}
      />

      {/* Mockup 3: Cartilla veterinaria — clona vet-records (icono por tipo +
          título + fecha + chip), no el pipeline de criador. */}
      <div className="rounded-2xl border border-hairline bg-canvas overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-1.5 border-b border-hairline bg-surface-soft px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-rose-300" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          <span className="ml-2 text-[10px] text-muted truncate">{t('Veterinario')} · {t('cartilla')}</span>
        </div>
        <div className="p-3 space-y-1.5">
          {([
            { icon: Syringe, label: t('Vacuna'), title: t('Polivalente (DHPPi)'), date: '12 mar 2025', cls: 'bg-emerald-50 text-emerald-600' },
            { icon: Bug, label: t('Desparasitación'), title: t('Interna + externa'), date: '02 mar 2025', cls: 'bg-amber-50 text-amber-600' },
            { icon: Syringe, label: t('Vacuna'), title: t('Rabia'), date: '15 ene 2025', cls: 'bg-emerald-50 text-emerald-600' },
            { icon: Stethoscope, label: t('Revisión'), title: t('Chequeo anual'), date: '15 ene 2025', cls: 'bg-blue-50 text-blue-600' },
          ]).map((r, i) => {
            const Icon = r.icon
            return (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-soft px-2 py-1.5">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${r.cls}`}><Icon className="w-3 h-3" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9.5px] font-semibold text-ink truncate">{r.title}</p>
                  <p className="text-[8px] text-muted">{r.date}</p>
                </div>
                <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap ${r.cls}`}>{r.label}</span>
              </div>
            )
          })}
        </div>
        <div className="px-3 pb-3">
          <p className="text-[11px] font-semibold text-ink">{t('Cartilla veterinaria')}</p>
          <p className="text-[10px] text-muted">{t('Vacunas, desparasitaciones y recordatorios')}</p>
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
 * padres reales (Leon × Quina), badge de salud y badge sexo en overlay.
 * Si showcaseDog viene null, fallback al primer perro con foto.
 *
 * El cross-fade es un detalle pequeño pero importante: comunica que el
 * perfil tiene MUCHAS fotos, no solo una. Como Nestor tiene 3, cada 3.5s
 * cambia. Si solo hay 1 foto se queda estática.
 */
function DogProfileMockup({ showcaseDog, fallbackDog }: { showcaseDog: ShowcaseDog | null; fallbackDog: Dog | null }) {
  const t = useT()
  // Datos reales del perro insignia (Nestor) o fallback al primer
  // featuredDog. Si NI showcaseDog NI fallbackDog tienen el dato, usamos
  // un default neutro — pero NO mezclamos: si showcaseDog está vivo,
  // mandan SIEMPRE sus datos aunque algún campo sea null.
  const dogName = showcaseDog?.name || fallbackDog?.name || t('Sin nombre')
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
        {/* Badge salud en overlay */}
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-canvas/95 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-emerald-700 shadow-sm z-10">
          <Stethoscope className="w-2.5 h-2.5" /> {t('Vacunas al día')}
        </span>
        {/* Badge sexo en overlay bottom-left */}
        <span className={`absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full ${isMale ? 'bg-blue-500' : 'bg-pink-500'} text-white px-2 py-0.5 text-[9px] font-bold z-10`}>
          {isMale ? <Mars className="w-2.5 h-2.5" /> : <Venus className="w-2.5 h-2.5" />}
          {isMale ? t('Macho') : t('Hembra')}
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
        {photos.length > 0 && <ProfileChip icon={Camera} label={`${photos.length} ${t('fotos')}`} />}
      </div>

      {/* Padres mini — solo si hay datos reales, no placeholder */}
      {(fatherName || motherName) && (
        <div className="px-3 pb-3">
          <p className="text-[8.5px] font-semibold uppercase tracking-wider text-muted mb-1">{t('Padres')}</p>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1.5 rounded border border-hairline bg-canvas px-1.5 py-1">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mars className="w-2.5 h-2.5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[7px] text-muted uppercase font-semibold">{t('Padre')}</p>
                <p className="text-[9px] font-bold text-ink truncate">{fatherName || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded border border-hairline bg-canvas px-1.5 py-1">
              <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Venus className="w-2.5 h-2.5 text-pink-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[7px] text-muted uppercase font-semibold">{t('Madre')}</p>
                <p className="text-[9px] font-bold text-ink truncate">{motherName || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto px-3 pb-3 pt-1 border-t border-hairline bg-surface-soft/40">
        <p className="text-[11px] font-semibold text-ink">{t('Ficha del perro')}</p>
        <p className="text-[10px] text-muted">{t('Comparte su ficha con un link')}</p>
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

