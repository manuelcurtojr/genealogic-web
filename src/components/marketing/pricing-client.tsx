/**
 * PricingClient — /pricing con 4 planes y vista simple/avanzada.
 *
 * Modelo cerrado 2026-05-28:
 *   · Owner — 3 perros · Gratis
 *   · Kennel Free — 5 perros · Gratis
 *   · Kennel Pro — Ilimitado · 49€/mes (14 días de prueba)
 *   · Kennel Enterprise — Ilimitado · 99€/mes (14 días de prueba)
 *
 * Vistas:
 *   1) Simple ("en cristiano") — 4 cards grandes con 5-6 highlights por plan
 *   2) Avanzada — tabla completa con TODAS las features marcadas por plan,
 *      agrupadas en 10 categorías
 *
 * Regla del límite (CRÍTICA, explicada en una nota visible):
 *   Un perro cuenta SI es tuyo + tiene más de 90 días + NO está marcado
 *   "Disponible" ni "Reservado" + NO está fallecido.
 *
 * El plan completo del modelo está en
 * memory/genealogic_pricing_model.md.
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check, Sparkles, ArrowRight, Dog, Store, Crown, Building2,
  Minus, Info, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import CheckoutButton from '@/components/billing/checkout-button'

type PlanId = 'owner' | 'free' | 'pro' | 'enterprise'

// ──────────────────────────────────────────────────────────────────────
// Matriz de features — sincronizada con el PDF de planes y con la
// memoria genealogic_pricing_model.md. Cada feature lleva la lista de
// planes en los que está disponible.
// Las cadenas "OFPE" representan los 4 planes: Owner / Free / Pro / Ent.
// ──────────────────────────────────────────────────────────────────────
const PLAN_CODES: Record<PlanId, string> = {
  owner: 'O',
  free: 'F',
  pro: 'P',
  enterprise: 'E',
}

interface FeatureRow { name: string; marks: string }
interface CategoryDef { label: string; features: FeatureRow[] }

const CATEGORIES: CategoryDef[] = [
  {
    label: 'Plataforma',
    features: [
      { name: 'Perfil del perro indexable en Google', marks: 'OFPE' },
      { name: 'Importador de genealogías con IA (URL → árbol completo)', marks: 'OFPE' },
      { name: 'Histórico de cambios por perro (auditoría)', marks: 'OFPE' },
      { name: 'Sistema de moderación (soft-hide, reportes)', marks: 'OFPE' },
      { name: 'Exportar perfil completo a PDF', marks: 'OFPE' },
      { name: 'Perfiles privados o públicos por perro', marks: 'OFPE' },
      { name: 'Interfaz multi-idioma (ES, EN, IT, FR)', marks: 'OFPE' },
      { name: 'API pública REST', marks: 'E' },
    ],
  },
  {
    label: 'Genealogía',
    features: [
      { name: 'Árbol genealógico hasta 10 generaciones', marks: 'OFPE' },
      { name: 'COI Wright + lista de ancestros duplicados', marks: 'PE' },
      { name: 'Comparativa COI vs media de la raza', marks: 'PE' },
      { name: 'PDF de genealogía con tu marca', marks: 'PE' },
      { name: 'Hermanos y descendientes auto-detectados', marks: 'OFPE' },
      { name: 'Editor visual de genealogía', marks: 'OFPE' },
      { name: 'Campo de registro oficial (LOE, AKC, KC...)', marks: 'OFPE' },
    ],
  },
  {
    label: 'Cría y reproducción',
    features: [
      { name: 'Simulador de cruces (COI proyectado)', marks: 'PE' },
      { name: 'Predicción de color por genotipos', marks: 'PE' },
      { name: 'Calendario reproductivo (gantt anual de celos y partos)', marks: 'FPE' },
      { name: 'Camadas con un click (cachorros heredan padres + afijo)', marks: 'FPE' },
      { name: 'Stud-book privado del criadero', marks: 'FPE' },
      { name: 'Histórico de COI medio del criadero', marks: 'PE' },
    ],
  },
  {
    label: 'Salud y genética',
    features: [
      { name: 'Cartilla veterinaria digital', marks: 'OFPE' },
      { name: 'Recordatorios de vacunas (push + email)', marks: 'OFPE' },
      { name: 'Genotipos (locus E, B, K, D, A, S)', marks: 'PE' },
      { name: 'Pruebas raciales (DM, PLL, displasia, OFA)', marks: 'FPE' },
    ],
  },
  {
    label: 'Catálogo de perros',
    features: [
      { name: 'Galería ilimitada de fotos', marks: 'OFPE' },
      { name: 'Upscale IA de fotos', marks: 'OFPE' },
      { name: 'Palmarés y títulos (CAC, CACIB, BIS)', marks: 'OFPE' },
      { name: 'Transferir propietario en 1 click', marks: 'OFPE' },
      { name: 'Estados (reproductor, en venta, criado)', marks: 'FPE' },
      { name: 'Búsqueda y filtros avanzados', marks: 'OFPE' },
      { name: 'Marcar perro como fallecido (In Memoriam)', marks: 'OFPE' },
    ],
  },
  {
    label: 'Pipeline y CRM',
    features: [
      { name: 'Pipeline de reservas (tabla + tabs por estado)', marks: 'FPE' },
      { name: 'Plantillas de contrato reutilizables', marks: 'FPE' },
      { name: 'Firma electrónica básica', marks: 'FPE' },
      { name: 'Pagos integrados con Stripe Connect', marks: 'PE' },
      { name: 'Calendario de pagos (seña + parcial + final, manual)', marks: 'FPE' },
      { name: 'CRM unificado de clientes', marks: 'FPE' },
      { name: 'Registro de visitas al criadero', marks: 'PE' },
      { name: 'Notificaciones email + push iOS', marks: 'OFPE' },
    ],
  },
  {
    label: 'Web pública del kennel',
    features: [
      { name: 'Web profesional del criadero', marks: 'E' },
      { name: 'Dominio personalizado propio', marks: 'E' },
      { name: 'Blog integrado con SEO', marks: 'E' },
      // Reseñas y formulario de contacto se incluyen también en Pro:
      // el criador profesional necesita captar leads y mostrar prueba
      // social aunque su web la lleve en Enterprise.
      { name: 'Reseñas verificadas de clientes', marks: 'PE' },
      { name: 'Formulario de contacto configurable', marks: 'PE' },
      { name: 'Ubicación en mapa embebida', marks: 'E' },
      { name: 'Tema personalizable (colores, fuentes, hero)', marks: 'E' },
      { name: 'Web del criadero multi-idioma', marks: 'E' },
    ],
  },
  {
    label: 'Comunicación',
    features: [
      { name: 'Emailbot con IA (multilingüe)', marks: 'E' },
      { name: 'Newsletter con composer drag & drop', marks: 'E' },
      { name: 'Hilos de email por cliente', marks: 'FPE' },
      { name: 'Biblioteca de conocimiento (FAQs del bot)', marks: 'E' },
    ],
  },
  {
    label: 'Analítica y datos',
    features: [
      { name: 'Estadísticas en tiempo real', marks: 'FPE' },
      { name: 'Funnel de conversión', marks: 'FPE' },
      { name: 'Exportable a CSV', marks: 'FPE' },
    ],
  },
  {
    label: 'Soporte y plataforma',
    features: [
      { name: 'App iOS', marks: 'OFPE' },
      { name: 'Soporte por email', marks: 'OFPE' },
      { name: 'Soporte prioritario (respuesta <24h)', marks: 'PE' },
      { name: 'Onboarding personalizado', marks: 'E' },
      { name: 'Cuenta multi-usuario (team)', marks: 'E' },
      { name: 'White-label (sin marca Genealogic)', marks: 'E' },
      { name: 'Integraciones custom (API / Zapier)', marks: 'E' },
    ],
  },
]

// ──────────────────────────────────────────────────────────────────────
// Definición de los planes (metadata + highlights para vista simple)
// ──────────────────────────────────────────────────────────────────────
interface PlanDef {
  id: PlanId
  name: string
  price: string
  period: string
  maxDogs: string
  forWho: string
  description: string
  icon: typeof Dog
  accent: string  // color hex de marca
  accentBg: string  // tailwind classes para el fondo
  highlights: string[]
  highlight?: boolean   // recomendado
  ctaLabel: string
  ctaHref?: string  // si no, usa CheckoutButton
}

const PLANS: PlanDef[] = [
  {
    id: 'owner',
    name: 'Owner',
    price: '0€',
    period: 'Gratis siempre',
    maxDogs: '3 perros',
    forWho: 'Para documentar tu mascota',
    description: 'Sube su ficha, guarda su genealogía y enseña su carnet con un link.',
    icon: Dog,
    accent: '#3b82f6',
    accentBg: 'from-blue-50 via-canvas to-sky-50',
    highlights: [
      'Hasta 3 perros en plantilla',
      'Genealogía completa de 10 generaciones',
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
    price: '0€',
    period: 'Gratis siempre',
    maxDogs: '5 perros',
    forWho: 'Para el criador casero',
    description: 'Todo Owner + camadas + pipeline de reservas + contratos. Sin tarjeta.',
    icon: Store,
    accent: '#10b981',
    accentBg: 'from-emerald-50 via-canvas to-green-50',
    highlights: [
      'Hasta 5 perros en plantilla (el legal antes de núcleo zoológico)',
      'Camadas con un click + calendario reproductivo',
      'Pipeline de reservas con contratos y firma electrónica',
      'CRM unificado de clientes',
      'Estadísticas, funnel y export CSV',
      'Cachorros disponibles NO cuentan en el límite',
    ],
    ctaLabel: 'Empezar gratis',
    ctaHref: '/register?intent=breeder&plan=free',
  },
  {
    id: 'pro',
    name: 'Kennel Pro',
    price: '29€',
    period: '/mes · 14 días gratis',
    maxDogs: 'Ilimitado',
    forWho: 'Para el criadero profesional',
    description: 'Todo Free + perros ilimitados + COI explicado + simulador + Stripe.',
    icon: Sparkles,
    accent: '#FE6620',
    accentBg: 'from-orange-50 via-canvas to-amber-50',
    highlight: true,
    highlights: [
      'Perros ilimitados',
      'COI Wright + ancestros duplicados + comparativa con la raza',
      'Simulador de cruces (COI proyectado, color, riesgos)',
      'Genotipos y pruebas DNA',
      'Pagos con Stripe Connect (cobra señas y entregas)',
      'Reseñas verificadas + formulario de contacto',
      'Soporte prioritario <24h',
    ],
    ctaLabel: 'Probar 14 días gratis',
  },
  {
    id: 'enterprise',
    name: 'Kennel Enterprise',
    price: '149€',
    // No "14 días gratis": Enterprise hoy requiere aprobación manual
    // (chatbot + web del criadero aún en testing). El criador habla con
    // soporte y nosotros activamos a mano.
    period: '/mes · alta manual',
    maxDogs: 'Ilimitado',
    forWho: 'Para el criadero con escaparate público',
    description: 'Todo Pro + web profesional con dominio propio + emailbot IA + multi-idioma.',
    icon: Crown,
    accent: '#8b5cf6',
    accentBg: 'from-violet-50 via-canvas to-purple-50',
    highlights: [
      'Web del criadero con tu dominio + blog SEO',
      'Web multi-idioma (ES, EN, IT, FR)',
      'Emailbot IA que responde a leads 24/7',
      'Newsletter integrada + biblioteca de conocimiento',
      'Multi-usuario (team) + white-label + integraciones',
      'Onboarding personalizado + API pública REST',
    ],
    ctaLabel: 'Hablar con soporte',
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

  // Vista: simple (default) o avanzada. Estado local como source of truth +
  // sync con URL via history.replaceState (sin disparar navegación de Next,
  // que era la causa de que el toggle no funcionara: router.replace sobre
  // el mismo path no fuerza re-render del Client Component).
  const initialView: 'simple' | 'avanzada' =
    searchParams.get('view') === 'avanzada' ? 'avanzada' : 'simple'
  const [view, setView] = useState<'simple' | 'avanzada'>(initialView)
  void router // mantenemos router import por si se reintroduce navegación

  function switchView(next: 'simple' | 'avanzada') {
    setView(next)
    const url = new URL(window.location.href)
    url.searchParams.set('view', next)
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-20">

        {/* Hero */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-4">
            <Sparkles className="w-3 h-3" />
            Precios
          </div>
          <h1 className="font-semibold text-ink mb-4 tracking-tight" style={{ fontSize: 'clamp(28px, 5vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
            Empieza gratis. Sube cuando crezcas.
          </h1>
          <p className="text-base sm:text-lg text-body max-w-2xl mx-auto leading-relaxed">
            Owner y Kennel Free son gratis para siempre, sin tarjeta. Pro y
            Enterprise vienen con 14 días de prueba.
          </p>
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
              Vista simple
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
              Comparativa completa
            </button>
          </div>
        </div>

        {view === 'simple' ? (
          <SimpleView isLoggedIn={isLoggedIn} />
        ) : (
          <AdvancedView isLoggedIn={isLoggedIn} />
        )}

        {/* Regla del límite — explicación en cristiano (visible en ambas vistas) */}
        <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-blue-200 bg-blue-50/40 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-900 mb-1.5">
                ¿Cómo cuentan los perros en el límite?
              </p>
              <p className="text-[13.5px] text-blue-900/80 leading-relaxed">
                Un perro cuenta SI es tuyo, tiene más de 90 días, NO está
                marcado como &ldquo;Disponible&rdquo; o &ldquo;Reservado&rdquo;,
                y NO está fallecido. Es decir, cuentan tus <strong>reproductores
                y plantilla fija</strong>. Cachorros para venta, perros que
                ya transferiste a sus dueños y perros fallecidos
                <strong> no suman</strong>. Así un criador con 3 reproductoras
                en Free puede tener una camada de 8 cachorros sin pasarse del
                límite de 5.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <FAQ />

        {/* Volver */}
        <p className="text-center mt-10 sm:mt-12 text-sm">
          <Link href="/" className="text-muted hover:text-ink underline">
            Volver a Genealogic
          </Link>
        </p>
      </div>
    </main>
  )
}


