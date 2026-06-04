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
import { useT } from '@/components/i18n/locale-provider'

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
  const t = useT()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4 sm:px-6 lg:px-12">
          <Wordmark size="text-xl" />

          {/* Desktop nav inline */}
          <nav className="hidden flex-1 items-center justify-center gap-7 text-[14px] text-body md:flex">
            <a href="#producto" className="transition hover:text-ink">{t('Producto')}</a>
            <a href="#criadores" className="transition hover:text-ink">{t('Para criadores')}</a>
            <a href="#precios" className="transition hover:text-ink">{t('Precios')}</a>
            <Link href="/blog" className="transition hover:text-ink">{t('Blog')}</Link>
            <a href="#faq" className="transition hover:text-ink">{t('FAQ')}</a>
          </nav>

          {/* Desktop CTAs */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Button href="/login" variant="ghost" size="sm">
              {t('Iniciar sesión')}
            </Button>
            <Button href="/register?intent=breeder&plan=free" variant="primary" size="sm">
              {t('Empezar gratis')}
            </Button>
          </div>

          {/* Mobile hamburguesa */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={t('Abrir menú')}
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
  const t = useT()
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
            aria-label={t('Cerrar menú')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-surface-card transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CTAs principales arriba del todo */}
        <div className="px-5 py-4 border-b border-hairline space-y-2 flex-shrink-0">
          <Button href="/register?intent=breeder&plan=free" variant="primary" size="md" className="w-full">
            {t('Empezar gratis')}
          </Button>
          <Button href="/login" variant="secondary" size="md" className="w-full">
            <User className="h-4 w-4" />
            {t('Iniciar sesión')}
          </Button>
        </div>

        {/* Navegación scrollable */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          <DrawerSection label={t('Explorar')}>
            <DrawerLink href="/search" icon={Search} onClick={onClose}>
              {t('Buscar perros')}
            </DrawerLink>
            <DrawerLink href="/kennels" icon={Dog} onClick={onClose}>
              {t('Directorio de criaderos')}
            </DrawerLink>
            <DrawerLink href="/blog" icon={GitBranch} onClick={onClose}>
              {t('Blog')}
            </DrawerLink>
          </DrawerSection>

          <DrawerSection label={t('Producto')}>
            <DrawerAnchor href="#producto" onClick={onClose}>{t('Genealogía pública')}</DrawerAnchor>
            <DrawerAnchor href="#criadores" onClick={onClose}>{t('Para criadores')}</DrawerAnchor>
            <DrawerAnchor href="#precios" onClick={onClose}>{t('Precios')}</DrawerAnchor>
            <DrawerAnchor href="#faq" onClick={onClose}>{t('FAQ')}</DrawerAnchor>
            <DrawerLink href="/api-docs" icon={Zap} onClick={onClose}>
              {t('API pública')}
            </DrawerLink>
          </DrawerSection>
        </nav>

        {/* Footer drawer */}
        <div className="border-t border-hairline px-5 py-3 flex-shrink-0">
          <p className="text-[11px] text-muted">
            {t('¿Dudas?')}{' '}
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
  const t = useT()
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
              {t('Empieza gratis · sin tarjeta')}
            </div>

            {/* Headline */}
            <h1
              className="mt-5 sm:mt-7 max-w-[16ch] font-semibold text-ink"
              style={{ fontSize: 'clamp(32px, 6vw, 68px)', lineHeight: 1.02, letterSpacing: '-0.04em' }}
            >
              {t('Gestiona tu criadero. Vende más cachorros.')}
            </h1>
            <p className="mt-5 sm:mt-6 max-w-[520px] text-[16px] leading-[1.55] text-body sm:text-[18px]">
              {t('El panel donde llevas tus perros, camadas, genealogías, reservas y clientes de cabo a rabo. Se acabaron los Excels: más orden, mejor control de la cría y un escaparate que vende. Gratis para empezar.')}
            </p>

            {/* CTAs */}
            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3">
              <Button href="/register?intent=breeder&plan=free" variant="primary" size="lg">
                {t('Empieza gratis')} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/features" variant="secondary" size="lg">
                {t('Explora el producto al detalle')} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 text-[13px] text-muted">
              {t('Sin tarjeta · 1.366 perros y 148 criaderos ya en el registro')}
            </p>
          </div>

          {/* Right: app-window mockup with real SearchBar */}
          <div className="relative">
            <AppWindow url="genealogic.io/buscar">
              <div className="px-5 py-6 sm:px-8 sm:py-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                  {t('Registro público')}
                </p>
                <h3
                  className="mt-1.5 font-semibold text-ink"
                  style={{ fontSize: 'clamp(20px, 2.4vw, 26px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
                >
                  {t('Buscar en el registro')}
                </h3>
                <div className="mt-5 text-left">
                  <SearchBar />
                </div>

                {/* Featured dogs row — real data */}
                {heroDogs.length > 0 && (
                  <div className="mt-6">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">
                      {t('Publicados recientemente')}
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
                        {t('Ver todos →')}
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
  const t = useT()
  return (
    <section id="producto" className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          {t('01 · Profesionalidad')}
        </p>
        <div className="mt-3 grid gap-6 sm:gap-12 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2
            className="max-w-[20ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            {t('Genealogías que generan confianza, no dudas.')}
          </h2>
          <p className="max-w-[460px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
            {t('Cada perro con árbol genealógico ilimitado, datos sanitarios, registro y trazabilidad real: verificada, no autodeclarada. Tus compradores ven el trabajo serio que hay detrás. Importa genealogías existentes en segundos con IA y compártelas con un link.')}
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
            title={t('Genealogía real')}
            desc={t('Generaciones ilimitadas, fotos, registros, salud. No autodeclarado: trazable.')}
            color="brand"
          />
          <MiniFeature
            icon={<Sparkles className="h-5 w-5" />}
            title={t('Importa con IA')}
            desc={t('Foto de una genealogía → árbol completo en segundos. Claude lo entiende.')}
            color="violet"
          />
          <MiniFeature
            icon={<Globe className="h-5 w-5" />}
            title={t('Te encuentran en Google')}
            desc={t('Tus perros y tu criadero posicionan en Google. Más visibilidad, más consultas, sin pagar anuncios.')}
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
  const t = useT()
  const dogs: Array<{ name: string; sex: 'male' | 'female'; reg?: string }> = [
    { name: 'Lord Byron de Aldenham', sex: 'male', reg: 'LOE 2189437' }, // root
    { name: 'Ch. Whiskey de Aldenham', sex: 'male' },                    // father
    { name: 'Hazel de Aldenham', sex: 'female' },                        // mother
    { name: 'Reginald del Támesis', sex: 'male' },                       // FF
    { name: 'Penny de Surrey', sex: 'female' },                          // FM
    { name: 'Bandit du Lac', sex: 'male' },                              // MF
    { name: 'Honey de Vendée', sex: 'female' },                          // MM
  ]
  const breed = t('Cocker Spaniel Inglés')

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
          {t('Árbol genealógico')}
        </div>
        <span className="rounded-full bg-surface-card px-2.5 py-1 text-[11px] font-medium text-body">
          {t('3 generaciones · ilimitadas disponibles')}
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
          {t('Verificable · trazable · público')}
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--male)' }} />
            {t('Macho')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--female)' }} />
            {t('Hembra')}
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
  const t = useT()
  return (
    <section id="criadores" className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          {t('02 · Orden, control y ventas')}
        </p>
        <div className="mt-3 grid gap-6 sm:gap-12 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2
            className="max-w-[20ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            {t('Tu criadero entero bajo control, en un panel.')}
          </h2>
          <p className="max-w-[460px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
            {t('Planifica cruces sin consanguinidad, no pierdas un solo lead, cobra señas y entregas, y deja que un emailbot responda por ti. Las herramientas que hacen tu criadero más profesional y te ahorran horas cada semana.')}
          </p>
        </div>

        <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<KanbanSquare className="h-5 w-5" />}
            title={t('Más ventas, cero leads perdidos')}
            desc={t('Pipeline de reservas con vistas Ventas y Clientes. Cada interesado avanza de estado con un click, con su conversación y sus acciones. No más Excel.')}
            color="brand"
          />
          <FeatureCard
            icon={<GitBranch className="h-5 w-5" />}
            title={t('Control total de la cría')}
            desc={t('COI calculado para planificar cruces sin consanguinidad, genotipos, simulador con predicción de color y calendario de celos y partos.')}
            color="emerald"
          />
          <FeatureCard
            icon={<Heart className="h-5 w-5" />}
            title={t('Todos tus clientes en orden')}
            desc={t('Hub de contactos: suscriptores, leads sin cerrar y clientes con reserva, cada uno con su historial completo. Contratos y pagos integrados.')}
            color="pink"
          />
          <FeatureCard
            icon={<Globe className="h-5 w-5" />}
            title={t('Tu escaparate que vende')}
            desc={t('Web pública con tu propio dominio. Editor visual + 3 temas. Un escaparate serio que posiciona en Google y vende por ti.')}
            color="blue"
          />
          <FeatureCard
            icon={<Mail className="h-5 w-5" />}
            title={t('Emailbot que responde 24/7')}
            desc={t('Lee tu biblioteca y responde a tus leads con tu tono, de día y de noche. Tú revisas y envías, o lo dejas en auto-piloto.')}
            color="violet"
          />
          <FeatureCard
            icon={<Calendar className="h-5 w-5" />}
            title={t('Newsletter que fideliza')}
            desc={t('4 audiencias auto-calculadas: todos, clientes, leads y los que recibieron cachorro. Mantén tu lista caliente sin esfuerzo.')}
            color="orange"
          />
        </div>

        {/* CTA a la página de features completa */}
        <div className="mt-10 sm:mt-14 flex flex-wrap items-center gap-4">
          <Button href="/features" variant="primary" size="lg">
            {t('Ver todo lo que incluye')} <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-[14px] text-muted">
            {t('Más de 30 herramientas para gestionar tu criadero de cabo a rabo.')}
          </p>
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
  const t = useT()
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
          {t('03 · Más ventas')}
        </p>
        <h2
          className="mt-3 max-w-[24ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          {t('Tu próxima camada se reserva sola.')}
        </h2>
        <p className="mt-5 sm:mt-6 max-w-[600px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
          {t('Un CRM hecho para criadores: ningún interesado se queda en visto. Cada lead con su estado (interesado, seña, asignado, contrato, entregado). Cambias estado con un click. Vistas separadas')}{' '}
          <strong>{t('Ventas')}</strong>{' '}
          {t('(leads abiertos) y')} <strong>{t('Clientes')}</strong> {t('(reservas cerradas). Panel lateral con detalle, conversación y acciones.')}
        </p>

        {/* Demo banner */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[color:var(--brand)]/30 bg-[color:var(--brand-soft)] px-3 py-1 text-[12px] font-medium text-[color:var(--brand)]">
          <Zap className="h-3 w-3" />
          {t('Demo interactiva — toca lo que quieras')}
          {demoTouched && (
            <button
              onClick={resetDemo}
              className="ml-2 inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[10px] font-semibold text-ink transition hover:opacity-80"
            >
              {t('Reset')}
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
                  {t('Ventas')}
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
                  {t('Clientes')}
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
                  label={t('Todas')}
                  count={leadsInView.length}
                  active={filter === 'all'}
                  onClick={() => setFilter('all')}
                />
                {viewStatuses.map((s) => (
                  <FilterChip
                    key={s}
                    label={t(STATUS_LABEL[s])}
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
                      <th className="px-3 py-2 text-left font-semibold">{t('Solicitante')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('Estado')}</th>
                      <th className="px-3 py-2 text-left font-semibold hidden sm:table-cell">{t('Preferencia')}</th>
                      <th className="px-3 py-2 text-right font-semibold hidden md:table-cell">{t('Recibida')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-soft">
                    {visible.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-12 text-center text-[12px] text-muted">
                          {t('Ningún lead en este filtro.')}
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
                {t('Tip: cambia el estado de cualquier fila. Si pasa a Asignado o más, el lead se mueve a la vista Clientes.')}
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
  const t = useT()
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
              {t(STATUS_LABEL[s])}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2.5 text-muted hidden sm:table-cell">{t(lead.pref)}</td>
      <td className="px-3 py-2.5 text-right text-[11px] text-muted tabular-nums hidden md:table-cell">
        {lead.date}
      </td>
    </tr>
  )
}

// ─── Bot conversation ────────────────────────────────────────────────────
function BotConversation() {
  const t = useT()
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
              {t('04 · Atención 24/7')}
            </p>
            <h2
              className="mt-3 font-semibold text-ink"
              style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
            >
              {t('Habla con tus compradores incluso cuando duermes.')}
            </h2>
            <p className="mt-5 sm:mt-6 text-[16px] leading-[1.55] text-body sm:text-[17px]">
              {t('Conectas tu email del criadero. El bot lee, redacta una respuesta con tu tono usando tu biblioteca de conocimiento. Tú revisas y envías. O lo dejas en auto-piloto para preguntas frecuentes.')}
            </p>
            <div className="mt-6 sm:mt-8 space-y-3">
              <BulletRow text={t('Lee tu biblioteca: precios, contratos, certificados, salud')} />
              <BulletRow text={t('Responde con tu tono, no con el de ChatGPT')} />
              <BulletRow text={t('Tú decides si auto-envía o si revisas antes')} />
            </div>
          </div>

          <AppWindow title={`hola@tucriadero.com · ${t('Hilo 142')}`}>
            <div className="space-y-3 p-4 sm:p-7">
              <ChatBubble side="left">
                {t('Hola, ¿tendréis camadas previstas para primavera? Estaba interesado en un macho con padres con certificados de cadera.')}
              </ChatBubble>
              <ChatBubble side="right" bot>
                {t('¡Hola! Sí, esperamos camada de Estrella x Tornado para marzo. Ambos con HD-A oficial y prueba de carácter. Te paso enlace al perfil de los padres y el contrato de reserva (seña 300 €).')}
              </ChatBubble>
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-hairline bg-surface-soft p-2.5 text-[11.5px] text-muted">
                <Zap className="h-3.5 w-3.5 text-[color:var(--brand)]" />
                <span>
                  {t('Bot · usa biblioteca')} <span className="font-mono text-ink">{t('contratos.md')}</span>{' '}
                  + <span className="font-mono text-ink">{t('salud-padres.md')}</span>
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
  const t = useT()
  return (
    <section className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          {t('05 · Ahorra tiempo')}
        </p>
        <h2
          className="mt-3 max-w-[18ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          {t('De cero a operando en un fin de semana.')}
        </h2>

        <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Step n="1" duration={t('30 min')} title={t('Crea tu cuenta')}>
            {t('Registro gratis. Configura tu criadero, afijo y datos básicos. Sin tarjeta.')}
          </Step>
          <Step n="2" duration={t('1 hora')} title={t('Importa tus perros')}>
            {t('Sube fotos de genealogías existentes. La IA extrae el árbol entero en segundos.')}
          </Step>
          <Step n="3" duration={t('1 día')} title={t('Diseña tu web')}>
            {t('Editor visual. 8 páginas troncales, 36 secciones. Conecta tu dominio.')}
          </Step>
          <Step n="4" duration={t('Day 1')} title={t('Empieza a vender')}>
            {t('Activa pipeline de reservas y emailbot. Tu próxima consulta entra al CRM.')}
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
// Landing de CRIADOR: solo planes de criadero (Kennel Free / Kennel Pro /
// Kennel Enterprise). El plan Owner (propietario particular) vive en /pricing,
// no aquí. Modelo cerrado 2026-05-28 (memory/genealogic_pricing_model.md).
function Pricing() {
  const t = useT()
  return (
    <section id="precios" className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          {t('06 · Precios')}
        </p>
        <h2
          className="mt-3 max-w-[18ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          {t('Empieza gratis. Sube cuando crezcas.')}
        </h2>
        <p className="mt-5 sm:mt-6 max-w-[560px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
          {t('La genealogía es siempre completa, sin límite de generaciones, en todos los planes. La diferencia son las herramientas: Kennel Free es gratis para siempre y sin tarjeta; Kennel Pro y Kennel Enterprise añaden el control de la cría, las ventas y el escaparate profesional.')}
        </p>

        <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Kennel Free */}
          <div className="rounded-[16px] border border-hairline bg-gradient-to-br from-emerald-50 via-canvas to-green-50 p-6 flex flex-col">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-emerald-600">Kennel Free</p>
            <p className="mt-3 text-[32px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
              0 € <span className="text-[13px] font-normal text-muted">/ {t('siempre')}</span>
            </p>
            <p className="mt-1 text-[13px] text-body">{t('Perros ilimitados · Criador casero')}</p>
            <ul className="mt-5 space-y-2 text-[13.5px] flex-1">
              <PricingRow>{t('Camadas + calendario')}</PricingRow>
              <PricingRow>{t('Pipeline reservas')}</PricingRow>
              <PricingRow>{t('Contratos + firma')}</PricingRow>
              <PricingRow>{t('CRM clientes')}</PricingRow>
            </ul>
            <Button href="/register?intent=breeder&plan=free" variant="secondary" className="mt-6 w-full">
              {t('Empezar gratis')}
            </Button>
          </div>

          {/* Kennel Pro (highlighted) */}
          <div className="relative rounded-[16px] border-2 bg-gradient-to-br from-orange-50 via-canvas to-amber-50 p-6 flex flex-col shadow-[0_12px_48px_rgba(254,102,32,0.15)]" style={{ borderColor: '#FE6620' }}>
            <span className="absolute -top-3 left-5 rounded-full bg-[#FE6620] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {t('Más popular')}
            </span>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#FE6620]">Kennel Pro</p>
            <p className="mt-3 text-[32px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
              49 € <span className="text-[13px] font-normal text-muted">/ {t('mes')}</span>
            </p>
            <p className="mt-1 text-[13px] text-body">{t('Ilimitado · Criadero profesional')}</p>
            <ul className="mt-5 space-y-2 text-[13.5px] flex-1">
              <PricingRow>{t('Perros ilimitados')}</PricingRow>
              <PricingRow>{t('COI + simulador de cruces')}</PricingRow>
              <PricingRow>{t('Genotipos completos')}</PricingRow>
              <PricingRow>{t('Pagos Stripe Connect')}</PricingRow>
              <PricingRow>{t('Soporte prioritario <24h')}</PricingRow>
            </ul>
            <Button
              href="/register?intent=breeder&plan=pro"
              variant="primary"
              className="mt-6 w-full"
            >
              {t('Probar 14 días gratis')}
            </Button>
          </div>

          {/* Kennel Enterprise */}
          <div className="rounded-[16px] border border-hairline bg-gradient-to-br from-violet-50 via-canvas to-purple-50 p-6 flex flex-col">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-violet-600">Kennel Enterprise</p>
            <p className="mt-3 text-[32px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
              149 € <span className="text-[13px] font-normal text-muted">/ {t('mes')}</span>
            </p>
            <p className="mt-1 text-[13px] text-body">{t('Ilimitado · Escaparate público')}</p>
            <ul className="mt-5 space-y-2 text-[13.5px] flex-1">
              <PricingRow>{t('Web con tu dominio')}</PricingRow>
              <PricingRow>{t('Multi-idioma (ES/EN/IT/FR)')}</PricingRow>
              <PricingRow>{t('Emailbot IA + newsletter')}</PricingRow>
              <PricingRow>{t('API + integraciones')}</PricingRow>
            </ul>
            <a
              href="mailto:hola@genealogic.io?subject=Kennel%20Enterprise"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl border-2 px-5 py-3 text-sm font-bold transition hover:bg-canvas/50"
              style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}
            >
              {t('Hablar con soporte')}
            </a>
            <p className="mt-2 text-center text-[11px] text-muted">{t('Activación manual mientras testeamos.')}</p>
          </div>
        </div>

        <p className="mt-10 text-center text-[13px] text-muted">
          {t('Pro y Enterprise se prueban 14 días sin tarjeta. Si no actualizas método de pago, vuelves automáticamente a Free sin perder datos.')}
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
  const t = useT()
  const faqs = [
    {
      q: t('¿Cómo funciona la prueba de 14 días de Kennel Pro?'),
      a: t('Te das de alta sin tarjeta. Durante 14 días tienes acceso completo a Pro (COI, simulador, genotipos, Stripe). El día 13 te avisamos por email. El día 14 te pedimos tarjeta para seguir. Si no pagas, vuelves automáticamente a Kennel Free conservando todos tus datos.'),
    },
    {
      q: t('¿Owner vs Kennel Free — cuál elijo?'),
      a: t('Owner es para propietarios particulares que documentan a sus perros (su mascota o las que han tenido a lo largo de la vida). Kennel Free es para el criador casero o aficionado que ya maneja camadas, reservas, contratos y CRM de clientes. Ambos son gratis para siempre y con perros ilimitados — la diferencia son las herramientas de criadero.'),
    },
    {
      q: t('¿Qué incluye Kennel Pro a 49€/mes?'),
      a: t('Todo Kennel Free + COI Wright explicado (lista de ancestros duplicados, comparativa con la raza), simulador de cruces con COI proyectado y predicción de color por genotipos, pagos integrados con Stripe Connect (cobras señas y entregas), registro de visitas al criadero y soporte prioritario en menos de 24 horas.'),
    },
    {
      q: t('¿Y Kennel Enterprise a 149€/mes?'),
      a: t('Todo Kennel Pro + web pública del criadero con dominio propio, blog SEO, multi-idioma (ES/EN/IT/FR), emailbot con IA que responde a leads 24/7, newsletter integrada, multi-usuario para equipo, white-label, API REST e integraciones (Zapier). De momento se activa manualmente tras hablar con soporte (hola@genealogic.io) mientras testeamos el chatbot y la web — pasaremos a auto-servicio en próximas semanas.'),
    },
    {
      q: t('¿Qué pasa si paso de plan?'),
      a: t('Todos tus perros, genealogías y datos se mantienen idénticos. Solo se desbloquean nuevas secciones (COI completo en Pro, web del criadero en Enterprise...). Misma cuenta, misma URL pública.'),
    },
    {
      q: t('¿Puedo usar mi propio dominio?'),
      a: t('Sí, en Kennel Enterprise. Conectas un dominio propio (criadero.com) desde Ajustes con un par de DNS records. Nuestro middleware sirve tu web directamente, sin subdominios feos ni redirects extra.'),
    },
    {
      q: t('¿Puedo cancelar cuando quiera?'),
      a: t('Sí. Sin permanencia, sin penalización. Si cancelas Kennel Pro o Enterprise, vuelves a Kennel Free conservando todos tus datos. Si subes de plan, el cobro es prorrateado.'),
    },
    {
      q: t('¿Y si ya tengo todo en Excel o WhatsApp?'),
      a: t('Para genealogías: la importación con IA (URL de Dogsfiles/Presadb/K9data, foto o PDF) te ahorra horas. Para clientes y leads existentes: importas un CSV o los añades a mano. La primera tarde es de setup; a partir de ahí todo en un sitio.'),
    },
  ]

  return (
    <section id="faq" className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[860px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">{t('07 · FAQ')}</p>
        <h2
          className="mt-3 font-semibold text-ink"
          style={{ fontSize: 'clamp(26px, 5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
        >
          {t('Las dudas habituales.')}
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
  const t = useT()
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 text-center sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <h2
          className="mx-auto max-w-[18ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(30px, 6vw, 72px)', lineHeight: 1.02, letterSpacing: '-0.035em' }}
        >
          {t('Tu próxima camada se reserva sola.')}
        </h2>
        <p className="mx-auto mt-5 sm:mt-6 max-w-[480px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
          {t('Genealogía verificable + criadero profesional + IA. En una sola cuenta.')}
        </p>
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button href="/register?intent=breeder&plan=free" variant="primary" size="lg">
            {t('Empieza gratis')} <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/register?intent=breeder&plan=pro" variant="secondary" size="lg">
            {t('Probar Kennel Pro 14 días gratis')}
          </Button>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────
function Footer() {
  const t = useT()
  return (
    <footer className="bg-surface-dark text-on-dark">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Wordmark size="text-2xl" className="!text-white" asLink={false} />
            <p className="mt-3 max-w-[280px] text-[13px] leading-[1.55] text-on-dark-soft">
              {t('El registro público mundial de perros con genealogía verificable.')}
            </p>
          </div>
          <FooterCol
            title={t('Producto')}
            links={[
              { label: t('Para criadores'), href: '#criadores' },
              { label: t('Precios'), href: '/pricing' },
              { label: t('Buscar perros'), href: '/search' },
              { label: t('Directorio criaderos'), href: '/kennels' },
              { label: t('Blog'), href: '/blog' },
              { label: t('API pública'), href: '/api-docs' },
            ]}
          />
          <FooterCol
            title={t('Cuenta')}
            links={[
              { label: t('Iniciar sesión'), href: '/login' },
              { label: t('Empezar gratis'), href: '/register?intent=breeder&plan=free' },
              { label: t('Empezar Kennel'), href: '/register?intent=breeder&plan=kennel' },
              { label: t('Recuperar contraseña'), href: '/forgot-password' },
            ]}
          />
          <FooterCol
            title={t('Legal')}
            links={[
              { label: t('Aviso legal'), href: '/legal' },
              { label: t('Términos y condiciones'), href: '/terms' },
              { label: t('Privacidad'), href: '/privacy' },
              { label: t('Cookies'), href: '/cookies' },
              { label: t('Propiedad intelectual'), href: '/ip-policy' },
              { label: t('Reportar contenido'), href: 'mailto:hola@genealogic.io?subject=Reporte%20de%20contenido' },
            ]}
          />
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-[12px] text-on-dark-soft sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} <strong className="font-medium text-white/90">Manuel Curtó SL</strong> · B56932098 · {t('Tenerife, España')}</span>
          <span>{t('La genealogía de tu perro, donde tiene que estar.')}</span>
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
