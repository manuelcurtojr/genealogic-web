/**
 * PricingClient — /pricing con 3 planes + extensiones à la carte,
 * vista simple/avanzada y toggle Mensual / Anual con descuento.
 *
 * Modelo (perros ILIMITADOS en todos los planes — ya no se monetiza por
 * número de perros, sino por las HERRAMIENTAS de criadero):
 *   · Owner — Perros ilimitados · Gratis
 *   · Kennel Free — Perros ilimitados · Gratis (embudo de ventas LIMITADO)
 *   · Kennel Pro — Perros ilimitados · 49€/mes (o 499€/año) · 14 días gratis
 *
 * Extensiones (add-ons que se pagan APARTE, sobre Kennel Pro):
 *   · Web del criadero — 19€/mes (web pública con dominio propio)
 *   · Newsletter — 9€/mes (campañas + lista de espera)
 *   · Emailbot — 19€/mes · PRÓXIMAMENTE (aún no vendible)
 *
 * Vistas:
 *   1) Simple ("en cristiano") — 3 cards grandes con highlights por plan
 *   2) Avanzada — tabla completa con TODAS las features marcadas por plan
 *
 * La diferencia entre planes está en las herramientas (criadero, simulador,
 * genotipos, estadísticas), NO en cuántos perros tienes — ilimitado en todos.
 * La web, el emailbot y la newsletter son extensiones aparte sobre Pro.
 *
 * El plan completo del modelo está en
 * memory/genealogic_pricing_model.md.
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check, Sparkles, ArrowRight, Dog, Store, Globe, Mail, Bot, Building2,
  Minus, Info, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import CheckoutButton from '@/components/billing/checkout-button'
import { useT } from '@/components/i18n/locale-provider'

type PlanId = 'owner' | 'free' | 'pro'

// ──────────────────────────────────────────────────────────────────────
// Matriz de features — sincronizada con el PDF de planes y con la
// memoria genealogic_pricing_model.md. Cada feature lleva la lista de
// planes en los que está disponible.
// Las cadenas "OFP" representan los 3 planes: Owner / Free / Pro.
// La web, el emailbot y la newsletter NO están aquí: son extensiones
// à la carte sobre Pro (ver sección Extensiones más abajo).
// ──────────────────────────────────────────────────────────────────────
const PLAN_CODES: Record<PlanId, string> = {
  owner: 'O',
  free: 'F',
  pro: 'P',
}

interface FeatureRow { name: string; marks: string }
interface CategoryDef { label: string; features: FeatureRow[] }

const CATEGORIES: CategoryDef[] = [
  {
    label: 'Plataforma',
    features: [
      { name: 'Perfil del perro indexable en Google', marks: 'OFP' },
      { name: 'Importador de genealogías con IA (URL → árbol completo)', marks: 'OFP' },
      { name: 'Histórico de cambios por perro (auditoría)', marks: 'OFP' },
      { name: 'Sistema de moderación (soft-hide, reportes)', marks: 'OFP' },
      { name: 'Exportar perfil completo a PDF', marks: 'OFP' },
      { name: 'Perfiles privados o públicos por perro', marks: 'OFP' },
      { name: 'Interfaz multi-idioma (ES, EN, IT, FR)', marks: 'OFP' },
    ],
  },
  {
    label: 'Genealogía',
    features: [
      { name: 'Árbol genealógico interactivo · generaciones ilimitadas', marks: 'OFP' },
      { name: 'COI Wright + lista de ancestros duplicados', marks: 'P' },
      { name: 'Comparativa COI vs media de la raza', marks: 'P' },
      { name: 'PDF de genealogía con tu marca', marks: 'P' },
      { name: 'Hermanos y descendientes auto-detectados', marks: 'OFP' },
      { name: 'Editor visual de genealogía', marks: 'OFP' },
      { name: 'Campo de registro oficial (LOE, AKC, KC...)', marks: 'OFP' },
    ],
  },
  {
    label: 'Cría y reproducción',
    features: [
      { name: 'Simulador de cruces (COI proyectado)', marks: 'P' },
      { name: 'Predicción de color por genotipos', marks: 'P' },
      { name: 'Calendario reproductivo (gantt anual de celos y partos)', marks: 'FP' },
      { name: 'Camadas con un click (cachorros heredan padres + afijo)', marks: 'FP' },
      { name: 'Stud-book privado del criadero', marks: 'FP' },
      { name: 'Histórico de COI medio del criadero', marks: 'P' },
    ],
  },
  {
    label: 'Salud y genética',
    features: [
      { name: 'Cartilla veterinaria digital', marks: 'OFP' },
      { name: 'Recordatorios de vacunas (push + email)', marks: 'OFP' },
      { name: 'Genotipos (locus E, B, K, D, A, S)', marks: 'P' },
      { name: 'Pruebas raciales (DM, PLL, displasia, OFA)', marks: 'FP' },
    ],
  },
  {
    label: 'Catálogo de perros',
    features: [
      { name: 'Galería ilimitada de fotos', marks: 'OFP' },
      { name: 'Upscale IA de fotos (5 gratis · ilimitado en Pro)', marks: 'OFP' },
      { name: 'Palmarés y títulos (CAC, CACIB, BIS)', marks: 'OFP' },
      { name: 'Transferir propietario en 1 click', marks: 'OFP' },
      { name: 'Estados (reproductor, en venta, criado)', marks: 'FP' },
      { name: 'Búsqueda y filtros avanzados', marks: 'OFP' },
      { name: 'Marcar perro como fallecido (In Memoriam)', marks: 'OFP' },
    ],
  },
  {
    label: 'Embudo de ventas y CRM',
    features: [
      // En Free el embudo se ve LIMITADO (solo el número de solicitudes,
      // borroso). El detalle completo del pipeline es de Pro.
      { name: 'Embudo de ventas completo (tabla + tabs por estado)', marks: 'P' },
      { name: 'Plantillas de contrato reutilizables', marks: 'FP' },
      { name: 'Firma electrónica básica', marks: 'FP' },
      { name: 'Pagos integrados con Stripe Connect (próximamente)', marks: 'P' },
      { name: 'Calendario de pagos (seña + parcial + final, manual)', marks: 'FP' },
      { name: 'CRM unificado de clientes', marks: 'P' },
      { name: 'Reseñas verificadas de clientes', marks: 'P' },
      { name: 'Formulario de contacto configurable', marks: 'P' },
      { name: 'Visitas al criadero', marks: 'P' },
      { name: 'Notificaciones email + push iOS', marks: 'OFP' },
    ],
  },
  {
    label: 'Analítica y datos',
    features: [
      { name: 'Estadísticas web del criadero en tiempo real', marks: 'P' },
      { name: 'Funnel de conversión', marks: 'P' },
      { name: 'Exportable a CSV', marks: 'P' },
    ],
  },
  {
    label: 'Soporte y plataforma',
    features: [
      { name: 'App iOS', marks: 'OFP' },
      { name: 'Soporte por email', marks: 'OFP' },
      { name: 'Soporte prioritario (respuesta <24h)', marks: 'P' },
    ],
  },
]

// ──────────────────────────────────────────────────────────────────────
// Definición de los planes (metadata + highlights para vista simple)
// ──────────────────────────────────────────────────────────────────────
type BillingCycle = 'monthly' | 'annual'

interface PlanDef {
  id: PlanId
  name: string
  /** Precio en céntimos. 0 para gratis. */
  monthlyCents: number
  /** Precio anual en céntimos. Si null, plan no tiene opción anual (gratuitos). */
  annualCents: number | null
  period: string  // ej. "Gratis siempre"  o ""  (cuando el precio se calcula)
  maxDogs: string
  forWho: string
  description: string
  icon: typeof Dog
  accent: string
  accentBg: string
  highlights: string[]
  /** Ancla de valor: línea destacada que aparece ENCIMA de las bullets
   *  (ej. "sustituye tu web + CRM + Mailchimp..."). Opcional. */
  valueAnchor?: string
  highlight?: boolean
  ctaLabel: string
  ctaHref?: string
}

