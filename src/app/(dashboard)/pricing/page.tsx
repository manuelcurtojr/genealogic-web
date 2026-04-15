'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, X, Loader2, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PRICING, getRoleLabel } from '@/lib/permissions'
import ToggleSwitch from '@/components/ui/toggle'
import { isNativeApp } from '@/lib/is-native'

// Apple product IDs
const APPLE_PRODUCT_IDS: Record<string, { plan: string; period: string }> = {
  'com.genealogic.app.amateur.monthly': { plan: 'amateur', period: 'monthly' },
  'com.genealogic.app.amateur.yearly': { plan: 'amateur', period: 'yearly' },
  'com.genealogic.app.pro.monthly': { plan: 'pro', period: 'monthly' },
  'com.genealogic.app.pro.yearly': { plan: 'pro', period: 'yearly' },
}

interface AppleProduct {
  id: string
  displayName: string
  displayPrice: string
  price: string
}

const PLANS = [
  {
    id: 'free',
    name: 'Propietario',
    price: { monthly: 0, yearly: 0 },
    description: 'Para dueños de perros',
    features: [
      'Hasta 5 perros',
      'Pedigree completo e ilimitado',
      'Contribuciones ilimitadas',
      'Calendario y veterinario',
      'Buscador y favoritos',
      'Importador de pedigrees',
      'Genos IA (asistente)',
      'Notificaciones',
    ],
    notIncluded: ['Criadero', 'Camadas', 'CRM', 'Analíticas'],
    cta: 'Plan actual',
    highlighted: false,
  },
  {
    id: 'amateur',
    name: 'Amateur',
    price: { monthly: PRICING.amateur.monthly, yearly: Math.round(PRICING.amateur.yearly / 12 * 100) / 100 },
    yearlyTotal: PRICING.amateur.yearly,
    description: 'Para criadores con pocas camadas',
    features: [
      'Hasta 25 perros',
      'Hasta 3 camadas activas',
      'Perfil de criadero público',
      'Planificador de cruces',
      'Formulario de contacto',
      'Bandeja de solicitudes',
      'Palmarés y certificados',
      'Analíticas básicas',
      'Todo lo del plan gratuito',
    ],
    notIncluded: ['CRM completo', 'Analíticas avanzadas'],
    cta: 'Mejorar a Amateur',
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Profesional',
    price: { monthly: PRICING.pro.monthly, yearly: Math.round(PRICING.pro.yearly / 12 * 100) / 100 },
    yearlyTotal: PRICING.pro.yearly,
    description: 'Para criadores profesionales',
    features: [
      'Perros ilimitados',
      'Camadas ilimitadas',
      'CRM completo (Contactos + Negocios)',
      'Pipelines personalizados',
      'Lista de espera para camadas',
      'Analíticas avanzadas',
      'Formularios personalizados',
      'WhatsApp integrado',
      'Soporte prioritario',
      'Todo lo de Amateur',
    ],
    notIncluded: [],
    cta: 'Mejorar a Profesional',
    highlighted: false,
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  const [userRole, setUserRole] = useState('free')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [native, setNative] = useState(false)
  const [appleProducts, setAppleProducts] = useState<AppleProduct[]>([])
  const [appleLoading, setAppleLoading] = useState(false)
  const [storePlatform, setStorePlatform] = useState<string | null>(null)

  // Handle StoreKit events from native
  const handleStoreKitEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'productsLoaded':
        setAppleProducts(event.products || [])
        setAppleLoading(false)
        break
      case 'purchaseSuccess':
        // Reload user to reflect new role
        window.location.reload()
        break
      case 'purchaseError':
        alert(event.error || 'Error al procesar la compra')
        setLoading(null)
        break
      case 'purchaseCancelled':
        setLoading(null)
        break
      case 'purchasePending':
        alert('Tu compra está pendiente de aprobación.')
        setLoading(null)
        break
      case 'restoreComplete':
        if (event.productId) {
          window.location.reload()
        } else {
          alert('No se encontraron compras anteriores.')
        }
        setLoading(null)
        break
      case 'restoreError':
        alert(event.error || 'Error al restaurar compras')
        setLoading(null)
        break
    }
  }, [])

  useEffect(() => {
    const isNat = isNativeApp()
    setNative(isNat)

    // Register StoreKit event handler for native
    if (isNat) {
      ;(window as any).handleStoreKitEvent = handleStoreKitEvent
      // Request products from StoreKit
      setAppleLoading(true)
      ;(window as any).webkit?.messageHandlers?.storeKit?.postMessage({ action: 'loadProducts' })
    }

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (data?.role) setUserRole(data.role)
        // Check store platform
        const { data: sub } = await supabase.from('subscriptions').select('store_platform').eq('user_id', user.id).single()
        if (sub?.store_platform) setStorePlatform(sub.store_platform)
      }
    })

    return () => {
      if (isNat) delete (window as any).handleStoreKitEvent
    }
  }, [handleStoreKitEvent])

  // Get Apple price for a plan
  function getApplePrice(planId: string, period: string): string | null {
    const productId = Object.entries(APPLE_PRODUCT_IDS).find(
      ([, v]) => v.plan === planId && v.period === period
    )?.[0]
    if (!productId) return null
    const product = appleProducts.find(p => p.id === productId)
    return product?.displayPrice || null
  }

  function getAppleProductId(planId: string, period: string): string | null {
    return Object.entries(APPLE_PRODUCT_IDS).find(
      ([, v]) => v.plan === planId && v.period === period
    )?.[0] || null
  }

  // Native IAP purchase
  function handleNativePurchase(planId: string) {
    const period = annual ? 'yearly' : 'monthly'
    const productId = getAppleProductId(planId, period)
    if (!productId || !userId) return
    setLoading(planId)
    ;(window as any).webkit?.messageHandlers?.storeKit?.postMessage({
      action: 'purchase',
      productId,
      userId,
    })
  }

  // Native restore
  function handleRestore() {
    setLoading('restore')
    ;(window as any).webkit?.messageHandlers?.storeKit?.postMessage({ action: 'restore' })
  }

  // Stripe checkout
  async function handleUpgrade(plan: string) {
    if (plan === 'free' || plan === userRole) return
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, period: annual ? 'yearly' : 'monthly' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Error al procesar')
    } catch {
      alert('Error de conexión')
    }
    setLoading(null)
  }

  async function handleManageSubscription() {
    if (native && storePlatform === 'apple') {
      // Open iOS subscription management
      window.location.href = 'https://apps.apple.com/account/subscriptions'
      return
    }
    setLoading('manage')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Error')
    } catch {
      alert('Error de conexión')
    }
    setLoading(null)
  }

  const roleOrder = ['free', 'amateur', 'pro', 'admin']
  const userRoleIdx = roleOrder.indexOf(userRole)

  async function handleDiscountUpgrade(plan: string) {
    if (native) {
      handleNativePurchase(plan)
      return
    }
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, period: 'monthly', withDiscount: true }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Error al procesar')
    } catch { alert('Error de conexión') }
    setLoading(null)
  }

  return (
    <div>
      {/* First month discount banner — only web */}
      {!native && userRole === 'free' && !annual && (
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-gradient-to-r from-[#D74709]/20 to-purple-500/20 border border-[#D74709]/30 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="text-3xl">🎉</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">50% de descuento en tu primer mes</p>
              <p className="text-xs text-white/50">Amateur desde 3,99€ o Profesional desde 7,49€. Solo para nuevos suscriptores.</p>
            </div>
            <button onClick={() => handleDiscountUpgrade('amateur')} disabled={loading === 'amateur'}
              className="bg-[#D74709] hover:bg-[#c03d07] text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap">
              Empezar por 3,99€
            </button>
          </div>
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold mb-2">Planes y precios</h1>
        <p className="text-white/40 text-sm">Elige el plan que mejor se adapte a tus necesidades</p>
        {userRole === 'free' && (
          <p className="text-xs text-green-400 mt-1">
            {native ? 'Suscríbete directamente desde la app' : 'Prueba gratis 14 días — sin compromiso, cancela cuando quieras'}
          </p>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={`text-sm ${!annual ? 'text-white' : 'text-white/40'}`}>Mensual</span>
          <ToggleSwitch value={annual} onChange={setAnnual} />
          <span className={`text-sm ${annual ? 'text-white' : 'text-white/40'}`}>
            Anual <span className="text-green-400 text-xs font-semibold">Ahorra ~17%</span>
          </span>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const planIdx = roleOrder.indexOf(plan.id)
          const isCurrent = userRole === plan.id || (userRole === 'admin' && plan.id === 'pro')
          const isDowngrade = planIdx < userRoleIdx
          const isUpgrade = planIdx > userRoleIdx && !isCurrent

          // Get Apple price if native
          const appleMonthlyPrice = native ? getApplePrice(plan.id, 'monthly') : null
          const appleYearlyPrice = native ? getApplePrice(plan.id, 'yearly') : null

          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-5 flex flex-col ${
                plan.highlighted
                  ? 'bg-[#D74709]/10 border-2 border-[#D74709] relative'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D74709] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Popular
                </div>
              )}

              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="text-xs text-white/40 mt-1">{plan.description}</p>

              <div className="mt-4 mb-5">
                {plan.price.monthly === 0 ? (
                  <div className="text-3xl font-bold">Gratis</div>
                ) : native && (appleMonthlyPrice || appleYearlyPrice) ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {annual ? appleYearlyPrice : appleMonthlyPrice}
                      </span>
                      <span className="text-white/40 text-sm">/{annual ? 'año' : 'mes'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {annual ? plan.price.yearly : plan.price.monthly}€
                      </span>
                      <span className="text-white/40 text-sm">/mes</span>
                    </div>
                    {annual && (plan as any).yearlyTotal && (
                      <p className="text-xs text-white/30 mt-1">
                        {(plan as any).yearlyTotal}€ facturado anualmente
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* CTA Button */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-white/10 text-white/40 cursor-default"
                >
                  Plan actual
                </button>
              ) : isUpgrade ? (
                <button
                  onClick={() => native ? handleNativePurchase(plan.id) : handleUpgrade(plan.id)}
                  disabled={loading === plan.id || (native && appleLoading)}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                    plan.highlighted
                      ? 'bg-[#D74709] hover:bg-[#c03d07] text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  } disabled:opacity-50`}
                >
                  {loading === plan.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : plan.cta}
                </button>
              ) : isDowngrade && userRole !== 'admin' ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={loading === 'manage'}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-white/5 hover:bg-white/10 text-white/40 transition"
                >
                  Gestionar suscripción
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-white/10 text-white/40 cursor-default"
                >
                  {plan.cta}
                </button>
              )}

              {/* Features */}
              <div className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/60">{f}</span>
                  </div>
                ))}
                {plan.notIncluded.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <X className="w-4 h-4 text-white/15 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/25">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Manage subscription / Restore purchases */}
      <div className="text-center mt-6 space-y-2">
        {userRole !== 'free' && userRole !== 'admin' && (
          <button
            onClick={handleManageSubscription}
            className="text-sm text-white/40 hover:text-white transition underline"
          >
            Gestionar suscripción y facturación
          </button>
        )}
        {native && (
          <button
            onClick={handleRestore}
            disabled={loading === 'restore'}
            className="flex items-center justify-center gap-1.5 mx-auto text-sm text-white/30 hover:text-white/60 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {loading === 'restore' ? 'Restaurando...' : 'Restaurar compras'}
          </button>
        )}
      </div>
    </div>
  )
}
