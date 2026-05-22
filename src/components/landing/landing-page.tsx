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
  Search,
  Dog,
  Heart,
  Calendar,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'

interface Props {
  breeds: { id: string; name: string }[]
  featuredDogs: any[]
}

export default function LandingPage({ breeds, featuredDogs }: Props) {
  const heroDogs = featuredDogs.slice(0, 5)

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <StickyHeader />
      <Hero heroDogs={heroDogs} />
      <PedigreeShowcase />
      <FeaturesGrid />
      <KanbanShowcase />
      <BotConversation />
      <OnboardingSteps />
      <CaseStudy />
      <Pricing />
      <FAQ />
      <FinalCta />
      <Footer />
    </main>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────
function StickyHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-12">
        <Wordmark size="text-xl" />
        <nav className="hidden items-center gap-8 text-[14px] text-body md:flex">
          <a href="#producto" className="transition hover:text-ink">Producto</a>
          <a href="#criadores" className="transition hover:text-ink">Para criadores</a>
          <a href="#precios" className="transition hover:text-ink">Precios</a>
          <a href="#faq" className="transition hover:text-ink">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Iniciar sesión
          </Button>
          <Button href="/register" variant="primary" size="sm">
            Empieza gratis
          </Button>
        </div>
      </div>
    </header>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────
function Hero({ heroDogs }: { heroDogs: any[] }) {
  return (
    <section className="relative overflow-hidden border-b border-hairline">
      {/* Decorative gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.6]"
        style={{
          background:
            'radial-gradient(60% 50% at 20% 0%, rgba(215,71,9,0.10) 0%, transparent 70%), radial-gradient(50% 40% at 90% 10%, rgba(1,125,250,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-6 pt-16 pb-24 lg:px-12 lg:pt-24 lg:pb-32">
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
          className="mt-6 max-w-[18ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(40px, 7vw, 76px)', lineHeight: 1.02, letterSpacing: '-0.04em' }}
        >
          Pedigrees verificables. <span className="italic font-light text-body">Criadero profesional.</span>
        </h1>
        <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-body sm:text-[19px]">
          El registro público mundial de perros con genealogía. Gratis para todos.
          Tier Pro con todo lo que un criadero serio necesita: reservas, clientes,
          web propia, emailbot y newsletter.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button href="/register" variant="primary" size="lg">
            Empieza gratis <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="#producto" variant="secondary" size="lg">
            Cómo funciona
          </Button>
          <span className="text-[13px] text-muted">
            Sin tarjeta · Pro a precio Founder por vida
          </span>
        </div>

        {/* Hero visual: pedigree mini-tree + recent dogs */}
        <div className="mt-16 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <PedigreeCardVisual heroDogs={heroDogs} />
          <RecentDogsCard heroDogs={heroDogs} />
        </div>
      </div>
    </section>
  )
}

function PedigreeCardVisual({ heroDogs }: { heroDogs: any[] }) {
  const main = heroDogs[0]
  return (
    <div className="relative rounded-[16px] border border-hairline bg-canvas p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          <GitBranch className="h-3.5 w-3.5" />
          Árbol genealógico
        </div>
        <span className="rounded-full bg-surface-card px-2.5 py-1 text-[11px] font-medium text-body">
          5 generaciones
        </span>
      </div>

      {/* SVG pedigree tree mock */}
      <svg viewBox="0 0 520 220" className="h-auto w-full" aria-hidden>
        {/* Connectors */}
        <g stroke="var(--pedigree-line)" strokeWidth="1.5" fill="none">
          <path d="M120 110 L240 60" />
          <path d="M120 110 L240 160" />
          <path d="M260 60 L380 30" />
          <path d="M260 60 L380 90" />
          <path d="M260 160 L380 130" />
          <path d="M260 160 L380 190" />
        </g>
        {/* Main dog (gen 0) */}
        <g>
          <rect x="20" y="92" width="100" height="36" rx="8" fill="var(--ink)" />
          <text x="70" y="115" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">
            {main?.name?.slice(0, 14) || 'Tu perro'}
          </text>
        </g>
        {/* Gen 1 — parents */}
        <g>
          <rect x="240" y="42" width="120" height="36" rx="8" fill="var(--canvas)" stroke="var(--male)" strokeWidth="1.5" />
          <text x="300" y="65" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">Padre</text>
          <rect x="240" y="142" width="120" height="36" rx="8" fill="var(--canvas)" stroke="var(--female)" strokeWidth="1.5" />
          <text x="300" y="165" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">Madre</text>
        </g>
        {/* Gen 2 — grandparents */}
        <g fill="var(--surface-card)" stroke="var(--hairline)">
          <rect x="380" y="12" width="120" height="36" rx="8" />
          <rect x="380" y="72" width="120" height="36" rx="8" />
          <rect x="380" y="112" width="120" height="36" rx="8" />
          <rect x="380" y="172" width="120" height="36" rx="8" />
        </g>
        <g fill="var(--muted)" fontSize="11" textAnchor="middle">
          <text x="440" y="35">Abuelo paterno</text>
          <text x="440" y="95">Abuela paterna</text>
          <text x="440" y="135">Abuelo materno</text>
          <text x="440" y="195">Abuela materna</text>
        </g>
      </svg>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-[12px] text-muted">
        <ShieldCheck className="h-4 w-4 text-[color:var(--success)]" />
        Verificable · trazable · público
      </div>
    </div>
  )
}

function RecentDogsCard({ heroDogs }: { heroDogs: any[] }) {
  return (
    <div className="rounded-[16px] border border-hairline bg-surface-card p-6 sm:p-8">
      <div className="mb-5 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
        <Dog className="h-3.5 w-3.5" />
        Perros publicados hoy
      </div>
      <div className="space-y-2">
        {heroDogs.length > 0
          ? heroDogs.slice(0, 4).map((d: any) => (
              <Link
                key={d.id}
                href={`/dogs/${d.slug || d.id}`}
                className="flex items-center gap-3 rounded-lg bg-canvas p-2.5 transition hover:bg-surface-soft"
              >
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-hairline bg-surface-card">
                  {d.thumbnail_url && (
                    <img src={d.thumbnail_url} alt={d.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{d.name}</p>
                  <p className="truncate text-[11px] text-muted">
                    {d.breed?.name || 'Sin raza definida'}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted" />
              </Link>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-canvas p-2.5">
                <div className="h-10 w-10 flex-shrink-0 rounded-md bg-surface-card" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 rounded bg-surface-card" />
                  <div className="h-2.5 w-1/3 rounded bg-surface-card" />
                </div>
              </div>
            ))}
      </div>
      <Link
        href="/search"
        className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-hairline bg-canvas py-2.5 text-[13px] font-medium text-ink transition hover:bg-surface-soft"
      >
        <Search className="h-3.5 w-3.5" /> Buscar en el registro
      </Link>
    </div>
  )
}

// ─── Pedigree showcase ───────────────────────────────────────────────────
function PedigreeShowcase() {
  return (
    <section id="producto" className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          01 · Para todos
        </p>
        <div className="mt-3 grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2
            className="max-w-[20ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            El registro público de perros con genealogía verificable.
          </h2>
          <p className="max-w-[460px] text-[17px] leading-[1.55] text-body">
            Cada perro con árbol de 5 generaciones, datos sanitarios, registro y
            trazabilidad. Importa pedigrees existentes en segundos con IA. Comparte
            tu trabajo con un link público.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <MiniFeature
            icon={<GitBranch className="h-5 w-5" />}
            title="Genealogía real"
            desc="3-5 generaciones, fotos, registros, salud. No autodeclarado: trazable."
            color="brand"
          />
          <MiniFeature
            icon={<Sparkles className="h-5 w-5" />}
            title="Importa con IA"
            desc="Foto de pedigree → árbol completo en segundos. Claude lo entiende."
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

// ─── Features grid (Pro) ─────────────────────────────────────────────────
function FeaturesGrid() {
  return (
    <section id="criadores" className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          02 · Tier Pro
        </p>
        <div className="mt-3 grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2
            className="max-w-[20ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            Todo lo que un criadero serio necesita en un sitio.
          </h2>
          <p className="max-w-[460px] text-[17px] leading-[1.55] text-body">
            Pipeline de reservas tipo Kanban, CRM de compradores, web pública con
            dominio propio, emailbot que responde a tus consultas con tu tono y tu
            biblioteca, newsletter, estadísticas. Y el pedigree verificado encima.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<KanbanSquare className="h-5 w-5" />}
            title="Pipeline de reservas"
            desc="Kanban con 8 estados: interesado → seña pagada → contrato → entregado. No más Excel."
            color="brand"
          />
          <FeatureCard
            icon={<Heart className="h-5 w-5" />}
            title="CRM de clientes"
            desc="Cada owner con su historial: perros, reservas, contratos, contacto. Todo enlazado."
            color="pink"
          />
          <FeatureCard
            icon={<Globe className="h-5 w-5" />}
            title="Web pública"
            desc="Editor visual estilo Webflow. Dominio propio. 8 páginas y 36 secciones."
            color="blue"
          />
          <FeatureCard
            icon={<Mail className="h-5 w-5" />}
            title="Emailbot que vende"
            desc="Responde consultas con tu tono y tu biblioteca de conocimiento. Tú revisas y envías."
            color="violet"
          />
          <FeatureCard
            icon={<Calendar className="h-5 w-5" />}
            title="Newsletter"
            desc="Suscriptores + campañas. Aviso automático cuando hay camada disponible."
            color="orange"
          />
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Estadísticas"
            desc="Quién visita tu web, qué perro miran, de dónde vienen. Decisiones con datos."
            color="emerald"
          />
        </div>
      </div>
    </section>
  )
}

// ─── Kanban showcase ─────────────────────────────────────────────────────
function KanbanShowcase() {
  return (
    <section className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          03 · Pipeline
        </p>
        <h2
          className="mt-3 max-w-[24ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          Tu próxima camada se reserva sola.
        </h2>
        <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-body">
          Mueve cada lead entre columnas. Sabe exactamente quién pagó seña, quién
          firmó contrato, quién espera la próxima camada.
        </p>

        {/* Kanban mock */}
        <div className="mt-12 overflow-x-auto">
          <div className="grid min-w-[820px] grid-cols-4 gap-4">
            <KanbanColumn
              title="Interesados"
              count={3}
              accent="badge-orange"
              cards={[
                { name: 'Laura M.', sub: 'Camada primavera · macho' },
                { name: 'Carlos D.', sub: 'Lista de espera' },
                { name: 'Ana P.', sub: 'Pregunta por afijo' },
              ]}
            />
            <KanbanColumn
              title="Seña pagada"
              count={2}
              accent="badge-violet"
              cards={[
                { name: 'Diego R.', sub: '300 € · 12 mar' },
                { name: 'María L.', sub: '300 € · 8 mar' },
              ]}
            />
            <KanbanColumn
              title="Contrato firmado"
              count={1}
              accent="badge-emerald"
              cards={[{ name: 'Pablo G.', sub: 'Cachorro asignado · #7' }]}
            />
            <KanbanColumn
              title="Entregados"
              count={4}
              accent="muted"
              cards={[
                { name: 'Elena C.', sub: 'Recogido 12 feb' },
                { name: 'Jorge T.', sub: 'Recogido 5 feb' },
                { name: '+2 más', sub: '' },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function KanbanColumn({
  title,
  count,
  accent,
  cards,
}: {
  title: string
  count: number
  accent: string
  cards: { name: string; sub: string }[]
}) {
  return (
    <div className="rounded-[12px] bg-canvas border border-hairline p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold text-ink">{title}</span>
        <span
          className="rounded-full bg-surface-card px-2 py-0.5 text-[11px] font-medium text-body"
          style={accent !== 'muted' ? { color: `var(--${accent})` } : undefined}
        >
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {cards.map((c, i) => (
          <div key={i} className="rounded-lg border border-hairline bg-canvas p-3">
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 flex-shrink-0 rounded-full"
                style={{
                  background: `var(--${accent === 'muted' ? 'hairline' : accent})`,
                  opacity: accent === 'muted' ? 1 : 0.85,
                }}
              />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-ink">{c.name}</p>
                {c.sub && <p className="truncate text-[10.5px] text-muted">{c.sub}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bot conversation ────────────────────────────────────────────────────
function BotConversation() {
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-12 lg:py-[120px]">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
              04 · Emailbot
            </p>
            <h2
              className="mt-3 font-semibold text-ink"
              style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
            >
              Habla con tus compradores incluso cuando duermes.
            </h2>
            <p className="mt-6 text-[17px] leading-[1.55] text-body">
              Conectas tu email del criadero. El bot lee, redacta una respuesta con
              tu tono usando tu biblioteca de conocimiento. Tú revisas y envías. O lo
              dejas en auto-piloto para preguntas frecuentes.
            </p>
            <div className="mt-8 space-y-3">
              <BulletRow text="Lee tu biblioteca: precios, contratos, certificados, salud" />
              <BulletRow text="Responde con tu tono, no con el de ChatGPT" />
              <BulletRow text="Tú decides si auto-envía o si revisas antes" />
            </div>
          </div>

          {/* Chat mock */}
          <div className="rounded-[16px] border border-hairline bg-canvas p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-7">
            <div className="mb-4 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
              <Mail className="h-3.5 w-3.5" />
              hola@tucriadero.com
            </div>
            <div className="space-y-3">
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
          </div>
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
      <div className={`max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-[13.5px] leading-[1.5] ${
        bot ? 'bg-ink text-on-primary' : 'bg-surface-card text-ink'
      }`}>
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
      <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          05 · Empezar
        </p>
        <h2
          className="mt-3 max-w-[18ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          De cero a operando en un fin de semana.
        </h2>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Step n="1" duration="30 min" title="Crea tu cuenta">
            Registro gratis. Configura tu criadero, afijo y datos básicos. Sin tarjeta.
          </Step>
          <Step n="2" duration="1 hora" title="Importa tus perros">
            Sube fotos de pedigrees existentes. La IA extrae el árbol entero en segundos.
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
    <div className="rounded-[12px] border border-hairline bg-canvas p-6">
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

// ─── Case study ──────────────────────────────────────────────────────────
function CaseStudy() {
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-12 lg:py-[120px]">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
              06 · Caso real
            </p>
            <h2
              className="mt-3 font-semibold text-ink"
              style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
            >
              Irema Curtó · Bull Terriers desde 1975
            </h2>
            <blockquote className="mt-6 border-l-2 border-[color:var(--brand)] pl-5 text-[17px] leading-[1.6] text-body">
              «Genealogic le ahorra a mi padre 4 horas a la semana de contestar los
              mismos emails y le permite enseñar el linaje real de cada cachorro al
              instante. Es lo que faltaba en este sector.»
            </blockquote>
            <p className="mt-4 text-[13px] text-muted">
              Manuel Curtó · 4ª generación · @iremacurto
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Stat big="1975" label="Afijo desde" />
            <Stat big="+1.000" label="Cachorros entregados" />
            <Stat big="6" label="Países atendidos" />
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div className="rounded-[12px] border border-hairline bg-surface-soft p-5 text-center">
      <p className="text-[28px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
        {big}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">{label}</p>
    </div>
  )
}

// ─── Pricing ─────────────────────────────────────────────────────────────
function Pricing() {
  return (
    <section id="precios" className="border-b border-hairline bg-surface-soft">
      <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          07 · Precios
        </p>
        <h2
          className="mt-3 max-w-[18ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          Gratis para todos. Pro cuando estés listo.
        </h2>
        <p className="mt-6 max-w-[520px] text-[17px] leading-[1.55] text-body">
          Sin freemium tramposo: el tier Free es gratis de verdad y para siempre.
          Pro tiene precio Founder por vida si te subes ahora.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-[16px] border border-hairline bg-canvas p-8">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Free</p>
            <p className="mt-3 text-[36px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
              0 € <span className="text-[14px] font-normal text-muted">/ siempre</span>
            </p>
            <p className="mt-2 text-[14px] text-body">
              Para dueños, criadores hobby y cualquier amante de los perros con linaje.
            </p>
            <ul className="mt-7 space-y-2.5 text-[14px]">
              <PricingRow>Perros ilimitados con genealogía</PricingRow>
              <PricingRow>Importación de pedigrees con IA</PricingRow>
              <PricingRow>Búsqueda pública del registro</PricingRow>
              <PricingRow>Planificador de cruces</PricingRow>
              <PricingRow>Calendario de celos y partos</PricingRow>
            </ul>
            <Button href="/register" variant="secondary" className="mt-8 w-full">
              Crear cuenta gratis
            </Button>
          </div>

          {/* Pro */}
          <div className="relative rounded-[16px] bg-surface-dark p-8 text-on-dark">
            <span className="absolute -top-3 right-6 rounded-full bg-[color:var(--brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
              Founder · plazas limitadas
            </span>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-on-dark-soft">Pro</p>
            <p className="mt-3 text-[36px] font-semibold" style={{ letterSpacing: '-0.02em' }}>
              89 € <span className="text-[14px] font-normal text-on-dark-soft">/ mes · vitalicio</span>
            </p>
            <p className="mt-2 text-[14px] text-on-dark-soft">
              Criadero profesional: reservas, clientes, web, emailbot, newsletter.
            </p>
            <ul className="mt-7 space-y-2.5 text-[14px]">
              <PricingRow dark>Todo lo de Free, sin límite</PricingRow>
              <PricingRow dark>Pipeline de reservas Kanban</PricingRow>
              <PricingRow dark>CRM de clientes</PricingRow>
              <PricingRow dark>Web pública + dominio propio</PricingRow>
              <PricingRow dark>Emailbot con biblioteca</PricingRow>
              <PricingRow dark>Newsletter + estadísticas</PricingRow>
              <PricingRow dark>API key para integraciones</PricingRow>
            </ul>
            <Button href="/register?intent=pro" variant="secondary" className="mt-8 w-full !bg-canvas !text-ink">
              Reservar plaza Founder
            </Button>
          </div>
        </div>
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
      q: '¿Es realmente gratis el tier Free?',
      a: 'Sí. Perros ilimitados, importación con IA, búsqueda, planificador, calendario. Para siempre. No te pedimos tarjeta.',
    },
    {
      q: '¿Qué pasa si subo de Free a Pro?',
      a: 'Todos tus perros y datos se mantienen. Se activan: pipeline de reservas, CRM, web pública, emailbot, newsletter y estadísticas. Mismo dominio, misma cuenta.',
    },
    {
      q: '¿Puedo usar mi propio dominio en la web del criadero?',
      a: 'Sí. Conectas tu dominio desde Ajustes y nuestro sistema lo sirve directamente. Sin redirects raros, sin subdominios feos.',
    },
    {
      q: '¿Qué tan bueno es el emailbot?',
      a: 'Usa Claude (Anthropic) + tu biblioteca de conocimiento personal (contratos, salud, precios, política de espera). Responde con tu tono, no con el de ChatGPT genérico. Tú revisas antes de enviar.',
    },
    {
      q: '¿Y si ya tengo otro sistema (Excel, Notion)?',
      a: 'La importación de pedigrees con IA te ahorra horas. Para clientes y reservas, copias y pegas. La primera tarde es de setup; a partir de ahí, todo en un sitio.',
    },
    {
      q: '¿Cuántas plazas Founder quedan?',
      a: 'Cerramos al llegar a 100. Después, el precio Pro pasa a 149 €/mes. Los Founder mantienen 89 €/mes vitalicio.',
    },
  ]

  return (
    <section id="faq" className="border-b border-hairline">
      <div className="mx-auto max-w-[860px] px-6 py-24 lg:px-12 lg:py-[120px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">08 · FAQ</p>
        <h2
          className="mt-3 font-semibold text-ink"
          style={{ fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
        >
          Las dudas habituales.
        </h2>

        <div className="mt-12 divide-y divide-hairline">
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
        className="flex w-full items-center justify-between gap-6 text-left"
      >
        <span className="text-[16px] font-semibold text-ink" style={{ letterSpacing: '-0.01em' }}>
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
      <div className="mx-auto max-w-[1200px] px-6 py-24 text-center lg:px-12 lg:py-[120px]">
        <h2
          className="mx-auto max-w-[18ch] font-semibold text-ink"
          style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.02, letterSpacing: '-0.035em' }}
        >
          Tu próxima camada se reserva sola.
        </h2>
        <p className="mx-auto mt-6 max-w-[480px] text-[17px] leading-[1.55] text-body">
          Pedigree verificable + criadero profesional + IA. En una sola cuenta.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button href="/register" variant="primary" size="lg">
            Empieza gratis <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="mailto:hola@genealogic.io" variant="secondary" size="lg">
            Habla con nosotros
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
              { label: 'Precios', href: '#precios' },
              { label: 'FAQ', href: '#faq' },
              { label: 'API pública', href: '/api-docs' },
            ]}
          />
          <FooterCol
            title="Cuenta"
            links={[
              { label: 'Iniciar sesión', href: '/login' },
              { label: 'Crear cuenta', href: '/register' },
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
    <div className="rounded-[12px] border border-hairline bg-canvas p-7">
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
    <div className="rounded-[12px] border border-hairline bg-canvas p-7 transition hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
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