// ──────────────────────────────────────────────────────────────────────
// Vista 1 — Simple ("en cristiano")
// ──────────────────────────────────────────────────────────────────────
function SimpleView({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {PLANS.map((plan) => (
        <PlanCard key={plan.id} plan={plan} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  )
}

function PlanCard({ plan, isLoggedIn }: { plan: PlanDef; isLoggedIn: boolean }) {
  const Icon = plan.icon
  return (
    <div
      className={`relative rounded-2xl border-2 bg-gradient-to-br ${plan.accentBg} p-5 sm:p-6 flex flex-col ${
        plan.highlight ? 'shadow-[0_12px_48px_rgba(254,102,32,0.18)]' : 'border-hairline'
      }`}
      style={plan.highlight ? { borderColor: plan.accent } : {}}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-5 inline-flex items-center rounded-full text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: plan.accent }}>
          Más popular
        </span>
      )}

      {/* Icono */}
      <div className="inline-flex w-10 h-10 rounded-xl items-center justify-center mb-4" style={{ background: `${plan.accent}20`, color: plan.accent }}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Nombre y para quién */}
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: plan.accent }}>
        {plan.forWho}
      </p>
      <h2 className="text-[20px] sm:text-[22px] font-bold text-ink mt-1 leading-tight">
        {plan.name}
      </h2>

      {/* Precio */}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[32px] sm:text-[36px] font-bold tabular-nums text-ink leading-none">
          {plan.price}
        </span>
        <span className="text-[12px] text-muted">{plan.period}</span>
      </div>

      {/* Max perros badge */}
      <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-canvas/80 border border-hairline px-2.5 py-0.5 text-[11px] font-semibold text-ink">
        <Dog className="w-3 h-3" />
        {plan.maxDogs}
      </div>

      {/* Descripción */}
      <p className="mt-3 text-[13px] text-body leading-relaxed">
        {plan.description}
      </p>

      {/* Highlights */}
      <ul className="mt-5 space-y-2 flex-1">
        {plan.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-[12.5px] text-body leading-snug">
            <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: plan.accent }} />
            <span>{h}</span>
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
            {plan.ctaLabel}
          </Button>
        ) : plan.id === 'enterprise' ? (
          // Enterprise: por ahora contacto directo hasta tener checkout activo
          <a
            href="mailto:hola@genealogic.io?subject=Kennel%20Enterprise"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border-2 px-5 py-3 text-sm font-bold transition hover:bg-canvas/50"
            style={{ borderColor: plan.accent, color: plan.accent }}
          >
            {plan.ctaLabel}
          </a>
        ) : (
          <CheckoutButton
            plan="pro"
            label={plan.ctaLabel}
            isLoggedIn={isLoggedIn}
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl text-on-primary px-5 py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition`}
            style={{ background: plan.accent }}
          />
        )}
        {plan.id === 'pro' && (
          <p className="mt-2 text-[10.5px] text-muted text-center">
            Sin tarjeta para empezar el trial · Cancela cuando quieras
          </p>
        )}
        {plan.id === 'enterprise' && (
          <p className="mt-2 text-[10.5px] text-muted text-center">
            Activación manual tras hablar con soporte · Cancela cuando quieras
          </p>
        )}
      </div>
    </div>
  )
}


// ──────────────────────────────────────────────────────────────────────
// Vista 2 — Avanzada (tabla completa)
// ──────────────────────────────────────────────────────────────────────
function AdvancedView({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="space-y-6">
      {/* Header de la tabla con precios resumidos */}
      <div className="rounded-2xl border border-hairline bg-canvas overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft/40">
              <th className="text-left px-4 py-4 font-semibold text-muted text-[11px] uppercase tracking-wider w-[40%]">
                Característica
              </th>
              {PLANS.map((plan) => {
                const Icon = plan.icon
                return (
                  <th key={plan.id} className="px-3 py-4 text-center" style={{ background: plan.highlight ? `${plan.accent}08` : undefined }}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="inline-flex w-7 h-7 rounded-lg items-center justify-center" style={{ background: `${plan.accent}20`, color: plan.accent }}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[12.5px] font-bold text-ink leading-tight">{plan.name}</p>
                      <p className="text-[16px] font-bold tabular-nums text-ink leading-none">{plan.price}</p>
                      <p className="text-[10px] text-muted leading-none">{plan.period}</p>
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: plan.accent }}>{plan.maxDogs}</p>
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
                      {plan.ctaLabel} <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : plan.id === 'enterprise' ? (
                    <a
                      href="mailto:hola@genealogic.io?subject=Kennel%20Enterprise"
                      className="inline-flex items-center justify-center gap-1 rounded-lg border-2 px-3 py-2 text-[12px] font-bold transition hover:bg-canvas/50"
                      style={{ borderColor: plan.accent, color: plan.accent }}
                    >
                      Contactar
                    </a>
                  ) : (
                    <CheckoutButton
                      plan="pro"
                      label={plan.ctaLabel}
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
  return (
    <>
      <tr>
        <td colSpan={5} className="px-4 py-2.5 bg-[#FE6620]/10 border-y border-[#FE6620]/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#FE6620]">
            {cat.label}
          </p>
        </td>
      </tr>
      {cat.features.map((feat, idx) => (
        <tr key={feat.name} className={`border-b border-hairline last:border-0 ${idx % 2 === 1 ? 'bg-surface-soft/20' : ''}`}>
          <td className="px-4 py-2.5 text-[13px] text-ink">{feat.name}</td>
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
// FAQ
// ──────────────────────────────────────────────────────────────────────
function FAQ() {
  return (
    <section className="mt-14 sm:mt-20 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FE6620]">FAQ</p>
        <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3vw, 32px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
          Preguntas frecuentes
        </h2>
      </div>
      <div className="space-y-2">
        <FaqItem q="¿De verdad Owner y Free son gratis para siempre?">
          Sí. Owner (3 perros) y Kennel Free (5 perros) no caducan. No te pedimos
          tarjeta. Si llegas al límite de tu plan y necesitas más, te ofrecemos
          subir — pero nunca te empujamos.
        </FaqItem>
        <FaqItem q="¿Qué pasa con los cachorros y el límite?">
          Los cachorros NO cuentan en tu límite mientras son lactantes (menos de
          90 días). Pasados los 90 días, si los marcas como &ldquo;Disponible&rdquo;
          o &ldquo;Reservado&rdquo;, siguen sin contar. Solo cuentan cuando los
          decides quedarte como parte de tu plantilla (reproductor / cría /
          retirado). Si los transfieres a sus dueños, pasan a contar a ese
          cliente, no a ti.
        </FaqItem>
        <FaqItem q="¿Y los perros fallecidos?">
          Cuando marcas un perro como fallecido (In Memoriam), deja de contar en
          tu límite pero su ficha sigue existiendo con toda su genealogía,
          fotos y palmarés. Útil para propietarios que han tenido varios perros
          a lo largo de su vida y quieren documentarlos a todos. Los perros con
          más de 20 años se marcan automáticamente como fallecidos (puedes
          contradecirlo en los 30 días siguientes).
        </FaqItem>
        <FaqItem q="¿Cómo funciona la prueba de 14 días de Pro?">
          Te das de alta sin tarjeta. Durante 14 días tienes acceso completo
          al plan. El día 13 te avisamos por email. El día 14 te pedimos
          tarjeta para seguir. Si no pagas, vuelves automáticamente a Free
          (tus datos se mantienen intactos).
        </FaqItem>
        <FaqItem q="¿Y Enterprise? ¿También 14 días gratis?">
          Enterprise se activa manualmente tras hablar con soporte
          (hola@genealogic.io). De momento estamos validando el chatbot y la
          web del criadero con un grupo cerrado de Founders. Si lo quieres
          probar, escríbenos y te activamos la cuenta en menos de 24h. Pasaremos
          a auto-servicio cuando esté pulido.
        </FaqItem>
        <FaqItem q="¿Puedo cambiar de plan en cualquier momento?">
          Sí, sube o baja cuando quieras. Si subes, el cobro es prorrateado.
          Si bajas, los cambios se aplican al final del periodo facturado.
          Tus datos siguen siempre seguros — solo cambian las features
          disponibles.
        </FaqItem>
        <FaqItem q="¿Owner vs Kennel Free — cuál elegir?">
          Owner es para propietarios particulares que solo documentan a sus
          mascotas (hasta 3 perros). Kennel Free es para criadores caseros
          o aficionados que ya manejan camadas, reservas y contratos (hasta
          5 perros — el límite legal antes de núcleo zoológico). Si tienes
          un macho semental y una hembra y os llega una camada, Free.
        </FaqItem>
        <FaqItem q="¿Cancelo cuando quiero?">
          Sí, sin penalizaciones, sin permanencia. Cancelas desde tu panel
          y sigues con Pro/Enterprise hasta el final del periodo pagado.
          Después bajas a Kennel Free automáticamente (no pierdes datos).
        </FaqItem>
        <FaqItem q="¿Mis datos son míos? ¿Puedo exportarlos?">
          Sí. Cualquier perro, genealogía, contrato o cliente lo exportas a
          PDF/CSV en un click. Servidores en EU, RGPD por defecto. Si te vas
          de Genealogic, te llevas tus datos.
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
