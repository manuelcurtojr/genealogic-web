/**
 * /pricing — página pública con 3 planes + entrada al flujo de signup
 * intent-aware. Cada CTA pasa el `plan` y `intent=breeder` al register,
 * que luego propaga al onboarding (/kennel/new) y eventualmente a Stripe
 * Checkout (cuando esté activo).
 *
 * Footer especial para visitantes que NO son criadores: link a /kennels
 * para que exploren el directorio sin necesidad de registro.
 */
import Link from 'next/link'
import { Check, Sparkles, ArrowRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Precios · Genealogic',
  description: 'Genealogic es gratis para siempre. El tier Pro añade las herramientas que un criador profesional necesita para vender más.',
}

interface Tier {
  id: 'free' | 'pro' | 'premium'
  name: string
  price: string
  period: string
  description: string
  cta: string
  ctaHref: string
  highlight?: boolean
  features: string[]
  /** Si es true, el CTA va a un mailto en lugar del flujo de signup */
  manualSales?: boolean
}

const tiers: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0€',
    period: 'Para siempre',
    description: 'Registro genealógico, pedigree, perfil público y app móvil. Sin tarjeta.',
    cta: 'Empezar gratis',
    ctaHref: '/register?intent=breeder&plan=free',
    features: [
      'Registro ilimitado de perros',
      'Pedigree completo con cálculo COI',
      'Importador desde PresaDB, k9data, ingrus',
      'Perfil público del perro y del criador',
      'Búsqueda global y mobile app',
      'Calendario reproductivo y vet records',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '39€',
    period: '/mes · Precio Founder',
    description: 'Las herramientas que un criador profesional necesita para vender mejor.',
    cta: 'Empezar Pro',
    ctaHref: '/register?intent=breeder&plan=pro',
    highlight: true,
    features: [
      'Todo lo del plan Free',
      'Pipeline de reservas (Kanban con drag&drop)',
      'Gestión de clientes y lista de espera',
      'Mini-sitio con custom domain',
      'Contratos de reserva con e-firma',
      'Emailbot automático para consultas',
      'Newsletter a tu lista de espera',
      'Estadísticas del perfil público',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '149€',
    period: '/mes',
    description: 'Multi-kennel + API + verificación oficial incluida. Criaderos grandes.',
    cta: 'Hablar con nosotros',
    ctaHref: 'mailto:hola@genealogic.io?subject=Plan%20Premium',
    manualSales: true,
    features: [
      'Todo lo del plan Pro',
      'Multi-kennel (varios afijos en una cuenta)',
      'API B2B para integraciones',
      '5 verificaciones oficiales /mes',
      'Soporte prioritario',
      'Featured listing incluido',
    ],
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-4">
            <Sparkles className="w-3 h-3" />
            Para criadores serios
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-ink mb-4 tracking-tight">
            Datos gratis. Herramientas premium.
          </h1>
          <p className="text-lg text-body max-w-2xl mx-auto">
            El grafo genealógico de Genealogic es gratis para siempre. El tier Pro
            añade pipeline de reservas, mini-sitio, contratos y todo lo que necesita
            un criador profesional para vender mejor.
          </p>
        </div>

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-2xl border p-6 lg:p-8 flex flex-col ${
                tier.highlight
                  ? 'border-ink bg-canvas shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
                  : 'border-hairline bg-canvas'
              }`}
            >
              {tier.highlight && (
                <div className="inline-flex self-start items-center rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-on-primary mb-4">
                  Recomendado
                </div>
              )}
              <h2 className="text-xl font-bold text-ink mb-1">{tier.name}</h2>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-ink">{tier.price}</span>
              </div>
              <p className="text-xs text-muted mb-4">{tier.period}</p>
              <p className="text-sm text-body mb-6 leading-relaxed">{tier.description}</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-body">
                    <Check className="w-4 h-4 mt-0.5 text-ink flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                href={tier.ctaHref}
                variant={tier.highlight ? 'primary' : 'secondary'}
                size="md"
                className="w-full"
              >
                {tier.cta}
              </Button>
              {!tier.manualSales && tier.id !== 'free' && (
                <p className="mt-2 text-[11px] text-muted text-center">
                  Empiezas en plan Free; activas {tier.name} después de crear tu criadero.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <p className="text-center mt-10 text-sm text-muted">
          Add-ons disponibles: verificación oficial 25–50€ · featured listing 20€/mes
          · custom domain 10€/mes.
        </p>

        {/* CTA secundario: visitantes que buscan cachorro */}
        <div className="mt-16 max-w-2xl mx-auto rounded-2xl border border-hairline bg-canvas p-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-card mb-3">
            <Search className="w-5 h-5 text-ink" />
          </div>
          <h2 className="text-lg font-bold text-ink mb-1">¿Buscas un cachorro?</h2>
          <p className="text-sm text-body mb-4">
            Genealogic no es solo para criadores. Explora el directorio de criaderos
            verificados, mira sus camadas y contacta directamente.
          </p>
          <Link
            href="/kennels"
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink"
          >
            Explorar criaderos
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-center mt-10 text-sm">
          <Link href="/" className="text-muted hover:text-ink underline">
            Volver a Genealogic
          </Link>
        </p>
      </div>
    </main>
  )
}
