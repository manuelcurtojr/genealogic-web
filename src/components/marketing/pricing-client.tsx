/**
 * PricingClient — /pricing con toggle Criador/Propietario y los 3 tiers nuevos.
 *
 * Propietario: gratis para siempre. Sin tiers.
 * Criador: Free / Kennel (29€) / Kennel Pro Founder (49€).
 *   - Kennel: pipeline reservas, contratos, vet, importer IA
 *   - Kennel Pro: web pública, emailbot, newsletter, pagos online
 *     (algunas features en Early Access — precio Founder congelado de
 *     por vida durante el lanzamiento).
 *
 * Las genealogías son siempre completas, sin importar el plan.
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Sparkles, ArrowRight, Search, Dog, Store, Heart, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CheckoutButton from '@/components/billing/checkout-button'

interface Tier {
  id: 'free' | 'kennel' | 'kennel_pro'
  name: string
  price: string
  period: string
  description: string
  cta: string
  ctaHref?: string
  highlight?: boolean
  founderBadge?: boolean
  /** Si true, el plan se muestra como "Próximamente" — sin CTA accionable. */
  comingSoon?: boolean
  features: string[]
}

const breederTiers: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0€',
    period: 'Para siempre',
    description: 'Publica tu criadero y empieza a documentar a tus perros. Sin tarjeta.',
    cta: 'Empezar gratis',
    ctaHref: '/register?intent=breeder&plan=free',
    features: [
      'Perfil público del criadero',
      'Hasta 10 perros con ficha completa',
      'Genealogía completa (sin límite de generaciones)',
      'Indexable en Google',
      'Formulario de contacto público',
      'App móvil (cuando salga)',
    ],
  },
  {
    id: 'kennel',
    name: 'Kennel',
    price: '29€',
    period: '/mes · 290€/año',
    description: 'Las herramientas que un criador profesional usa cada día. Prueba 15 días gratis.',
    cta: 'Probar 15 días gratis',
    highlight: true,
    features: [
      'Todo lo del plan Free',
      'Perros y camadas ilimitadas',
      'Pipeline de reservas (kanban)',
      'Mensajería con clientes (sin email)',
      'Calendario veterinario + recordatorios',
      'Historial clínico por perro',
      'Contratos digitales con firma electrónica',
      'Galería ampliada (50 fotos por perro)',
      'Importador IA de pedigrees (URL + PDF)',
      'Estadísticas básicas del perfil público',
      'Soporte por email',
    ],
  },
  {
    id: 'kennel_pro',
    name: 'Kennel Pro',
    price: '49€',
    period: '/mes · Founder',
    description: 'Para criaderos con volumen alto que quieren escalar al máximo. Disponible próximamente.',
    cta: 'Próximamente',
    founderBadge: true,
    comingSoon: true,
    features: [
      'Todo lo de Kennel',
      'Web pública con builder visual',
      'Dominio personalizado (tucriadero.com)',
      'Emailbot que responde a leads 24/7',
      'Newsletter a tu lista de espera',
      'Pagos online con tarjeta (Stripe)',
      'Estadísticas avanzadas',
      'Galería ilimitada',
      'Soporte prioritario (<24h)',
      'API básica para integraciones',
    ],
  },
]

const ownerFeatures = [
  'Ficha completa de cada perro (foto, microchip, color, medidas)',
  'Genealogía completa y verificable',
  'Papeles digitalizados (cartilla, contrato, pedigree)',
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
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12 sm:py-16 lg:py-24">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-4">
            <Sparkles className="w-3 h-3" />
            Precios
          </div>
          <h1 className="font-bold text-ink mb-4 tracking-tight" style={{ fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.1 }}>
            Gratis para empezar. Siempre.
          </h1>
          <p className="text-base sm:text-lg text-body max-w-2xl mx-auto">
            Free es gratis para siempre — para propietarios y criadores que empiezan.
            Cuando vendes en serio, el plan Kennel te quita 10 horas a la semana.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-10 sm:mb-12">
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

        {tab === 'breeder' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {breederTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-2xl border p-5 sm:p-6 lg:p-8 flex flex-col ${
                    tier.highlight
                      ? 'border-ink bg-canvas shadow-[0_8px_24px_rgba(0,0,0,0.06)] lg:-translate-y-1'
                      : 'border-hairline bg-canvas'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {tier.highlight && (
                      <span className="inline-flex items-center rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-on-primary">
                        Recomendado
                      </span>
                    )}
                    {tier.founderBadge && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]">
                        <Crown className="w-2.5 h-2.5" />
                        Founder
                      </span>
                    )}
                    {tier.comingSoon && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-ink mb-1">{tier.name}</h2>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl sm:text-4xl font-bold text-ink">{tier.price}</span>
                  </div>
                  <p className="text-xs text-muted mb-4">{tier.period}</p>
                  <p className="text-sm text-body mb-5 leading-relaxed">{tier.description}</p>

                  <ul className="space-y-2 mb-7 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-body">
                        <Check className="w-3.5 h-3.5 mt-0.5 text-ink flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.comingSoon ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-hairline bg-surface-soft px-5 py-3 text-sm font-bold text-muted"
                    >
                      Próximamente
                    </button>
                  ) : tier.ctaHref ? (
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
                      plan={tier.id === 'kennel_pro' ? 'premium' : 'pro'}
                      label={tier.cta}
                      isLoggedIn={isLoggedIn}
                      className={
                        tier.highlight
                          ? 'inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition'
                          : 'inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-hairline bg-canvas text-ink px-5 py-3 text-sm font-bold hover:border-ink/40 disabled:opacity-50 transition'
                      }
                    />
                  )}
                  {tier.id !== 'free' && (
                    <p className="mt-2 text-[11px] text-muted text-center">
                      {tier.comingSoon
                        ? 'Te avisaremos en cuanto esté disponible.'
                        : isLoggedIn
                          ? '15 días gratis · Tarjeta requerida · Cancela cuando quieras'
                          : `Crea tu cuenta y prueba ${tier.name} 15 días gratis`}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Founder pitch */}
            <div className="mt-10 max-w-3xl mx-auto rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-1">Pricing Founder (lanzamiento)</p>
                  <p className="text-[13px] text-amber-900/80 leading-relaxed">
                    Los primeros 50 criaderos que se suscriban a <strong>Kennel Pro</strong> mantendrán
                    el precio de <strong>49€/mes para siempre</strong>, aunque suba después a 79€.
                    Algunas features (web builder, emailbot, newsletter, pagos online) se irán activando
                    en las próximas semanas — los Founder tienen acceso anticipado.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA secundario para compradores */}
            <div className="mt-12 max-w-2xl mx-auto rounded-2xl border border-hairline bg-canvas p-5 sm:p-6 text-center">
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
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border-2 border-ink bg-canvas p-6 sm:p-8 lg:p-10 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-[#FE6620]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FE6620]">
                  Gratis para siempre
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-2">Owner</h2>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl sm:text-5xl font-bold text-ink">0€</span>
                <span className="text-sm text-muted">/mes</span>
              </div>
              <p className="text-sm text-body mb-6 sm:mb-8 leading-relaxed">
                Todo lo que necesita un propietario para documentar a su perro. Sin tarjeta,
                sin trials, sin upsells. La plataforma se sostiene con los criadores que pagan
                — tú nunca.
              </p>

              <ul className="space-y-3 mb-7">
                {ownerFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14.5px] text-body">
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

        <p className="text-center mt-10 sm:mt-12 text-sm">
          <Link href="/" className="text-muted hover:text-ink underline">
            Volver a Genealogic
          </Link>
        </p>
      </div>
    </main>
  )
}
