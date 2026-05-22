import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Precios · Genealogic',
  description: 'Genealogic es gratis para siempre. El tier Pro añade las herramientas que un criador profesional necesita.',
}

interface Tier {
  name: string
  price: string
  period: string
  description: string
  cta: string
  ctaHref: string
  highlight?: boolean
  features: string[]
}

const tiers: Tier[] = [
  {
    name: 'Free',
    price: '0€',
    period: 'Para siempre',
    description: 'Registro genealógico, pedigree, perfil público y app móvil.',
    cta: 'Crear cuenta',
    ctaHref: '/register',
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
    name: 'Pro',
    price: '39€',
    period: '/mes · Precio Founder',
    description: 'Las herramientas de Pawdoq Breeders dentro de Genealogic. Para criadores con afijo.',
    cta: 'Suscribirme',
    ctaHref: '/register?plan=pro',
    highlight: true,
    features: [
      'Todo lo del plan Free',
      'Pipeline de reservas (Kanban)',
      'Gestión de clientes y lista de espera',
      'Mini-sitio con custom domain',
      'Contratos de reserva con e-firma',
      'Emailbot automático para consultas',
      'Newsletter a tu lista de espera',
      'Estadísticas del perfil público',
    ],
  },
  {
    name: 'Premium',
    price: '149€',
    period: '/mes',
    description: 'Multi-kennel + API + verificación oficial incluida. Criaderos grandes.',
    cta: 'Hablemos',
    ctaHref: 'mailto:hola@genealogic.io?subject=Plan%20Premium',
    features: [
      'Todo lo del plan Pro',
      'Multi-kennel (varios afijos)',
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
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-4">
            <Sparkles className="w-3 h-3" />
            Tier Pro disponible
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map(tier => (
            <div
              key={tier.name}
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
                {tier.features.map(f => (
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
            </div>
          ))}
        </div>

        <div className="text-center mt-12 text-sm text-muted">
          <p>
            Add-ons disponibles: verificación oficial 25–50€, featured listing 20€/mes, custom domain 10€/mes.
          </p>
          <p className="mt-2">
            <Link href="/" className="text-body hover:text-ink underline">
              Volver a Genealogic
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
