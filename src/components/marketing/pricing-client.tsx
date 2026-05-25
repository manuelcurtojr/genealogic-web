/**
 * PricingClient — UI de /pricing con toggle Criador/Propietario.
 *
 * Mantiene la sincronización con la URL (?for=) para que sea bookmarkable
 * y deep-linkable desde ads/landings.
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Sparkles, ArrowRight, Search, Dog, Store, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CheckoutButton from '@/components/billing/checkout-button'

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
  manualSales?: boolean
}

const breederTiers: Tier[] = [
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
      'Pipeline de reservas (vistas Ventas/Clientes + filtros por estado)',
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

const ownerFeatures = [
  'Ficha completa de cada perro (foto, microchip, color, medidas)',
  'Pedigree y árbol genealógico verificable hasta 5 generaciones',
  'Papeles digitalizados (cartilla, contrato, certificado)',
  'Calendario veterinario con recordatorios automáticos',
  'Historial clínico buscable',
  'Reclama el perfil de tu perro si está importado en el catálogo',
  'Vincula tu reserva con criaderos de la plataforma',
  'App móvil con tus papeles offline (próximamente)',
]

export default function PricingClient({
  initialTab,
  isLoggedIn = false,
}: {
  initialTab: 'breeder' | 'owner'
  isLoggedIn?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'breeder' | 'owner'>(initialTab)

  useEffect(() => {
    const fromUrl = searchParams.get('for')
    if (fromUrl === 'owner' || fromUrl === 'breeder') setTab(fromUrl)
  }, [searchParams])

  function switchTab(next: 'breeder' | 'owner') {
    setTab(next)
    const url = new URL(window.location.href)
    url.searchParams.set('for', next)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-4">
            <Sparkles className="w-3 h-3" />
            Precios
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-ink mb-4 tracking-tight">
            Gratis para empezar. Siempre.
          </h1>
          <p className="text-lg text-body max-w-2xl mx-auto">
            Genealogic es gratis para propietarios. Los criadores tienen un tier free completo
            y planes de pago opcionales para herramientas profesionales.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-xl border border-hairline bg-surface-soft p-1">
            <button
              onClick={() => switchTab('breeder')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === 'breeder'
                  ? 'bg-canvas text-ink shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'text-muted hover:text-body'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Soy criador
            </button>
            <button
              onClick={() => switchTab('owner')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === 'owner'
                  ? 'bg-canvas text-ink shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'text-muted hover:text-body'
              }`}
            >
              <Dog className="w-3.5 h-3.5" />
              Soy propietario
            </button>
          </div>
        </div>

        {/* Contenido según tab */}
        {tab === 'breeder' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {breederTiers.map((tier) => (
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

                  {tier.id === 'pro' || tier.id === 'premium' ? (
                    tier.manualSales ? (
                      <Button
                        href={tier.ctaHref}
                        variant={tier.highlight ? 'primary' : 'secondary'}
                        size="md"
                        className="w-full"
                      >
                        {tier.cta}
                      </Button>
                    ) : (
                      <CheckoutButton
                        plan={tier.id}
                        label={tier.cta}
                        isLoggedIn={isLoggedIn}
                        className={
                          tier.highlight
                            ? 'inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition'
                            : 'inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-hairline bg-canvas text-ink px-5 py-3 text-sm font-bold hover:border-ink/40 disabled:opacity-50 transition'
                        }
                      />
                    )
                  ) : (
                    <Button
                      href={tier.ctaHref}
                      variant={tier.highlight ? 'primary' : 'secondary'}
                      size="md"
                      className="w-full"
                    >
                      {tier.cta}
                    </Button>
                  )}
                  {!tier.manualSales && tier.id !== 'free' && (
                    <p className="mt-2 text-[11px] text-muted text-center">
                      {isLoggedIn
                        ? 'Pago seguro con Stripe · Cancela cuando quieras'
                        : `Crea tu cuenta y activa ${tier.name}`}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center mt-10 text-sm text-muted">
              Add-ons disponibles: verificación oficial 25–50€ · featured listing 20€/mes
              · custom domain 10€/mes.
            </p>

            <div className="mt-16 max-w-2xl mx-auto rounded-2xl border border-hairline bg-canvas p-6 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-card mb-3">
                <Search className="w-5 h-5 text-ink" />
              </div>
              <h2 className="text-lg font-bold text-ink mb-1">¿Buscas un cachorro?</h2>
              <p className="text-sm text-body mb-4">
                Explora el directorio de criaderos verificados, mira sus camadas y contacta directamente.
              </p>
              <Link
                href="/kennels"
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink"
              >
                Explorar criaderos
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        ) : (
          /* Tab Owner */
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border-2 border-ink bg-canvas p-8 lg:p-10 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-[#FE6620]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FE6620]">
                  Gratis para siempre
                </span>
              </div>
              <h2 className="text-3xl font-bold text-ink mb-2">Owner</h2>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-bold text-ink">0€</span>
                <span className="text-sm text-muted">/mes</span>
              </div>
              <p className="text-sm text-body mb-8 leading-relaxed">
                Todo lo que necesita un propietario para documentar a su perro. Sin tarjeta,
                sin trials, sin upsells. La plataforma se sostiene con los criadores que pagan
                — tú nunca.
              </p>

              <ul className="space-y-3 mb-8">
                {ownerFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[15px] text-body">
                    <Check className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                href="/register?intent=owner"
                variant="primary"
                size="md"
                className="w-full"
              >
                Crear mi cuenta gratis
              </Button>
              <p className="mt-3 text-[11px] text-muted text-center">
                Sin tarjeta · Sin límite de perros · Sin anuncios
              </p>
            </div>

            <div className="mt-8 text-center text-sm text-body">
              ¿Tu perro ya está en Genealogic? <Link href="/search" className="text-ink underline font-semibold">Búscalo y reclámalo</Link>.
            </div>
          </div>
        )}

        <p className="text-center mt-12 text-sm">
          <Link href="/" className="text-muted hover:text-ink underline">
            Volver a Genealogic
          </Link>
        </p>
      </div>
    </main>
  )
}