/**
 * Formatea precio según ciclo. Para anual mostramos el equivalente
 * mensual (mejor UX: el usuario compara peras con peras), con un chip
 * "facturado anual" debajo.
 */
function fmtPrice(plan: PlanDef, cycle: BillingCycle): { amount: string; per: string; sub: string | null } {
  if (plan.monthlyCents === 0) {
    return { amount: '0€', per: plan.period, sub: null }
  }
  if (cycle === 'monthly') {
    return {
      amount: `${plan.monthlyCents / 100}€`,
      per: '/mes',
      sub: plan.id === 'pro' ? '14 días gratis · sin tarjeta' : null,
    }
  }
  // Anual: enseñamos /mes con descuento aplicado + total
  const annual = plan.annualCents ?? plan.monthlyCents * 12
  const perMonth = Math.round(annual / 12 / 100)
  return {
    amount: `${perMonth}€`,
    per: '/mes',
    sub: `${annual / 100}€/año · 2 meses gratis`,
  }
}

const PLANS: PlanDef[] = [
  {
    id: 'owner',
    name: 'Owner',
    monthlyCents: 0,
    annualCents: null,
    period: 'Gratis siempre',
    maxDogs: 'Perros ilimitados',
    forWho: 'Para documentar tus perros',
    description: 'Sube su ficha, guarda su genealogía y enseña su carnet con un link.',
    icon: Dog,
    accent: '#3b82f6',
    accentBg: 'from-blue-50 via-canvas to-sky-50',
    highlights: [
      'Perros ilimitados, gratis para siempre',
      'Árbol genealógico interactivo, generaciones ilimitadas',
      'Cartilla veterinaria + recordatorios de vacunas',
      'Galería ilimitada de fotos + palmarés',
      'Importador IA: pega URL → árbol completo en 30s',
      'App iOS y soporte por email',
    ],
    ctaLabel: 'Crear cuenta gratis',
    ctaHref: '/register?intent=owner',
  },
  {
    id: 'free',
    name: 'Kennel Free',
    monthlyCents: 0,
    annualCents: null,
    period: 'Gratis siempre',
    maxDogs: 'Perros ilimitados',
    forWho: 'Para el criador casero',
    description: 'Todo Owner + camadas + contratos. Ves cuántas solicitudes recibes (el embudo completo es de Pro). Sin tarjeta.',
    icon: Store,
    accent: '#10b981',
    accentBg: 'from-emerald-50 via-canvas to-green-50',
    highlights: [
      'Perros ilimitados, gratis para siempre',
      'Perfil de criadero + afijo + marcar reproductores',
      'Camadas con un click + calendario reproductivo',
      'Contratos con firma electrónica',
      'Stud-book privado + estados de cachorros',
      'Ves el número de solicitudes que recibes',
    ],
    ctaLabel: 'Empezar gratis',
    ctaHref: '/register?intent=breeder&plan=free',
  },
  {
    id: 'pro',
    name: 'Kennel Pro',
    monthlyCents: 4900,  // 49€/mes
    annualCents: 49900,  // 499€/año = 41.6€/mes (-15%)
    period: '',
    maxDogs: 'Perros ilimitados',
    forWho: 'Para el criadero profesional',
    description: 'El panel completo: embudo de ventas, simulador de cruces, genotipos, estadísticas, CRM, contratos y visitas.',
    icon: Sparkles,
    accent: '#FE6620',
    accentBg: 'from-orange-50 via-canvas to-amber-50',
    highlight: true,
    valueAnchor: 'Sustituye tu web (≈15€/mes), tu CRM, Mailchimp (≈20€/mes) y al diseñador que te hace los PDFs de genealogía. Todo por 49€.',
    highlights: [
      'Embudo de ventas completo + CRM + contactos',
      'COI Wright + ancestros duplicados + comparativa con la raza',
      'Simulador de cruces (COI proyectado, color, riesgos)',
      'Genotipos y pruebas DNA',
      'Estadísticas web del criadero + contratos + visitas',
      'Soporte prioritario <24h',
      'Amplíalo con extensiones: web, newsletter y emailbot',
    ],
    ctaLabel: 'Probar 14 días gratis',
  },
]


