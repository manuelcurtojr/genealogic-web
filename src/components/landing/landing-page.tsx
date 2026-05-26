'use client'

import Link from 'next/link'
import {
  ArrowRight,
  GitBranch,
  Sparkles,
  KanbanSquare,
  Globe,
  Mail,
  TrendingUp,
  Check,
  Plus,
  Minus,
  Dog,
  Heart,
  Calendar,
  ShieldCheck,
  Zap,
  Lock,
  Menu,
  X,
  User,
  Search,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'
import SearchBar from '@/components/layout/search-bar'

interface Props {
  breeds: { id: string; name: string }[]
  featuredDogs: any[]
  cockerPhotos?: string[]
}

export default function LandingPage({ breeds, featuredDogs, cockerPhotos = [] }: Props) {
  const heroDogs = featuredDogs.slice(0, 6)

  return (
    <main className="min-h-screen bg-canvas text-ink">
      {/* Header eliminado — lo aporta (public)/layout.tsx con MarketingHeader. */}
      <Hero heroDogs={heroDogs} />
      <PedigreeShowcase cockerPhotos={cockerPhotos} />
      <FeaturesGrid />
      <PipelineShowcase />
      <BotConversation />
      <OnboardingSteps />
      <Pricing />
      <FAQ />
      <FinalCta />
      {/* Footer lo aporta (public)/layout.tsx con MarketingFooter global. */}
    </main>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────
// Mobile: hamburguesa que abre un drawer lateral derecho.
// Desktop (md+): nav inline clásico + botones Login/Empezar (más rápido
// para navegar con mouse; en móvil el drawer da más espacio táctil).
function StickyHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4 sm:px-6 lg:px-12">
          <Wordmark size="text-xl" />

          {/* Desktop nav inline */}
          <nav className="hidden flex-1 items-center justify-center gap-7 text-[14px] text-body md:flex">
            <a href="#producto" className="transition hover:text-ink">Producto</a>
            <a href="#criadores" className="transition hover:text-ink">Para criadores</a>
            <a href="#precios" className="transition hover:text-ink">Precios</a>
            <Link href="/blog" className="transition hover:text-ink">Blog</Link>
            <a href="#faq" className="transition hover:text-ink">FAQ</a>
          </nav>

          {/* Desktop CTAs */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Button href="/login" variant="ghost" size="sm">
              Iniciar sesión
            </Button>
            <Button href="/register?intent=breeder&plan=free" variant="primary" size="sm">
              Empezar gratis
            </Button>
          </div>

          {/* Mobile hamburguesa */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-surface-card transition md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <PublicDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

// Drawer público — espejado del Sidebar del dashboard pero con secciones
// para visitantes (sin login, sin kennel todavía).
function PublicDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Cierre con ESC
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    // Bloquear scroll del body mientras drawer abierto
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-screen w-full max-w-[360px] z-[70] bg-canvas border-l border-hairline shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header drawer */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-hairline flex-shrink-0">
          <Wordmark size="text-lg" />
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-surface-card transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CTAs principales arriba del todo */}
        <div className="px-5 py-4 border-b border-hairline space-y-2 flex-shrink-0">
          <Button href="/register?intent=breeder&plan=free" variant="primary" size="md" className="w-full">
            Empezar gratis
          </Button>
          <Button href="/login" variant="secondary" size="md" className="w-full">
            <User className="h-4 w-4" />
            Iniciar sesión
          </Button>
        </div>

        {/* Navegación scrollable */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          <DrawerSection label="Explorar">
            <DrawerLink href="/search" icon={Search} onClick={onClose}>
              Buscar perros
            </DrawerLink>
            <DrawerLink href="/kennels" icon={Dog} onClick={onClose}>
              Directorio de criaderos
            </DrawerLink>
            <DrawerLink href="/blog" icon={GitBranch} onClick={onClose}>
              Blog
            </DrawerLink>
          </DrawerSection>

          <DrawerSection label="Producto">
            <DrawerAnchor href="#producto" onClick={onClose}>Genealogía pública</DrawerAnchor>
            <DrawerAnchor href="#criadores" onClick={onClose}>Para criadores</DrawerAnchor>
            <DrawerAnchor href="#precios" onClick={onClose}>Precios</DrawerAnchor>
            <DrawerAnchor href="#faq" onClick={onClose}>FAQ</DrawerAnchor>
            <DrawerLink href="/api-docs" icon={Zap} onClick={onClose}>
              API pública
            </DrawerLink>
          </DrawerSection>
        </nav>

        {/* Footer drawer */}
        <div className="border-t border-hairline px-5 py-3 flex-shrink-0">
          <p className="text-[11px] text-muted">
            ¿Dudas?{' '}
            <a href="mailto:hola@genealogic.io" className="text-ink underline">
              hola@genealogic.io
            </a>
          </p>
        </div>
      </aside>
    </>
  )
}

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted px-3 mt-2 mb-1.5">
        {label}
      </p>
      {children}
    </div>
  )
}

function DrawerLink({
  href, icon: Icon, onClick, children,
}: {
  href: string
  icon: React.ElementType
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-body hover:bg-surface-soft hover:text-ink transition"
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      <span>{children}</span>
    </Link>
  )
}

function DrawerAnchor({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="block rounded-lg px-3 py-2.5 text-[13px] font-medium text-body hover:bg-surface-soft hover:text-ink transition"
    >
      {children}
    </a>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────
function Hero({ heroDogs }: { heroDogs: any[] }) {
  return (
    <section className="relative overflow-hidden border-b border-hairline">
      {/* Decorative gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.7]"
        style={{
          background:
            'radial-gradient(60% 50% at 15% 0%, rgba(215,71,9,0.12) 0%, transparent 65%), radial-gradient(50% 40% at 90% 20%, rgba(1,125,250,0.08) 0%, transparent 65%), radial-gradient(40% 40% at 50% 100%, rgba(232,67,147,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-5 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-12 lg:pt-24 lg:pb-24">
        <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Left: copy + CTAs */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--brand)]/30 bg-[color:var(--brand-soft)] px-3 py-1 text-[12px] font-medium text-[color:var(--brand)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--brand)] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--brand)]" />
              </span>
              Founder pricing · plazas limitadas
            </div>

            {/* Headline */}
            <h1
              className="mt-5 sm:mt-7 max-w-[16ch] font-semibold text-ink"
              style={{ fontSize: 'clamp(32px, 6vw, 68px)', lineHeight: 1.02, letterSpacing: '-0.04em' }}
            >
              Tu criadero entero, en un solo sitio.
            </h1>
            <p className="mt-5 sm:mt-6 max-w-[520px] text-[16px] leading-[1.55] text-body sm:text-[18px]">
              Genealogías verificables, reservas, clientes, web propia y emailbot.
              Todo lo que necesita un criadero serio. Gratis para empezar.
            </p>

            {/* CTAs */}
            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3">
              <Button href="/register?intent=breeder&plan=free" variant="primary" size="lg">
                Empieza gratis <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="#producto" variant="secondary" size="lg">
                Cómo funciona
              </Button>
            </div>
            <p className="mt-4 text-[13px] text-muted">
              Sin tarjeta · 1.366 perros y 148 criaderos ya en el registro
            </p>
          </div>

          {/* Right: app-window mockup with real SearchBar */}
          <div className="relative">
            <AppWindow url="genealogic.io/buscar">
              <div className="px-5 py-6 sm:px-8 sm:py-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                  Registro público
                </p>
                <h3
                  className="mt-1.5 font-semibold text-ink"
                  style={{ fontSize: 'clamp(20px, 2.4vw, 26px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
                >
                  Buscar en el registro
                </h3>
                <div className="mt-5 text-left">
                  <SearchBar />
                </div>

                {/* Featured dogs row — real data */}
                {heroDogs.length > 0 && (
                  <div className="mt-6">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">
                      Publicados recientemente
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {heroDogs.slice(0, 5).map((dog: any) => (
                        <Link
                          key={dog.id}
                          href={`/dogs/${dog.slug || dog.id}`}
                          className="block h-11 w-11 overflow-hidden rounded-lg border border-hairline bg-surface-card transition hover:border-ink/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                          title={dog.name}
                        >
                          {dog.thumbnail_url && (
                            <img src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover" />
                          )}
                        </Link>
                      ))}
                      <Link
                        href="/search"
                        className="flex h-11 items-center rounded-lg border border-hairline px-3 text-[12px] font-medium text-body transition hover:border-ink/40 hover:text-ink"
                      >
                        Ver todos →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </AppWindow>
            {/* Floating accent dot */}
            <div
              aria-hidden
              className="absolute -bottom-3 -right-3 hidden h-20 w-20 rounded-full opacity-30 blur-2xl sm:block"
              style={{ background: 'var(--brand)' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/** macOS-style window chrome wrapper. Used to frame product mockups. */
function AppWindow({
  url,
  title,
  children,
}: {
  url?: string
  title?: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-hairline bg-canvas shadow-[0_24px_60px_-12px_rgba(17,17,17,0.18),0_8px_24px_-4px_rgba(17,17,17,0.08)]">
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-hairline bg-surface-soft px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        {url && (
          <div className="hidden flex-1 sm:flex sm:justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-canvas px-3 py-1 text-[11px] text-muted shadow-inner">
              <Lock className="h-3 w-3" />
              <span className="font-mono">{url}</span>
            </div>
          </div>
        )}
        {title && !url && (
          <p className="flex-1 text-center text-[12px] font-medium text-body">{title}</p>
        )}
        <div className="w-[54px]" />
      </div>
      {children}
    </div>
  )
}

// ─── Pedigree showcase ───────────────────────────────────────────────────
function PedigreeShowcase({ cockerPhotos }: { cockerPhotos: string[] }) {
  return (
    <section id="producto" className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          01 · Para todos
        </p>
        <div className="mt-3 grid gap-6 sm:gap-12 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2
            className="max-w-[20ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            El registro público de perros con genealogía verificable.
          </h2>
          <p className="max-w-[460px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
            Cada perro con árbol genealógico ilimitado, datos sanitarios, registro y
            trazabilidad. Importa genealogías existentes en segundos con IA. Comparte
            tu trabajo con un link público.
          </p>
        </div>

        {/* Real-looking pedigree mockup inside app window */}
        <div className="mt-10 sm:mt-14">
          <AppWindow url="genealogic.io/dogs/lord-byron-de-aldenham">
            <RealPedigreeMockup cockerPhotos={cockerPhotos} />
          </AppWindow>
        </div>

        <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
          <MiniFeature
            icon={<GitBranch className="h-5 w-5" />}
            title="Genealogía real"
            desc="Generaciones ilimitadas, fotos, registros, salud. No autodeclarado: trazable."
            color="brand"
          />
          <MiniFeature
            icon={<Sparkles className="h-5 w-5" />}
            title="Importa con IA"
            desc="Foto de una genealogía → árbol completo en segundos. Claude lo entiende."
            color="violet"
          />
          <MiniFeature
            icon={<Globe className="h-5 w-5" />}
            title="Indexable"
            desc="Tus perros aparecen en Google. Cada criadero con perfil público."
            color="emerald"
          />
        </div>
      </div>
    </section>
  )
}

/**
 * Realistic Cocker Spaniel pedigree mock. Uses absolute positioning so SVG
 * connectors line up exactly with each card.
 *
 * Layout (container 880×460):
 *   col1 root:        x=0,   y=198  (centered vertically)
 *   col2 father:      x=320, y=68
 *   col2 mother:      x=320, y=328
 *   col3 GP1 (FF):    x=640, y=8
 *   col3 GP2 (FM):    x=640, y=128
 *   col3 GP3 (MF):    x=640, y=268
 *   col3 GP4 (MM):    x=640, y=388
 *
 * Card is 220×64, so right edge x=card_x+220, vertical center y=card_y+32.
 */
function RealPedigreeMockup({ cockerPhotos }: { cockerPhotos: string[] }) {
  const dogs: Array<{ name: string; sex: 'male' | 'female'; reg?: string }> = [
    { name: 'Lord Byron de Aldenham', sex: 'male', reg: 'LOE 2189437' }, // root
    { name: 'Ch. Whiskey de Aldenham', sex: 'male' },                    // father
    { name: 'Hazel de Aldenham', sex: 'female' },                        // mother
    { name: 'Reginald del Támesis', sex: 'male' },                       // FF
    { name: 'Penny de Surrey', sex: 'female' },                          // FM
    { name: 'Bandit du Lac', sex: 'male' },                              // MF
    { name: 'Honey de Vendée', sex: 'female' },                          // MM
  ]
  const breed = 'Cocker Spaniel Inglés'

  // Card positions (top-left)
  const W = 220, H = 64
  const positions = [
    { x: 0,   y: 198 }, // root → center y = 230
    { x: 320, y: 68  }, // father → center y = 100
    { x: 320, y: 328 }, // mother → center y = 360
    { x: 640, y: 8   }, // FF → center y = 40
    { x: 640, y: 128 }, // FM → center y = 160
    { x: 640, y: 268 }, // MF → center y = 300
    { x: 640, y: 388 }, // MM → center y = 420
  ]
  const centerY = (i: number) => positions[i].y + H / 2
  const rightX  = (i: number) => positions[i].x + W
  const leftX   = (i: number) => positions[i].x

  return (
    <div className="overflow-x-auto p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          <GitBranch className="h-3.5 w-3.5" />
          Árbol genealógico
        </div>
        <span className="rounded-full bg-surface-card px-2.5 py-1 text-[11px] font-medium text-body">
          3 generaciones · ilimitadas disponibles
        </span>
      </div>

      {/* Stage — fixed pixel layout so cards & SVG line up */}
      <div className="relative mx-auto" style={{ width: 860, height: 460, minWidth: 860 }}>
        {/* SVG connectors */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={860}
          height={460}
          viewBox="0 0 860 460"
          aria-hidden
        >
          <g stroke="var(--pedigree-line, rgba(17,17,17,0.18))" strokeWidth="1.5" fill="none" strokeLinecap="round">
            {/* Root → parents (fork at x = midpoint between col1 right and col2 left) */}
            <path d={`M ${rightX(0)} ${centerY(0)} H 270`} />
            <path d={`M 270 ${centerY(0)} V ${centerY(1)} H ${leftX(1)}`} />
            <path d={`M 270 ${centerY(0)} V ${centerY(2)} H ${leftX(2)}`} />
            {/* Father → his parents */}
            <path d={`M ${rightX(1)} ${centerY(1)} H 590`} />
            <path d={`M 590 ${centerY(1)} V ${centerY(3)} H ${leftX(3)}`} />
            <path d={`M 590 ${centerY(1)} V ${centerY(4)} H ${leftX(4)}`} />
            {/* Mother → her parents */}
            <path d={`M ${rightX(2)} ${centerY(2)} H 590`} />
            <path d={`M 590 ${centerY(2)} V ${centerY(5)} H ${leftX(5)}`} />
            <path d={`M 590 ${centerY(2)} V ${centerY(6)} H ${leftX(6)}`} />
          </g>
        </svg>

        {/* Cards positioned absolutely */}
        {dogs.map((d, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: positions[i].x, top: positions[i].y }}
          >
            <PedCard
              name={d.name}
              breed={breed}
              registration={d.reg}
              sex={d.sex}
              isRoot={i === 0}
              photo={cockerPhotos[i] || cockerPhotos[i % Math.max(cockerPhotos.length, 1)]}
              fallbackSeed={i}
            />
          </div>
        ))}
      </div>

      {/* Footer line */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[color:var(--success)]" />
          Verificable · trazable · público
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--male)' }} />
            Macho
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--female)' }} />
            Hembra
          </span>
        </div>
      </div>
    </div>
  )
}

/** Mirrors the look of the production Card in pedigree-tree.tsx: 220x64, photo left, sex stripe, name + breed/reg. */
function PedCard({
  name,
  breed,
  registration,
  sex,
  isRoot,
  photo,
  fallbackSeed = 0,
}: {
  name: string
  breed?: string
  registration?: string
  sex: 'male' | 'female'
  isRoot?: boolean
  photo?: string | null
  fallbackSeed?: number
}) {
  const stripe = sex === 'male' ? 'var(--male)' : 'var(--female)'
  // Deterministic pastel gradient for the photo fallback (when dog.ceo unreachable
  // or returns fewer photos than needed). Two muted spaniel-ish tones.
  const fallbackGradients = [
    'linear-gradient(135deg, #d4a574 0%, #8b6f47 100%)', // honey brown
    'linear-gradient(135deg, #c9a98c 0%, #6b4f3a 100%)', // tan
    'linear-gradient(135deg, #b08968 0%, #5d4037 100%)', // chocolate
    'linear-gradient(135deg, #e8c39e 0%, #a47551 100%)', // cream
    'linear-gradient(135deg, #1a1a1a 0%, #404040 100%)', // black
    'linear-gradient(135deg, #d2b48c 0%, #8b7355 100%)', // tan light
    'linear-gradient(135deg, #f4e4bc 0%, #c19a6b 100%)', // golden
  ]
  const fallbackBg = fallbackGradients[fallbackSeed % fallbackGradients.length]

  return (
    <div
      className={`relative flex items-stretch overflow-hidden rounded-xl border bg-canvas ${
        isRoot
          ? 'border-ink shadow-[0_0_0_1px_rgba(17,17,17,0.04),0_4px_18px_rgba(17,17,17,0.10)]'
          : 'border-hairline shadow-[0_1px_2px_rgba(17,17,17,0.04)]'
      }`}
      style={{ width: 220, height: 64 }}
    >
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{ width: 56, background: fallbackBg }}
      >
        {photo && (
          <img
            src={photo}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
        {/* Sex stripe */}
        <div className="absolute bottom-0 right-0 top-0 w-[3px]" style={{ backgroundColor: stripe }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-2.5 py-1.5">
        <p className="truncate text-[12px] font-semibold leading-tight text-ink">{name}</p>
        {registration ? (
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted">{registration}</p>
        ) : breed ? (
          <p className="mt-0.5 truncate text-[10.5px] text-muted">{breed}</p>
        ) : null}
      </div>
    </div>
  )
}

// ─── Features grid (Pro) ─────────────────────────────────────────────────
function FeaturesGrid() {
  return (
    <section id="criadores" className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          02 · Tier Pro
        </p>
        <div className="mt-3 grid gap-6 sm:gap-12 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2
            className="max-w-[20ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            Todo lo que un criadero serio necesita en un sitio.
          </h2>
          <p className="max-w-[460px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
            Pipeline de reservas con vistas Ventas/Clientes, hub de contactos, web pública con
            dominio propio, emailbot que responde a tus consultas con tu tono y tu
            biblioteca, newsletter, estadísticas. Y la genealogía verificada encima.
          </p>
        </div>

        <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<KanbanSquare className="h-5 w-5" />}
            title="Pipeline de reservas"
            desc="Pipeline con vistas Ventas y Clientes, filtros por estado y panel de detalle con conversación, contacto y acciones. No más Excel."
            color="brand"
          />
          <FeatureCard
            icon={<Heart className="h-5 w-5" />}
            title="Hub de Contactos"
            desc="3 tabs: suscriptores newsletter, leads sin cerrar y clientes con reserva. Cada contacto con su historial completo."
            color="pink"
          />
          <FeatureCard
            icon={<Globe className="h-5 w-5" />}
            title="Web pública con dominio propio"
            desc="Editor visual + 3 temas (Clásico, BMW M, Lamborghini). Conecta tu dominio en 5 minutos."
            color="blue"
          />
          <FeatureCard
            icon={<Mail className="h-5 w-5" />}
            title="Emailbot multi-modelo"
            desc="Elige tu modelo (Claude Sonnet, GPT-4o, Gemini, etc). Carga tu biblioteca con IA desde tu web o un PDF. Responde con tu tono."
            color="violet"
          />
          <FeatureCard
            icon={<Calendar className="h-5 w-5" />}
            title="Newsletter segmentada"
            desc="4 audiencias auto-calculadas: todos, clientes, leads, los que recibieron cachorro. Editor con preview live."
            color="orange"
          />
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Analíticas first-party"
            desc="Visitas a tu web, países, dispositivos, perros más vistos. Sin Google Analytics, sin cookies, GDPR-safe."
            color="emerald"
          />
        </div>
      </div>
    </section>
  )
}

// ─── Pipeline showcase (DEMO INTERACTIVA) ────────────────────────────────
// Mockup VIVO del pipeline real de /reservas. El visitante puede:
//   - Cambiar entre Ventas/Clientes (cada vista tiene su set de estados)
//   - Filtrar por estado (chips con contadores dinámicos)
//   - Cambiar el estado de cualquier lead (select inline)
//     Si pasa a un estado de la otra vista (ej: 'assigned' es Clientes),
//     el lead se mueve automáticamente — comportamiento idéntico al de la
//     app real.
//
// Sin DB, sin backend — todo state local. Perfecto para que un visitor
// "toque" el producto antes de registrarse.

type DemoStatus =
  | 'interested' | 'deposit_paid'                           // VENTAS
  | 'assigned' | 'contract_signed' | 'paid_in_full' | 'delivered' // CLIENTES

const VENTAS_STATUSES: DemoStatus[] = ['interested', 'deposit_paid']
const CLIENTES_STATUSES: DemoStatus[] = ['assigned', 'contract_signed', 'paid_in_full', 'delivered']

const STATUS_LABEL: Record<DemoStatus, string> = {
  interested:      'Interesado',
  deposit_paid:    'Seña pagada',
  assigned:        'Asignado',
  contract_signed: 'Contrato firmado',
  paid_in_full:    'Pagado',
  delivered:       'Entregado',
}

const STATUS_COLOR: Record<DemoStatus, string> = {
  interested:      'badge-orange',
  deposit_paid:    'badge-violet',
  assigned:        'badge-emerald',
  contract_signed: 'badge-emerald',
  paid_in_full:    'badge-emerald',
  delivered:       'muted',
}

type DemoLead = {
  id: string
  name: string
  email: string
  status: DemoStatus
  pref: string
  date: string
}

const INITIAL_LEADS: DemoLead[] = [
  // Ventas
  { id: '1', name: 'Laura Martín',  email: 'laura.m@gmail.com',          status: 'interested',   pref: 'Macho · atigrado',     date: '14 mar' },
  { id: '2', name: 'Diego Romero',  email: 'diego.rdz@hey.com',          status: 'deposit_paid', pref: 'Hembra',                date: '12 mar' },
  { id: '3', name: 'Ana Pereira',   email: 'ana.pereira@yahoo.es',       status: 'interested',   pref: 'Sin preferencia',       date: '6 mar' },
  { id: '4', name: 'Carlos Delgado',email: 'carlos.d@protonmail.com',    status: 'interested',   pref: 'Lista de espera',       date: '2 mar' },
  { id: '5', name: 'María Lucas',   email: 'marial84@gmail.com',         status: 'deposit_paid', pref: 'Hembra · primavera',    date: '28 feb' },
  // Clientes
  { id: '6', name: 'Pablo Gómez',   email: 'pablo@gomezvet.es',          status: 'assigned',        pref: 'Macho · cachorro #7', date: '20 feb' },
  { id: '7', name: 'Elena Castro',  email: 'elena.castro@outlook.com',   status: 'contract_signed', pref: 'Macho · cachorro #3', date: '14 feb' },
  { id: '8', name: 'Jorge Trujillo',email: 'jorge.t@trujillobogados.es', status: 'paid_in_full',    pref: 'Hembra · cachorro #5',date: '4 feb' },
  { id: '9', name: 'Sofía Bermejo', email: 'sofia.bermejo@gmail.com',    status: 'delivered',       pref: 'Macho · cachorro #1', date: '28 ene' },
  { id: '10', name: 'Iván Costa',   email: 'ivan.costa@me.com',          status: 'delivered',       pref: 'Hembra · cachorro #2',date: '20 ene' },
]

function PipelineShowcase() {
  const [leads, setLeads] = useState<DemoLead[]>(INITIAL_LEADS)
  const [view, setView] = useState<'ventas' | 'clientes'>('ventas')
  const [filter, setFilter] = useState<DemoStatus | 'all'>('all')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  // Cuando cambia view, reset filter (para no quedar con un filter de la
  // otra mitad — comportamiento idéntico al pipeline real)
  function changeView(next: 'ventas' | 'clientes') {
    setView(next)
    setFilter('all')
  }

  function changeStatus(leadId: string, next: DemoStatus) {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: next } : l))
    // Pulso visual del cambio (que el visitor vea que algo pasó)
    setHighlightedId(leadId)
    setTimeout(() => setHighlightedId((cur) => cur === leadId ? null : cur), 1200)
  }

  // Counts por status (para chips)
  const viewStatuses = view === 'ventas' ? VENTAS_STATUSES : CLIENTES_STATUSES
  const leadsInView = leads.filter((l) => viewStatuses.includes(l.status))
  const totalVentas = leads.filter((l) => VENTAS_STATUSES.includes(l.status)).length
  const totalClientes = leads.filter((l) => CLIENTES_STATUSES.includes(l.status)).length
  const filterCounts = Object.fromEntries(
    viewStatuses.map((s) => [s, leadsInView.filter((l) => l.status === s).length]),
  ) as Record<DemoStatus, number>

  const visible = filter === 'all' ? leadsInView : leadsInView.filter((l) => l.status === filter)

  function resetDemo() {
    setLeads(INITIAL_LEADS)
    setView('ventas')
    setFilter('all')
  }

  const demoTouched = JSON.stringify(leads) !== JSON.stringify(INITIAL_LEADS) || view !== 'ventas' || filter !== 'all'

  return (
    <section className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          03 · Pipeline
        </p>
        <h2
          className="mt-3 max-w-[24ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          Tu próxima camada se reserva sola.
        </h2>
        <p className="mt-5 sm:mt-6 max-w-[600px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
          Cada lead con su estado (interesado, seña, asignado, contrato, entregado).
          Cambias estado con un click. Vistas separadas <strong>Ventas</strong>{' '}
          (leads abiertos) y <strong>Clientes</strong> (reservas cerradas). Panel
          lateral con detalle, conversación y acciones.
        </p>

        {/* Demo banner */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[color:var(--brand)]/30 bg-[color:var(--brand-soft)] px-3 py-1 text-[12px] font-medium text-[color:var(--brand)]">
          <Zap className="h-3 w-3" />
          Demo interactiva — toca lo que quieras
          {demoTouched && (
            <button
              onClick={resetDemo}
              className="ml-2 inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[10px] font-semibold text-ink transition hover:opacity-80"
            >
              Reset
            </button>
          )}
        </div>

        <div className="mt-6">
          <AppWindow url="genealogic.io/reservas">
            <div className="p-4 sm:p-7">
              {/* Switcher Ventas/Clientes */}
              <div className="inline-flex rounded-lg border border-hairline bg-surface-soft p-1 mb-4">
                <button
                  onClick={() => changeView('ventas')}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-[12px] font-medium transition ${
                    view === 'ventas' ? 'bg-ink text-on-primary' : 'text-muted hover:text-ink'
                  }`}
                >
                  Ventas
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      view === 'ventas' ? 'bg-white/20 text-on-primary' : 'bg-canvas'
                    }`}
                  >
                    {totalVentas}
                  </span>
                </button>
                <button
                  onClick={() => changeView('clientes')}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-[12px] font-medium transition ${
                    view === 'clientes' ? 'bg-ink text-on-primary' : 'text-muted hover:text-ink'
                  }`}
                >
                  Clientes
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      view === 'clientes' ? 'bg-white/20 text-on-primary' : 'bg-canvas'
                    }`}
                  >
                    {totalClientes}
                  </span>
                </button>
              </div>

              {/* Filter chips */}
              <div className="flex flex-wrap gap-2 border-b border-hairline pb-3 mb-3">
                <FilterChip
                  label="Todas"
                  count={leadsInView.length}
                  active={filter === 'all'}
                  onClick={() => setFilter('all')}
                />
                {viewStatuses.map((s) => (
                  <FilterChip
                    key={s}
                    label={STATUS_LABEL[s]}
                    count={filterCounts[s] || 0}
                    active={filter === s}
                    onClick={() => setFilter(s)}
                  />
                ))}
              </div>

              {/* Tabla */}
              <div className="overflow-hidden rounded-lg border border-hairline">
                <table className="w-full text-[12.5px]">
                  <thead className="bg-surface-soft/70 text-[10px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Solicitante</th>
                      <th className="px-3 py-2 text-left font-semibold">Estado</th>
                      <th className="px-3 py-2 text-left font-semibold hidden sm:table-cell">Preferencia</th>
                      <th className="px-3 py-2 text-right font-semibold hidden md:table-cell">Recibida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-soft">
                    {visible.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-12 text-center text-[12px] text-muted">
                          Ningún lead en este filtro.
                        </td>
                      </tr>
                    ) : (
                      visible.map((l) => (
                        <PipelineRow
                          key={l.id}
                          lead={l}
                          highlighted={highlightedId === l.id}
                          onChangeStatus={(s) => changeStatus(l.id, s)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Hint sutil */}
              <p className="mt-3 text-[11px] text-muted text-center">
                Tip: cambia el estado de cualquier fila. Si pasa a Asignado o más, el lead se mueve a la vista Clientes.
              </p>
            </div>
          </AppWindow>
        </div>
      </div>
    </section>
  )
}

function FilterChip({
  label, count, active, onClick,
}: {
  label: string
  count: number
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition ${
        active ? 'bg-ink text-on-primary' : 'bg-surface-card text-body hover:bg-canvas'
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          active ? 'bg-white/20 text-on-primary' : 'bg-canvas text-muted'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function PipelineRow({
  lead, highlighted, onChangeStatus,
}: {
  lead: DemoLead
  highlighted: boolean
  onChangeStatus: (next: DemoStatus) => void
}) {
  const allStatuses: DemoStatus[] = [...VENTAS_STATUSES, ...CLIENTES_STATUSES]
  const color = STATUS_COLOR[lead.status]

  return (
    <tr
      className={`transition-colors duration-300 ${
        highlighted ? 'bg-[color:var(--brand-soft)]' : 'hover:bg-surface-soft/40'
      }`}
    >
      <td className="px-3 py-2.5">
        <p className="font-medium text-ink">{lead.name}</p>
        <p className="text-[10.5px] text-muted truncate">{lead.email}</p>
      </td>
      <td className="px-3 py-2.5">
        <select
          value={lead.status}
          onChange={(e) => onChangeStatus(e.target.value as DemoStatus)}
          className="cursor-pointer rounded-md border-0 px-2 py-0.5 text-[10.5px] font-medium focus:outline-none focus:ring-2 focus:ring-ink/20"
          style={{
            background: color === 'muted'
              ? 'var(--surface-card)'
              : `color-mix(in srgb, var(--${color}) 15%, transparent)`,
            color: color === 'muted' ? 'var(--muted)' : `var(--${color})`,
          }}
        >
          {allStatuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2.5 text-muted hidden sm:table-cell">{lead.pref}</td>
      <td className="px-3 py-2.5 text-right text-[11px] text-muted tabular-nums hidden md:table-cell">
        {lead.date}
      </td>
    </tr>
  )
}

// ─── Bot conversation ────────────────────────────────────────────────────
function BotConversation() {
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
              04 · Emailbot
            </p>
            <h2
              className="mt-3 font-semibold text-ink"
              style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
            >
              Habla con tus compradores incluso cuando duermes.
            </h2>
            <p className="mt-5 sm:mt-6 text-[16px] leading-[1.55] text-body sm:text-[17px]">
              Conectas tu email del criadero. El bot lee, redacta una respuesta con
              tu tono usando tu biblioteca de conocimiento. Tú revisas y envías. O lo
              dejas en auto-piloto para preguntas frecuentes.
            </p>
            <div className="mt-6 sm:mt-8 space-y-3">
              <BulletRow text="Lee tu biblioteca: precios, contratos, certificados, salud" />
              <BulletRow text="Responde con tu tono, no con el de ChatGPT" />
              <BulletRow text="Tú decides si auto-envía o si revisas antes" />
            </div>
          </div>

          <AppWindow title="hola@tucriadero.com · Hilo 142">
            <div className="space-y-3 p-4 sm:p-7">
              <ChatBubble side="left">
                Hola, ¿tendréis camadas previstas para primavera? Estaba interesado en
                un macho con padres con certificados de cadera.
              </ChatBubble>
              <ChatBubble side="right" bot>
                ¡Hola! Sí, esperamos camada de Estrella x Tornado para marzo. Ambos
                con HD-A oficial y prueba de carácter. Te paso enlace al perfil de
                los padres y el contrato de reserva (seña 300 €).
              </ChatBubble>
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-hairline bg-surface-soft p-2.5 text-[11.5px] text-muted">
                <Zap className="h-3.5 w-3.5 text-[color:var(--brand)]" />
                <span>
                  Bot · usa biblioteca <span className="font-mono text-ink">contratos.md</span>{' '}
                  + <span className="font-mono text-ink">salud-padres.md</span>
                </span>
              </div>
            </div>
          </AppWindow>
        </div>
      </div>
    </section>
  )
}

function ChatBubble({
  side,
  bot,
  children,
}: {
  side: 'left' | 'right'
  bot?: boolean
  children: React.ReactNode
}) {
  if (side === 'left') {
    return (
      <div className="flex items-start gap-2">
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-[color:var(--badge-pink)]/30" />
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface-card px-4 py-2.5 text-[13.5px] leading-[1.5] text-ink">
          {children}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start justify-end gap-2">
      <div
        className={`max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-[13.5px] leading-[1.5] ${
          bot ? 'bg-ink text-on-primary' : 'bg-surface-card text-ink'
        }`}
      >
        {children}
      </div>
      {bot && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--brand)] text-[11px] font-semibold text-white">
          AI
        </div>
      )}
    </div>
  )
}

// ─── Onboarding steps ────────────────────────────────────────────────────
function OnboardingSteps() {
  return (
    <section className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          05 · Empezar
        </p>
        <h2
          className="mt-3 max-w-[18ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          De cero a operando en un fin de semana.
        </h2>

        <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Step n="1" duration="30 min" title="Crea tu cuenta">
            Registro gratis. Configura tu criadero, afijo y datos básicos. Sin tarjeta.
          </Step>
          <Step n="2" duration="1 hora" title="Importa tus perros">
            Sube fotos de genealogías existentes. La IA extrae el árbol entero en segundos.
          </Step>
          <Step n="3" duration="1 día" title="Diseña tu web">
            Editor visual. 8 páginas troncales, 36 secciones. Conecta tu dominio.
          </Step>
          <Step n="4" duration="Day 1" title="Empieza a vender">
            Activa pipeline de reservas y emailbot. Tu próxima consulta entra al CRM.
          </Step>
        </div>
      </div>
    </section>
  )
}

function Step({
  n,
  duration,
  title,
  children,
}: {
  n: string
  duration: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[12px] border border-hairline bg-canvas p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-on-primary">
          {n}
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
          {duration}
        </span>
      </div>
      <h3 className="mt-5 text-[18px] font-semibold text-ink" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.55] text-body">{children}</p>
    </div>
  )
}

// ─── Pricing ─────────────────────────────────────────────────────────────
// Refleja exactamente la página /pricing y el flujo signup intent-aware.
// 3 tiers: Free 0€ · Kennel 29€ · Kennel Pro 49€ (precio Founder de por vida).
function Pricing() {
  return (
    <section id="precios" className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          06 · Precios
        </p>
        <h2
          className="mt-3 max-w-[18ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          Datos gratis. Herramientas que venden.
        </h2>
        <p className="mt-5 sm:mt-6 max-w-[560px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
          La genealogía es siempre completa, sin límite de generaciones, en
          todos los planes. Los planes de pago añaden las herramientas que un
          criadero profesional necesita para vender mejor. Sin tarjeta para
          empezar.
        </p>

        <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-6 md:grid-cols-3">
          {/* Free */}
          <div className="rounded-[16px] border border-hairline bg-canvas p-6 sm:p-7 flex flex-col">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Free</p>
            <p className="mt-3 text-[36px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
              0 € <span className="text-[14px] font-normal text-muted">/ siempre</span>
            </p>
            <p className="mt-2 text-[14px] text-body">
              Para dueños y criadores hobby. Sin tarjeta.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] flex-1">
              <PricingRow>Hasta 10 perros con ficha completa</PricingRow>
              <PricingRow>Genealogía completa, sin límite de generaciones</PricingRow>
              <PricingRow>Importación de genealogías con IA</PricingRow>
              <PricingRow>Búsqueda pública del registro</PricingRow>
              <PricingRow>Simulador de cruces con Punnett</PricingRow>
              <PricingRow>Calendario de celos, partos y vet</PricingRow>
              <PricingRow>App móvil (cuando salga)</PricingRow>
            </ul>
            <Button href="/register?intent=breeder&plan=free" variant="secondary" className="mt-7 w-full">
              Empezar gratis
            </Button>
          </div>

          {/* Kennel (highlighted) */}
          <div className="relative rounded-[16px] bg-surface-dark p-6 sm:p-7 text-on-dark flex flex-col">
            <span className="absolute -top-3 right-6 rounded-full bg-[color:var(--brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
              Más popular
            </span>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-on-dark-soft">Kennel</p>
            <p className="mt-3 text-[36px] font-semibold" style={{ letterSpacing: '-0.02em' }}>
              29 € <span className="text-[14px] font-normal text-on-dark-soft">/ mes</span>
            </p>
            <p className="mt-2 text-[14px] text-on-dark-soft">
              Criadero profesional. Gestiona reservas, clientes y vet sin Excel.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] flex-1">
              <PricingRow dark>Todo lo de Free + perros ilimitados</PricingRow>
              <PricingRow dark>Pipeline de reservas (Ventas + Clientes)</PricingRow>
              <PricingRow dark>Contratos digitales y pagos a plazos</PricingRow>
              <PricingRow dark>Calendario veterinario y reproductivo</PricingRow>
              <PricingRow dark>Importador IA sin límite</PricingRow>
              <PricingRow dark>Contactos: suscriptores, leads, clientes</PricingRow>
              <PricingRow dark>Visitas y estadísticas del perfil</PricingRow>
            </ul>
            <Button
              href="/register?intent=breeder&plan=kennel"
              variant="secondary"
              className="mt-7 w-full !bg-canvas !text-ink"
            >
              Probar 15 días gratis
            </Button>
          </div>

          {/* Kennel Pro — próximamente */}
          <div className="relative rounded-[16px] border border-hairline bg-canvas p-6 sm:p-7 flex flex-col opacity-90">
            <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
              Próximamente
            </span>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Kennel Pro</p>
            <p className="mt-3 text-[36px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
              49 € <span className="text-[14px] font-normal text-muted">/ mes</span>
            </p>
            <p className="mt-2 text-[14px] text-body">
              Tu marca, tu web, tu emailbot. Vende mientras duermes. Lo estamos
              abriendo en privado a los primeros 50 criaderos.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] flex-1">
              <PricingRow>Todo lo de Kennel</PricingRow>
              <PricingRow>Web pública con dominio propio</PricingRow>
              <PricingRow>Emailbot multi-modelo (Claude/GPT/Gemini)</PricingRow>
              <PricingRow>Newsletter a tu lista</PricingRow>
              <PricingRow>Pagos online integrados</PricingRow>
              <PricingRow>Precio Founder congelado de por vida (49€)</PricingRow>
            </ul>
            <button
              type="button"
              disabled
              className="mt-7 w-full cursor-not-allowed rounded-xl border border-hairline bg-surface-soft px-5 py-3 text-sm font-bold text-muted"
            >
              Próximamente
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">
              Te avisaremos en cuanto esté disponible.
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-[13px] text-muted">
          Empieza hoy con Kennel (29€/mes, 15 días gratis). Cuando abramos
          Kennel Pro, podrás cambiar de plan desde tu cuenta sin perder datos.
        </p>
      </div>
    </section>
  )
}

function PricingRow({ dark, children }: { dark?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check
        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
          dark ? 'text-[color:var(--brand)]' : 'text-[color:var(--success)]'
        }`}
      />
      <span className={dark ? 'text-on-dark' : 'text-body'}>{children}</span>
    </li>
  )
}

// ─── FAQ ────────────────────────────────────────────────────────────────
function FAQ() {
  const faqs = [
    {
      q: '¿Cómo funciona la prueba de 15 días?',
      a: 'Al elegir Kennel o Kennel Pro pides la prueba con tarjeta (Stripe Checkout). Durante 15 días tienes acceso completo sin coste — puedes usar todas las herramientas y traer tus datos. A los 15 días se hace el primer cargo automático. Si cambias de idea, cancelas desde tu cuenta antes del cargo y no pagas nada. Si la tarjeta falla en el cobro, Stripe la reintenta unos días; si finalmente no se cobra, tu plan vuelve a Free conservando todos tus datos.',
    },
    {
      q: '¿Es realmente gratis el tier Free?',
      a: 'Sí. Hasta 10 perros con ficha completa, genealogía sin límite de generaciones, importación con IA, búsqueda pública, simulador de cruces, calendario reproductivo y vet. Para siempre, sin tarjeta. Solo se cobran las herramientas comerciales en Kennel y Kennel Pro.',
    },
    {
      q: '¿Qué incluye Kennel a 29€/mes?',
      a: 'Todo lo de Free + perros ilimitados, pipeline de reservas con vistas Ventas/Clientes, contratos digitales, pagos a plazos, calendario vet y reproductivo, importador IA sin límite, panel unificado de Contactos (suscriptores + leads + clientes) y estadísticas. Es la base operativa de un criadero profesional.',
    },
    {
      q: '¿Y Kennel Pro a 49€/mes?',
      a: 'Todo lo de Kennel + web pública con dominio propio, emailbot multi-modelo (Claude/GPT/Gemini) que responde leads 24/7, newsletter a tu lista y pagos online integrados. Es Kennel + tu marca activa vendiendo mientras duermes. El precio Founder de 49€ se queda congelado de por vida si entras entre los primeros 50 criaderos.',
    },
    {
      q: '¿Qué pasa si paso de Free a Kennel o Kennel Pro?',
      a: 'Todos tus perros, genealogías y datos se mantienen idénticos. Solo se desbloquean nuevas secciones en el sidebar (Reservas, Contactos, Emailbot, Newsletter, Web). Misma cuenta, mismo dominio.',
    },
    {
      q: '¿Puedo usar mi propio dominio?',
      a: 'Sí, en Kennel Pro. Conectas un dominio propio (criadero.com) desde Ajustes con un par de DNS records. Nuestro middleware sirve tu web directamente, sin subdominios feos ni redirects extra.',
    },
    {
      q: '¿Cómo funciona el emailbot?',
      a: 'Cargas tu biblioteca de conocimiento (precios, política de reserva, garantías, FAQ) — puedes hacerlo escribiendo o importando con IA desde tu web actual o un PDF. El bot lee cada email entrante y responde con tu tono usando tu biblioteca como fuente. Eliges qué modelo (Claude Sonnet, GPT-4o, Gemini Pro, etc.) y revisas antes de enviar — o lo dejas en auto-piloto para preguntas frecuentes.',
    },
    {
      q: '¿Puedo cancelar cuando quiera?',
      a: 'Sí. Sin permanencia, sin penalización. Si cancelas Kennel o Kennel Pro, vuelves a Free conservando todos tus datos. Tu web custom se desactiva pero los datos siguen ahí; si vuelves a un plan de pago más tarde, se reactiva sin tocar nada.',
    },
    {
      q: '¿Y si ya tengo todo en Excel o WhatsApp?',
      a: 'Para genealogías: la importación con IA (URL, foto o PDF) te ahorra horas. Para clientes y leads existentes: importas un CSV o los añades a mano. La primera tarde es de setup; a partir de ahí todo en un sitio y vendes con menos esfuerzo.',
    },
  ]

  return (
    <section id="faq" className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[860px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">07 · FAQ</p>
        <h2
          className="mt-3 font-semibold text-ink"
          style={{ fontSize: 'clamp(26px, 5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
        >
          Las dudas habituales.
        </h2>

        <div className="mt-8 sm:mt-12 divide-y divide-hairline">
          {faqs.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="py-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-4 sm:gap-6 text-left"
      >
        <span className="text-[15px] sm:text-[16px] font-semibold text-ink" style={{ letterSpacing: '-0.01em' }}>
          {q}
        </span>
        {open ? (
          <Minus className="h-4 w-4 flex-shrink-0 text-muted" />
        ) : (
          <Plus className="h-4 w-4 flex-shrink-0 text-muted" />
        )}
      </button>
      {open && <p className="mt-3 max-w-[68ch] text-[15px] leading-[1.6] text-body">{a}</p>}
    </div>
  )
}

// ─── Final CTA ───────────────────────────────────────────────────────────
function FinalCta() {
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 text-center sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <h2
          className="mx-auto max-w-[18ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(30px, 6vw, 72px)', lineHeight: 1.02, letterSpacing: '-0.035em' }}
        >
          Tu próxima camada se reserva sola.
        </h2>
        <p className="mx-auto mt-5 sm:mt-6 max-w-[480px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
          Genealogía verificable + criadero profesional + IA. En una sola cuenta.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button href="/register?intent=breeder&plan=free" variant="primary" size="lg">
            Empieza gratis <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/register?intent=breeder&plan=kennel" variant="secondary" size="lg">
            Probar Kennel 15 días gratis
          </Button>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-surface-dark text-on-dark">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Wordmark size="text-2xl" className="!text-white" asLink={false} />
            <p className="mt-3 max-w-[280px] text-[13px] leading-[1.55] text-on-dark-soft">
              El registro público mundial de perros con genealogía verificable.
            </p>
          </div>
          <FooterCol
            title="Producto"
            links={[
              { label: 'Para criadores', href: '#criadores' },
              { label: 'Precios', href: '/pricing' },
              { label: 'Buscar perros', href: '/search' },
              { label: 'Directorio criaderos', href: '/kennels' },
              { label: 'Blog', href: '/blog' },
              { label: 'API pública', href: '/api-docs' },
            ]}
          />
          <FooterCol
            title="Cuenta"
            links={[
              { label: 'Iniciar sesión', href: '/login' },
              { label: 'Empezar gratis', href: '/register?intent=breeder&plan=free' },
              { label: 'Empezar Kennel', href: '/register?intent=breeder&plan=kennel' },
              { label: 'Recuperar contraseña', href: '/forgot-password' },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: 'Términos', href: '/terms' },
              { label: 'Privacidad', href: '/privacy' },
              { label: 'Cookies', href: '/legal' },
              { label: 'Contacto', href: 'mailto:hola@genealogic.io' },
            ]}
          />
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-[12px] text-on-dark-soft sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Genealogic · Hecho en España</span>
          <span>Diseñado con cariño para criadores serios</span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white">{title}</p>
      <ul className="mt-4 space-y-2.5 text-[13.5px] text-on-dark-soft">
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} className="transition hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Shared atoms ────────────────────────────────────────────────────────
function MiniFeature({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  color: 'brand' | 'violet' | 'emerald'
}) {
  const map: Record<string, string> = {
    brand: 'var(--brand)',
    violet: 'var(--badge-violet)',
    emerald: 'var(--badge-emerald)',
  }
  return (
    <div className="rounded-[12px] border border-hairline bg-canvas p-6 sm:p-7">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ background: `${map[color]}20`, color: map[color] }}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-[18px] font-semibold text-ink" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.55] text-body">{desc}</p>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  color: 'brand' | 'pink' | 'blue' | 'violet' | 'orange' | 'emerald'
}) {
  const map: Record<string, string> = {
    brand: 'var(--brand)',
    pink: 'var(--badge-pink)',
    blue: 'var(--male)',
    violet: 'var(--badge-violet)',
    orange: 'var(--badge-orange)',
    emerald: 'var(--badge-emerald)',
  }
  return (
    <div className="rounded-[12px] border border-hairline bg-canvas p-6 sm:p-7 transition hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ background: `${map[color]}1a`, color: map[color] }}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-[18px] font-semibold text-ink" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.55] text-body">{desc}</p>
    </div>
  )
}

function BulletRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--success)]" />
      <span className="text-[14.5px] text-body">{text}</span>
    </div>
  )
}
