'use client'

import Link from 'next/link'
import { Img } from '@/components/ui/img'
import {
  ArrowRight,
  GitBranch,
  Sparkles,
  Globe,
  Check,
  Plus,
  Minus,
  Dog,
  Calendar,
  ShieldCheck,
  Lock,
  Menu,
  X,
  User,
  Search,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'
import { useT } from '@/components/i18n/locale-provider'

interface Props {
  breeds: { id: string; name: string }[]
  featuredDogs: any[]
  cockerPhotos?: string[]
  counts?: { dogs: number; kennels: number }
}

export default function LandingPage({ breeds, featuredDogs, cockerPhotos = [], counts }: Props) {
  // Fotos REALES de perros de Genealogic para el mockup de genealogía.
  // Priorizamos perros reales sobre el stock externo de dog.ceo (cockerPhotos),
  // que solo queda como fallback defensivo si no hay perros con foto.
  const realPhotos: string[] = featuredDogs
    .map((d: any) => d?.thumbnail_url)
    .filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)

  return (
    <main className="min-h-screen bg-canvas text-ink">
      {/* Header eliminado — lo aporta (public)/layout.tsx con MarketingHeader. */}
      <Hero featuredDogs={featuredDogs} counts={counts} />
      <PedigreeShowcase realPhotos={realPhotos} cockerPhotos={cockerPhotos} />
      <FeaturesGrid />
      <KennelShowcase featuredDogs={featuredDogs} />
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
function Hero({ featuredDogs, counts }: { featuredDogs: any[]; counts?: { dogs: number; kennels: number } }) {
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
              {t('Tu criadero, con perfil público que te encuentran en Google.')}
            </h1>
            <p className="mt-5 sm:mt-6 max-w-[520px] text-[16px] leading-[1.55] text-body sm:text-[18px]">
              {t('Tu escaparate con tus reproductores y los perros que has criado, cada uno con su genealogía. Importa genealogías con IA en segundos, lleva tus camadas y la salud al día —todo sobre la mayor red de genealogías del mundo. Gratis.')}
            </p>

            {/* CTAs */}
            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3">
              <Button href="/register?intent=breeder&plan=free" variant="primary" size="lg">
                {t('Crea tu criadero gratis')} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/features" variant="secondary" size="lg">
                {t('Explora el producto al detalle')} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 text-[13px] text-muted">
              {t('Sin tarjeta ·')} {(counts?.dogs ?? 257807).toLocaleString('es-ES')} {t('perros y')} {(counts?.kennels ?? 6722).toLocaleString('es-ES')} {t('criaderos ya en el registro')}
            </p>
          </div>

          {/* Right: mockup de criador — perfil público indexable del criadero
              (escaparate con reproductores + producidos). Es valor DISPONIBLE
              desde el día 1; sustituye al antiguo planificador de cruces (COI),
              que aún no está lanzado. */}
          <div className="relative">
            <KennelShowcaseMockup featuredDogs={featuredDogs} />
            {/* Floating accent dot (clip-safe dentro del overflow-hidden del hero) */}
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
function PedigreeShowcase({ realPhotos, cockerPhotos }: { realPhotos: string[]; cockerPhotos: string[] }) {
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
            <RealPedigreeMockup realPhotos={realPhotos} cockerPhotos={cockerPhotos} />
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
function RealPedigreeMockup({ realPhotos, cockerPhotos }: { realPhotos: string[]; cockerPhotos: string[] }) {
  const t = useT()
  // Fotos de los nodos del árbol: SIEMPRE perros reales de Genealogic
  // (featuredDogs.thumbnail_url). Si faltan para rellenar los 7 nodos,
  // se ciclan. El stock externo de cocker (dog.ceo) solo entra como
  // fallback defensivo si no llega ninguna foto real.
  const photoPool = realPhotos.length > 0 ? realPhotos : cockerPhotos
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
              photo={photoPool.length > 0 ? photoPool[i % photoPool.length] : undefined}
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

// ─── Features grid ───────────────────────────────────────────────────────
// Fase 1 ("carta reducida"): solo vendemos lo LANZADO (genealogías + IA,
// camadas + salud, perfil público indexable). Las herramientas construidas
// pero aún no lanzadas (cruces/COI, CRM de reservas, web propia, newsletter,
// emailbot, contratos) se insinúan en un único bloque "Llegando pronto" —
// nombres, sin mockups ni detalle. Cuando se lanza una, se mueve aquí arriba.
function FeaturesGrid() {
  const t = useT()
  return (
    <section id="criadores" className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          {t('02 · Tu criadero, en orden')}
        </p>
        <div className="mt-3 grid gap-6 sm:gap-12 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2
            className="max-w-[20ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            {t('Todo tu criadero, en un panel. Gratis.')}
          </h2>
          <p className="max-w-[460px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
            {t('Registra tus perros con su genealogía, impórtalas con IA en segundos, lleva tus camadas y la salud al día, y enséñalo todo en tu perfil público indexable. Las herramientas que profesionalizan tu criadero — sin coste.')}
          </p>
        </div>

        <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title={t('Genealogías con IA')}
            desc={t('Cada perro con su árbol genealógico ilimitado, fotos, registro y salud. Importa genealogías existentes con IA en segundos: pega una URL o sube una foto y tienes el árbol completo.')}
            color="violet"
          />
          <FeatureCard
            icon={<Globe className="h-5 w-5" />}
            title={t('Perfil público que te encuentran')}
            desc={t('Tu escaparate gratis desde el día 1: reproductores y perros producidos, cada uno con su genealogía. Posiciona en Google y genera consultas, sin pagar anuncios.')}
            color="emerald"
          />
          <FeatureCard
            icon={<Calendar className="h-5 w-5" />}
            title={t('Camadas y salud al día')}
            desc={t('Calendario de celos y partos, camadas con un click (los cachorros heredan padres y afijo), cartilla sanitaria con recordatorios de vacunas y desparasitación, y el peso de cada cachorro.')}
            color="brand"
          />
        </div>

        {/* CTA a la página de features completa */}
        <div className="mt-10 sm:mt-14 flex flex-wrap items-center gap-4">
          <Button href="/features" variant="primary" size="lg">
            {t('Ver todo lo que incluye')} <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-[14px] text-muted">
            {t('Todo gratis para empezar. Y vamos soltando herramientas nuevas de una en una.')}
          </p>
        </div>

        {/* Llegando pronto — herramientas construidas que iremos lanzando.
            Solo nombres + una línea, sin mockups ni detalle (mismo espíritu
            que el teaser de /features). */}
        <div className="mt-12 sm:mt-16 border-t border-hairline pt-10 sm:pt-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand)]">
            {t('Llegando pronto')}
          </p>
          <h3 className="mt-2 max-w-2xl text-[22px] sm:text-[28px] font-semibold leading-[1.2] tracking-[-0.03em] text-ink">
            {t('Vamos soltando herramientas nuevas de una en una.')}
          </h3>
          <p className="mt-3 max-w-2xl text-[14px] sm:text-[15px] leading-[1.6] text-body">
            {t('Estas piezas ya están en camino. Te avisaremos por email en cuanto cada una esté lista — sin coste extra mientras siga todo gratis.')}
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ComingSoonRow title={t('Planificador de cruces')} desc={t('Simula el COI de la camada antes de criar.')} />
            <ComingSoonRow title={t('Genotipos y DNA')} desc={t('Predicción de color y pruebas raciales.')} />
            <ComingSoonRow title={t('CRM de reservas')} desc={t('Pipeline de leads y clientes, sin Excel.')} />
            <ComingSoonRow title={t('Contratos')} desc={t('Plantillas con firma electrónica.')} />
            <ComingSoonRow title={t('Web del criadero')} desc={t('Tu web pública con dominio propio.')} />
            <ComingSoonRow title={t('Newsletter y emailbot')} desc={t('Campañas y asistente IA para tus leads.')} />
          </ul>
        </div>
      </div>
    </section>
  )
}

// Fila compacta para el bloque "Llegando pronto": nombre + una línea, con
// chip "Próximamente". Sin mockups ni CTA (no es vendible aún).
function ComingSoonRow({ title, desc }: { title: string; desc: string }) {
  const t = useT()
  return (
    <li className="rounded-[12px] border border-hairline bg-canvas/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[14.5px] font-semibold text-ink">{title}</span>
        <span className="inline-flex items-center rounded-full border border-hairline bg-surface-soft px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em] text-muted">
          {t('Próximamente')}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] leading-[1.5] text-muted">{desc}</p>
    </li>
  )
}

// ─── Kennel showcase (perfil público del criadero) ───────────────────────
// Reemplaza la sección del emailbot (aún no shippeado). Muestra el perfil
// público GRATUITO: reproductores + perros producidos, cada uno con su
// genealogía. El motor de reputación del criador.
function KennelDogCard({ dog, sex, fallbackName }: { dog: any; sex: '♂' | '♀'; fallbackName: string }) {
  const sexColor = sex === '♂' ? 'var(--male)' : 'var(--badge-pink)'
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
      <div className="aspect-square w-full bg-surface-soft">
        {dog?.thumbnail_url ? (
          <Img src={dog.thumbnail_url} w={200} alt={dog?.name || fallbackName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Dog className="h-7 w-7" />
          </div>
        )}
      </div>
      <div className="px-2.5 py-2">
        <div className="flex items-center justify-between gap-1.5">
          <p className="truncate text-[12.5px] font-semibold text-ink">{dog?.name || fallbackName}</p>
          <span className="text-[13px] font-bold leading-none" style={{ color: sexColor }}>{sex}</span>
        </div>
        <p className="truncate text-[10.5px] text-muted">{dog?.breed?.name || 'Cocker Spaniel'}</p>
      </div>
    </div>
  )
}

function KennelShowcaseMockup({ featuredDogs }: { featuredDogs: any[] }) {
  const t = useT()
  const repro = (featuredDogs || []).slice(0, 3)
  const producidos = (featuredDogs || []).slice(3, 7)
  const sexes: ('♂' | '♀')[] = ['♂', '♀', '♂', '♀', '♂', '♀', '♀']
  return (
    <AppWindow url="genealogic.io/kennels/tu-criadero">
      <div className="p-4 sm:p-6">
        {/* Cabecera del criadero */}
        <div className="flex items-center gap-3 border-b border-hairline pb-3.5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-ink">{t('Criadero de Aldenham')}</p>
            <p className="text-[11px] text-muted">{t('Cocker Spaniel Inglés · 12 perros · 4 camadas')}</p>
          </div>
          <span className="hidden rounded-full border border-hairline px-2.5 py-1 text-[11px] font-medium text-body sm:inline-flex">
            {t('Perfil público')}
          </span>
        </div>

        {/* Reproductores */}
        <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{t('Reproductores')}</p>
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          {repro.map((d: any, i: number) => (
            <KennelDogCard key={d?.id || i} dog={d} sex={sexes[i]} fallbackName={i === 1 ? 'Maia' : 'Lord Byron'} />
          ))}
        </div>

        {/* Producidos por el criadero */}
        <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{t('Producidos por nosotros')}</p>
        <div className="mt-2.5 grid grid-cols-4 gap-2.5">
          {producidos.map((d: any, i: number) => (
            <KennelDogCard key={d?.id || i} dog={d} sex={sexes[i + 3]} fallbackName="Cachorro" />
          ))}
        </div>
      </div>
    </AppWindow>
  )
}

function KennelShowcase({ featuredDogs }: { featuredDogs: any[] }) {
  const t = useT()
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
              {t('03 · Reputación')}
            </p>
            <h2
              className="mt-3 font-semibold text-ink"
              style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
            >
              {t('Tu criadero entero, a la vista de todos.')}
            </h2>
            <p className="mt-5 sm:mt-6 text-[16px] leading-[1.55] text-body sm:text-[17px]">
              {t('Cada criadero tiene su perfil público en Genealogic, gratis desde el día 1. Tus reproductores y todos los perros que has criado, cada uno con su genealogía y su ficha. Te encuentran, ven tu trabajo serio y confían — antes de escribirte.')}
            </p>
            <div className="mt-6 sm:mt-8 space-y-3">
              <BulletRow text={t('Tus reproductores y los perros producidos por ti, en una página')} />
              <BulletRow text={t('Cada perro enlaza a su árbol genealógico completo')} />
              <BulletRow text={t('Posiciona en Google: te encuentran buscando tu raza')} />
            </div>
          </div>

          <KennelShowcaseMockup featuredDogs={featuredDogs} />
        </div>
      </div>
    </section>
  )
}

// ─── Onboarding steps ────────────────────────────────────────────────────
function OnboardingSteps() {
  const t = useT()
  return (
    <section className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          {t('04 · Ahorra tiempo')}
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
          <Step n="3" duration={t('1 día')} title={t('Publica tu perfil')}>
            {t('Tu criadero, con reproductores y producidos, queda público e indexable en Google. Que te encuentren.')}
          </Step>
          <Step n="4" duration={t('Day 1')} title={t('Lleva todo al día')}>
            {t('Camadas, calendario reproductivo y cartilla sanitaria con recordatorios. Tu criadero entero en un sitio.')}
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
// Fase 1 (lanzamiento GRATIS): todo es gratis ahora mismo, para propietarios
// y criadores, con perros ilimitados y sin tarjeta. Los planes de pago
// (Kennel Pro + extensiones) siguen VISIBLES como visión, pero etiquetados
// "Próximamente" — aún no se venden. Cuando se activen, avisaremos a los
// usuarios gratuitos por email.
function Pricing() {
  const t = useT()
  return (
    <section id="precios" className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          {t('05 · Precios')}
        </p>
        <h2
          className="mt-3 max-w-[18ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(26px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          {t('Gratis para criar. Sin tarjeta.')}
        </h2>
        <p className="mt-5 sm:mt-6 max-w-[560px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
          {t('Ahora mismo Genealogic es gratis para propietarios y criadores, con perros ilimitados y sin tarjeta. La genealogía es siempre completa, sin límite de generaciones. Estamos preparando herramientas profesionales de pago para el criadero — las verás abajo como visión, y te avisaremos cuando lleguen.')}
        </p>

        <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Gratis — todo lo lanzado, ahora mismo, sin coste */}
          <div className="relative rounded-[16px] border-2 bg-gradient-to-br from-emerald-50 via-canvas to-green-50 p-6 flex flex-col shadow-[0_12px_48px_rgba(16,185,129,0.12)]" style={{ borderColor: '#10b981' }}>
            <span className="absolute -top-3 left-5 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {t('Disponible ya')}
            </span>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-emerald-600">{t('Criadero')}</p>
            <p className="mt-3 text-[32px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
              0 € <span className="text-[13px] font-normal text-muted">/ {t('gratis')}</span>
            </p>
            <p className="mt-1 text-[13px] text-body">{t('Perros ilimitados · Sin tarjeta')}</p>
            <ul className="mt-5 space-y-2 text-[13.5px] flex-1">
              <PricingRow>{t('Genealogías ilimitadas + importador IA')}</PricingRow>
              <PricingRow>{t('Perfil público indexable en Google')}</PricingRow>
              <PricingRow>{t('Camadas + calendario reproductivo')}</PricingRow>
              <PricingRow>{t('Salud: cartilla + recordatorios de vacunas')}</PricingRow>
            </ul>
            <Button href="/register?intent=breeder&plan=free" variant="primary" className="mt-6 w-full">
              {t('Crea tu criadero gratis')}
            </Button>
          </div>

          {/* Kennel Pro — visión, aún NO vendible (Próximamente) */}
          <div className="relative rounded-[16px] border border-hairline bg-gradient-to-br from-orange-50 via-canvas to-amber-50 p-6 flex flex-col">
            <span className="absolute -top-3 left-5 rounded-full bg-ink/85 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {t('Próximamente')}
            </span>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#FE6620]">Kennel Pro</p>
            <p className="mt-3 text-[32px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
              49 € <span className="text-[13px] font-normal text-muted">/ {t('mes')}</span>
            </p>
            <p className="mt-1 text-[13px] text-body">{t('Las herramientas pro del criadero')}</p>
            <ul className="mt-5 space-y-2 text-[13.5px] flex-1">
              <PricingRow>{t('COI + simulador de cruces')}</PricingRow>
              <PricingRow>{t('Genotipos y DNA')}</PricingRow>
              <PricingRow>{t('CRM de reservas + contratos')}</PricingRow>
              <PricingRow>{t('Estadísticas del criadero')}</PricingRow>
            </ul>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="mt-6 w-full cursor-not-allowed rounded-xl border border-hairline bg-surface-soft px-5 py-3 text-sm font-semibold text-muted"
            >
              {t('Próximamente')}
            </button>
          </div>

          {/* Extensiones — visión, aún NO vendibles (Próximamente) */}
          <div className="relative rounded-[16px] border border-hairline bg-gradient-to-br from-violet-50 via-canvas to-purple-50 p-6 flex flex-col">
            <span className="absolute -top-3 left-5 rounded-full bg-ink/85 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {t('Próximamente')}
            </span>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-violet-600">{t('Extensiones')}</p>
            <p className="mt-3 text-[22px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
              {t('Amplía tu criadero')}
            </p>
            <p className="mt-1 text-[13px] text-body">{t('À la carte · activa solo lo que uses')}</p>
            <ul className="mt-5 space-y-3 text-[13.5px] flex-1">
              <li className="flex items-baseline justify-between gap-3">
                <span className="text-body">{t('Web del criadero + dominio propio')}</span>
                <span className="whitespace-nowrap text-[12.5px] font-semibold text-muted">19 € · {t('Próximamente')}</span>
              </li>
              <li className="flex items-baseline justify-between gap-3">
                <span className="text-body">{t('Newsletter')}</span>
                <span className="whitespace-nowrap text-[12.5px] font-semibold text-muted">9 € · {t('Próximamente')}</span>
              </li>
              <li className="flex items-baseline justify-between gap-3">
                <span className="text-body">{t('Emailbot IA')}</span>
                <span className="whitespace-nowrap text-[12.5px] font-semibold text-muted">19 € · {t('Próximamente')}</span>
              </li>
            </ul>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="mt-6 w-full cursor-not-allowed rounded-xl border border-hairline bg-surface-soft px-5 py-3 text-sm font-semibold text-muted"
            >
              {t('Próximamente')}
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-[13px] text-muted">
          {t('Las herramientas de pago llegarán poco a poco. Mientras tanto, todo es gratis — y avisaremos a los usuarios gratuitos por email en cuanto cada novedad esté lista.')}
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
      q: t('¿De verdad es gratis ahora mismo?'),
      a: t('Sí. Ahora mismo Genealogic es gratis para propietarios y criadores, con perros ilimitados y sin tarjeta. Registras tus perros y su genealogía, los importas con IA, llevas tus camadas y la salud al día, y tienes tu perfil público indexable en Google — todo sin coste.'),
    },
    {
      q: t('¿Qué incluye gratis para criadores?'),
      a: t('Genealogías ilimitadas con importador IA, perfil público del criadero indexable en Google (con tus reproductores y los perros que has criado), camadas con un click, calendario reproductivo, cartilla sanitaria con recordatorios de vacunas, galería de fotos y el buscador con más de 250.000 perros. Todo gratis.'),
    },
    {
      q: t('¿Qué son las herramientas que llegarán próximamente?'),
      a: t('Estamos puliendo herramientas profesionales para el criadero —simulador de cruces con COI proyectado, genotipos y DNA, CRM de reservas, contratos, web del criadero con dominio propio, newsletter y emailbot— que iremos lanzando poco a poco. Las verás en la web como visión; cuando cada una esté lista te avisaremos por email.'),
    },
    {
      q: t('¿Tendré que pagar más adelante?'),
      a: t('Lo que usas hoy seguirá siendo gratis. Algunas herramientas pro del criadero serán de pago cuando se lancen, pero nunca te cobraremos por sorpresa: si algo pasa a ser de pago, te lo decimos con antelación y tú decides. Sin tarjeta para empezar.'),
    },
    {
      q: t('¿Mis datos son míos? ¿Puedo exportarlos?'),
      a: t('Sí. Cualquier perro, genealogía o ficha la exportas a PDF en un click. Servidores en EU, RGPD por defecto. Si te vas de Genealogic, te llevas tus datos.'),
    },
    {
      q: t('¿Y si ya tengo todo en Excel o WhatsApp?'),
      a: t('Para genealogías: la importación con IA (URL de Dogsfiles/Presadb/K9data, foto o PDF) te ahorra horas. El resto de fichas las añades a mano en un rato. La primera tarde es de setup; a partir de ahí todo en un sitio.'),
    },
  ]

  return (
    <section id="faq" className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[860px] px-5 py-16 sm:px-6 sm:py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">{t('06 · FAQ')}</p>
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
          {t('Tu criadero, donde tiene que estar.')}
        </h2>
        <p className="mx-auto mt-5 sm:mt-6 max-w-[480px] text-[16px] leading-[1.55] text-body sm:text-[17px]">
          {t('Genealogías verificables + perfil público indexable + IA. En una sola cuenta. Gratis.')}
        </p>
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button href="/register?intent=breeder&plan=free" variant="primary" size="lg">
            {t('Crea tu criadero gratis')} <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/features" variant="secondary" size="lg">
            {t('Explora el producto al detalle')}
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
  comingSoon,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  color: 'brand' | 'pink' | 'blue' | 'violet' | 'orange' | 'emerald'
  comingSoon?: boolean
}) {
  const t = useT()
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
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <h3 className="text-[18px] font-semibold text-ink" style={{ letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        {comingSoon && (
          <span className="inline-flex items-center rounded-full border border-hairline bg-surface-soft px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em] text-muted">
            {t('Próximamente')}
          </span>
        )}
      </div>
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