// ──────────────────────────────────────────────────────────────────────
// Extensiones (add-ons à la carte SOBRE Kennel Pro). No son planes:
// se contratan aparte una vez tienes Pro.
// ──────────────────────────────────────────────────────────────────────
interface AddonDef {
  name: string
  monthlyCents: number
  description: string
  icon: typeof Dog
  accent: string
  accentBg: string
  comingSoon?: boolean
}

const ADDONS: AddonDef[] = [
  {
    name: 'Web del criadero',
    monthlyCents: 1900,  // 19€/mes
    description: 'Tu web pública profesional con dominio propio. Sobre nosotros, galería, blog, y todos tus perros y genealogías ya integrados.',
    icon: Globe,
    accent: '#8b5cf6',
    accentBg: 'from-violet-50 via-canvas to-purple-50',
  },
  {
    name: 'Newsletter',
    monthlyCents: 900,  // 9€/mes
    description: 'Campañas a tus clientes y lista de espera: anuncia camadas y novedades.',
    icon: Mail,
    accent: '#0ea5e9',
    accentBg: 'from-sky-50 via-canvas to-blue-50',
  },
  {
    name: 'Emailbot',
    monthlyCents: 1900,  // 19€/mes
    description: 'Asistente IA que responde consultas de cachorros 24/7 desde la biblioteca de tu criadero.',
    icon: Bot,
    accent: '#FE6620',
    accentBg: 'from-orange-50 via-canvas to-amber-50',
    comingSoon: true,
  },
]


// ──────────────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────────────
export default function PricingClient({
  isLoggedIn = false,
}: {
  isLoggedIn?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useT()

  // Vista: simple (default) o avanzada. Estado local como source of truth +
  // sync con URL via history.replaceState (sin disparar navegación de Next,
  // que era la causa de que el toggle no funcionara: router.replace sobre
  // el mismo path no fuerza re-render del Client Component).
  const initialView: 'simple' | 'avanzada' =
    searchParams.get('view') === 'avanzada' ? 'avanzada' : 'simple'
  const [view, setView] = useState<'simple' | 'avanzada'>(initialView)

  // Ciclo de facturación: mensual (default) o anual (-15%). Estado local.
  const initialCycle: BillingCycle = searchParams.get('cycle') === 'annual' ? 'annual' : 'monthly'
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle)
  void router // mantenemos router import por si se reintroduce navegación

  function switchView(next: 'simple' | 'avanzada') {
    setView(next)
    const url = new URL(window.location.href)
    url.searchParams.set('view', next)
    window.history.replaceState({}, '', url.toString())
  }

  function switchCycle(next: BillingCycle) {
    setCycle(next)
    const url = new URL(window.location.href)
    url.searchParams.set('cycle', next)
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-20">

        {/* Hero */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-4">
            <Sparkles className="w-3 h-3" />
            {t('Precios')}
          </div>
          <h1 className="font-semibold text-ink mb-4 tracking-tight" style={{ fontSize: 'clamp(28px, 5vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
            {t('Para tu perro, gratis para siempre. Para tu criadero, 49€.')}
          </h1>
          <p className="text-base sm:text-lg text-body max-w-2xl mx-auto leading-relaxed">
            {t('No cobramos por perro —sube todos los que quieras—. Solo pagas las herramientas profesionales cuando críes en serio.')}
          </p>
        </div>

        {/* Toggle Mensual / Anual — palanca principal de pricing.
            Pongo este toggle PRIMERO (antes del vista simple/avanzada)
            porque condiciona la decisión de compra. El badge "2 meses
            gratis" sobre "Anual" comunica el ahorro sin necesidad de leer copy.
            Solo se muestra cuando la vista lo necesita (planes de pago
            visibles — ambas vistas los muestran, así que siempre). */}
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="inline-flex rounded-xl border border-hairline bg-surface-soft p-1">
            <button
              onClick={() => switchCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                cycle === 'monthly'
                  ? 'bg-canvas text-ink shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'text-muted hover:text-body'
              }`}
            >
              {t('Mensual')}
            </button>
            <button
              onClick={() => switchCycle('annual')}
              className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition ${
                cycle === 'annual'
                  ? 'bg-canvas text-ink shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'text-muted hover:text-body'
              }`}
            >
              {t('Anual')}
              <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px] font-bold">
                {t('2 meses gratis')}
              </span>
            </button>
          </div>
        </div>

        {/* Toggle Simple / Avanzada */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="inline-flex rounded-xl border border-hairline bg-surface-soft p-1">
            <button
              onClick={() => switchView('simple')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                view === 'simple'
                  ? 'bg-canvas text-ink shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'text-muted hover:text-body'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('Vista simple')}
            </button>
            <button
              onClick={() => switchView('avanzada')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                view === 'avanzada'
                  ? 'bg-canvas text-ink shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'text-muted hover:text-body'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              {t('Comparativa completa')}
            </button>
          </div>
        </div>

        {view === 'simple' ? (
          <SimpleView isLoggedIn={isLoggedIn} cycle={cycle} />
        ) : (
          <AdvancedView isLoggedIn={isLoggedIn} cycle={cycle} />
        )}

        {/* Perros ilimitados — nota en cristiano (visible en ambas vistas) */}
        <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-blue-200 bg-blue-50/40 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-900 mb-1.5">
                {t('Perros ilimitados en todos los planes')}
              </p>
              <p className="text-[13.5px] text-blue-900/80 leading-relaxed">
                {t('Sube todos los perros que quieras —reproductores, camadas, retirados o fallecidos— sin límite ni coste extra, incluso en Owner y Kennel Free. No cobramos por perro: pagas por las')}{' '}<strong>{t('herramientas de criadero')}</strong>{t(' (embudo de ventas, contratos, simulador de cruces, genotipos y estadísticas), y por las extensiones que añadas. El propietario es gratis para siempre.')}
              </p>
            </div>
          </div>
        </div>

        {/* Extensiones (add-ons à la carte sobre Pro) */}
        <AddonsSection />

        {/* FAQ */}
        <FAQ />

        {/* Volver */}
        <p className="text-center mt-10 sm:mt-12 text-sm">
          <Link href="/" className="text-muted hover:text-ink underline">
            {t('Volver a Genealogic')}
          </Link>
        </p>
      </div>
    </main>
  )
}


// ──────────────────────────────────────────────────────────────────────
// Vista 1 — Simple ("en cristiano")
// ──────────────────────────────────────────────────────────────────────
function SimpleView({ isLoggedIn, cycle }: { isLoggedIn: boolean; cycle: BillingCycle }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
      {PLANS.map((plan) => (
        <PlanCard key={plan.id} plan={plan} isLoggedIn={isLoggedIn} cycle={cycle} />
      ))}
    </div>
  )
}

function PlanCard({ plan, isLoggedIn, cycle }: { plan: PlanDef; isLoggedIn: boolean; cycle: BillingCycle }) {
  const t = useT()
  const Icon = plan.icon
  const priceInfo = fmtPrice(plan, cycle)
  return (
    <div
      className={`relative rounded-2xl border-2 bg-gradient-to-br ${plan.accentBg} p-5 sm:p-6 flex flex-col ${
        plan.highlight ? 'shadow-[0_12px_48px_rgba(254,102,32,0.18)]' : 'border-hairline'
      }`}
      style={plan.highlight ? { borderColor: plan.accent } : {}}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-5 inline-flex items-center rounded-full text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: plan.accent }}>
          {t('Más popular')}
        </span>
      )}

      {/* Icono */}
      <div className="inline-flex w-10 h-10 rounded-xl items-center justify-center mb-4" style={{ background: `${plan.accent}20`, color: plan.accent }}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Nombre y para quién */}
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: plan.accent }}>
        {t(plan.forWho)}
      </p>
      <h2 className="text-[20px] sm:text-[22px] font-bold text-ink mt-1 leading-tight">
        {plan.name}
      </h2>

      {/* Precio */}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[32px] sm:text-[36px] font-bold tabular-nums text-ink leading-none">
          {priceInfo.amount}
        </span>
        <span className="text-[12px] text-muted">{priceInfo.per}</span>
      </div>
      {priceInfo.sub && (
        <p className="mt-1 text-[11px] text-muted leading-tight">{priceInfo.sub}</p>
      )}

      {/* Perros ilimitados badge (mismo en todos los planes) */}
      <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-canvas/80 border border-hairline px-2.5 py-0.5 text-[11px] font-semibold text-ink">
        <Dog className="w-3 h-3" />
        {t(plan.maxDogs)}
      </div>

      {/* Descripción */}
      <p className="mt-3 text-[13px] text-body leading-relaxed">
        {t(plan.description)}
      </p>

      {/* Ancla de valor (línea destacada encima de las bullets) */}
      {plan.valueAnchor && (
        <p
          className="mt-4 rounded-xl border bg-canvas/70 px-3 py-2.5 text-[12.5px] font-semibold leading-snug text-ink"
          style={{ borderColor: `${plan.accent}40` }}
        >
          {t(plan.valueAnchor)}
        </p>
      )}

      {/* Highlights */}
      <ul className="mt-5 space-y-2 flex-1">
        {plan.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-[12.5px] text-body leading-snug">
            <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: plan.accent }} />
            <span>{t(h)}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-6">
        {plan.ctaHref ? (
          <Button
            href={plan.ctaHref}
            variant={plan.highlight ? 'primary' : 'secondary'}
            size="md"
            className="w-full"
          >
            {t(plan.ctaLabel)}
          </Button>
        ) : (
          <CheckoutButton
            plan="pro"
            cadence={cycle}
            label={t(plan.ctaLabel)}
            isLoggedIn={isLoggedIn}
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl text-on-primary px-5 py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition`}
            style={{ background: plan.accent }}
          />
        )}
        {plan.id === 'pro' && (
          <p className="mt-2 text-[10.5px] text-muted text-center">
            {t('Sin tarjeta para empezar el trial · Cancela cuando quieras')}
          </p>
        )}
      </div>
    </div>
  )
}


// ──────────────────────────────────────────────────────────────────────
// Vista 2 — Avanzada (tabla completa)
// ──────────────────────────────────────────────────────────────────────
function AdvancedView({ isLoggedIn, cycle }: { isLoggedIn: boolean; cycle: BillingCycle }) {
  const t = useT()
  return (
    <div className="space-y-6">
      {/* Header de la tabla con precios resumidos */}
      <div className="rounded-2xl border border-hairline bg-canvas overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft/40">
              <th className="text-left px-4 py-4 font-semibold text-muted text-[11px] uppercase tracking-wider w-[40%]">
                {t('Característica')}
              </th>
              {PLANS.map((plan) => {
                const Icon = plan.icon
                const priceInfo = fmtPrice(plan, cycle)
                return (
                  <th key={plan.id} className="px-3 py-4 text-center" style={{ background: plan.highlight ? `${plan.accent}08` : undefined }}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="inline-flex w-7 h-7 rounded-lg items-center justify-center" style={{ background: `${plan.accent}20`, color: plan.accent }}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[12.5px] font-bold text-ink leading-tight">{plan.name}</p>
                      <p className="text-[16px] font-bold tabular-nums text-ink leading-none">{priceInfo.amount}</p>
                      <p className="text-[10px] text-muted leading-none">{priceInfo.per}</p>
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: plan.accent }}>{t(plan.maxDogs)}</p>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => (
              <CategorySection key={cat.label} cat={cat} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-hairline">
              <td className="px-4 py-4"></td>
              {PLANS.map((plan) => (
                <td key={plan.id} className="px-3 py-4 text-center" style={{ background: plan.highlight ? `${plan.accent}08` : undefined }}>
                  {plan.ctaHref ? (
                    <Link
                      href={plan.ctaHref}
                      className="inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-[12px] font-bold transition text-on-primary hover:opacity-90"
                      style={{ background: plan.accent }}
                    >
                      {t(plan.ctaLabel)} <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <CheckoutButton
                      plan="pro"
                      cadence={cycle}
                      label={t(plan.ctaLabel)}
                      isLoggedIn={isLoggedIn}
                      className="inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-[12px] font-bold transition text-on-primary hover:opacity-90"
                      style={{ background: plan.accent }}
                    />
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function CategorySection({ cat }: { cat: CategoryDef }) {
  const t = useT()
  return (
    <>
      <tr>
        <td colSpan={4} className="px-4 py-2.5 bg-[#FE6620]/10 border-y border-[#FE6620]/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#FE6620]">
            {t(cat.label)}
          </p>
        </td>
      </tr>
      {cat.features.map((feat, idx) => (
        <tr key={feat.name} className={`border-b border-hairline last:border-0 ${idx % 2 === 1 ? 'bg-surface-soft/20' : ''}`}>
          <td className="px-4 py-2.5 text-[13px] text-ink">{t(feat.name)}</td>
          {PLANS.map((plan) => {
            const included = feat.marks.includes(PLAN_CODES[plan.id])
            return (
              <td
                key={plan.id}
                className="px-3 py-2.5 text-center"
                style={{ background: plan.highlight ? `${plan.accent}08` : undefined }}
              >
                {included ? (
                  <Check className="w-4 h-4 inline" style={{ color: plan.accent }} />
                ) : (
                  <Minus className="w-3 h-3 inline text-muted/40" />
                )}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}


// ──────────────────────────────────────────────────────────────────────
// Extensiones — add-ons à la carte sobre Kennel Pro
// ──────────────────────────────────────────────────────────────────────
function AddonsSection() {
  const t = useT()
  return (
    <section className="mt-14 sm:mt-20 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FE6620]">{t('Extensiones')}</p>
        <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3vw, 32px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
          {t('Amplía tu Kennel Pro à la carte')}
        </h2>
        <p className="mt-3 text-[14px] sm:text-[15px] text-body max-w-2xl mx-auto leading-relaxed">
          {t('Añade solo lo que necesites, cuando lo necesites. Todas las extensiones requieren')}{' '}<strong>{t('Kennel Pro')}</strong>{t(' y se facturan aparte.')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {ADDONS.map((addon) => (
          <AddonCard key={addon.name} addon={addon} />
        ))}
      </div>
    </section>
  )
}

function AddonCard({ addon }: { addon: AddonDef }) {
  const t = useT()
  const Icon = addon.icon
  return (
    <div className={`relative rounded-2xl border border-hairline bg-gradient-to-br ${addon.accentBg} p-5 sm:p-6 flex flex-col`}>
      {addon.comingSoon && (
        <span className="absolute -top-3 left-5 inline-flex items-center rounded-full bg-ink/85 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
          {t('Próximamente')}
        </span>
      )}

      {/* Icono */}
      <div className="inline-flex w-10 h-10 rounded-xl items-center justify-center mb-4" style={{ background: `${addon.accent}20`, color: addon.accent }}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Nombre */}
      <h3 className="text-[18px] sm:text-[20px] font-bold text-ink leading-tight">
        {addon.name}
      </h3>

      {/* Precio */}
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-[26px] sm:text-[30px] font-bold tabular-nums text-ink leading-none">
          {addon.monthlyCents / 100}€
        </span>
        <span className="text-[12px] text-muted">{t('/mes')}</span>
      </div>

      {/* Descripción */}
      <p className="mt-3 text-[13px] text-body leading-relaxed flex-1">
        {t(addon.description)}
      </p>

      {/* Requiere Pro */}
      <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-canvas/80 border border-hairline px-2.5 py-0.5 text-[11px] font-semibold text-muted">
        <Sparkles className="w-3 h-3" style={{ color: addon.accent }} />
        {t('Requiere Kennel Pro')}
      </div>

      {/* Estado */}
      {addon.comingSoon && (
        <p className="mt-4 text-[12px] font-semibold text-muted text-center">
          {t('Aún en construcción — próximamente disponible')}
        </p>
      )}
    </div>
  )
}


// ──────────────────────────────────────────────────────────────────────
// FAQ
// ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const t = useT()
  return (
    <section className="mt-14 sm:mt-20 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FE6620]">{t('FAQ')}</p>
        <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3vw, 32px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
          {t('Preguntas frecuentes')}
        </h2>
      </div>
      <div className="space-y-2">
        <FaqItem q={t('¿De verdad Owner y Free son gratis para siempre?')}>
          {t('Sí. Owner y Kennel Free no caducan ni piden tarjeta. La diferencia entre planes está en las herramientas (embudo de ventas completo, simulador, genotipos, estadísticas…), no en cuántos perros tienes — eso es ilimitado en todos. Cuando necesites más herramientas, te ofrecemos subir, pero nunca te empujamos.')}
        </FaqItem>
        <FaqItem q={t('¿Y los perros fallecidos?')}>
          {t('Cuando marcas un perro como fallecido (In Memoriam), Genealogic conserva su ficha con toda su genealogía, fotos y palmarés, y la oculta del directorio público. No hay ningún límite del que descontar: tienes perros ilimitados en todos los planes. Útil para propietarios que han tenido varios perros a lo largo de su vida y quieren documentarlos a todos. Los perros con más de 20 años se marcan automáticamente como fallecidos (puedes contradecirlo en los 30 días siguientes).')}
        </FaqItem>
        <FaqItem q={t('¿Cómo funciona la prueba de 14 días de Pro?')}>
          {t('Te das de alta sin tarjeta. Durante 14 días tienes acceso completo al plan. El día 13 te avisamos por email. El día 14 te pedimos tarjeta para seguir. Si no pagas, vuelves automáticamente a Free (tus datos se mantienen intactos).')}
        </FaqItem>
        <FaqItem q={t('¿Qué son las extensiones?')}>
          {t('Son add-ons que se contratan aparte sobre Kennel Pro, para que pagues solo lo que usas: la Web del criadero (19€/mes) te da una web pública con dominio propio; la Newsletter (9€/mes) te deja lanzar campañas y gestionar lista de espera; y el Emailbot (19€/mes, próximamente) es un asistente IA que responde consultas de cachorros 24/7. Las activas y las cancelas cuando quieras desde tu panel.')}
        </FaqItem>
        <FaqItem q={t('¿Puedo cambiar de plan en cualquier momento?')}>
          {t('Sí, sube o baja cuando quieras. Si subes, el cobro es prorrateado. Si bajas, los cambios se aplican al final del periodo facturado. Tus datos siguen siempre seguros — solo cambian las features disponibles.')}
        </FaqItem>
        <FaqItem q={t('¿Owner vs Kennel Free — cuál elegir?')}>
          {t('Ambos son gratis y con perros ilimitados — la diferencia son las herramientas de criadero. Owner es para el particular que documenta a sus perros: ficha, genealogía, cartilla y galería. Kennel Free es para el criador casero que además gestiona camadas, reservas y contratos (afijo, pipeline, CRM y stud-book privado). Si tienes un macho semental y una hembra y os llega una camada, Free.')}
        </FaqItem>
        <FaqItem q={t('¿Cancelo cuando quiero?')}>
          {t('Sí, sin penalizaciones, sin permanencia. Cancelas desde tu panel y sigues con Pro (y sus extensiones) hasta el final del periodo pagado. Después bajas a Kennel Free automáticamente (no pierdes datos).')}
        </FaqItem>
        <FaqItem q={t('¿Mis datos son míos? ¿Puedo exportarlos?')}>
          {t('Sí. Cualquier perro, genealogía, contrato o cliente lo exportas a PDF/CSV en un click. Servidores en EU, RGPD por defecto. Si te vas de Genealogic, te llevas tus datos.')}
        </FaqItem>
      </div>
    </section>
  )
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-hairline last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left text-ink hover:opacity-80"
      >
        <span className="text-[14.5px] sm:text-[15.5px] font-semibold">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-4 text-[13.5px] sm:text-[14.5px] text-body leading-relaxed">{children}</div>}
    </div>
  )
}
