'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getPlanLimits, roleAtLeast } from '@/lib/permissions'
import UpgradeBanner from './upgrade-banner'

interface UpgradePromptsProps {
  userRole: string
}

export default function UpgradePrompts({ userRole }: UpgradePromptsProps) {
  const pathname = usePathname()
  const [dogCount, setDogCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { count } = await supabase.from('dogs').select('id', { count: 'exact', head: true }).eq('owner_id', user.id)
      setDogCount(count || 0)
      setLoaded(true)
    })
  }, [])

  if (!loaded) return null

  const limits = getPlanLimits(userRole)

  // Don't show banners for pro/admin
  if (roleAtLeast(userRole, 'pro')) return null

  // --- Contextual banners based on current page ---

  // Dogs page: near dog limit
  if (pathname === '/dogs' || pathname.startsWith('/dogs')) {
    if (limits.maxDogs && dogCount >= limits.maxDogs - 1 && dogCount > 0) {
      return (
        <UpgradeBanner
          message={dogCount >= limits.maxDogs
            ? `Has alcanzado el límite de ${limits.maxDogs} perros. Mejora tu plan para añadir más.`
            : `Te queda ${limits.maxDogs - dogCount} perro para tu límite. Mejora tu plan para tener hasta ${userRole === 'free' ? '25' : 'ilimitados'}.`
          }
          plan={userRole === 'free' ? 'amateur' : 'pro'}
          variant={dogCount >= limits.maxDogs ? 'urgent' : 'highlight'}
          dismissKey="dogs-limit"
          className="mb-4"
        />
      )
    }
  }

  // Dashboard: general upgrade for free users
  if (pathname === '/dashboard' && userRole === 'free') {
    return (
      <UpgradeBanner
        message="Mejora a Amateur para crear tu criadero, gestionar camadas y recibir solicitudes de clientes."
        plan="amateur"
        variant="subtle"
        dismissKey="dash-upgrade"
        className="mb-4"
      />
    )
  }

  // Search/kennels: show CRM upsell for amateur
  if ((pathname === '/search' || pathname.startsWith('/kennels')) && userRole === 'amateur') {
    return (
      <UpgradeBanner
        message="Con el plan Profesional tendrás CRM completo para gestionar tus clientes con pipelines y automatizaciones."
        plan="pro"
        variant="subtle"
        dismissKey="search-pro"
        className="mb-4"
      />
    )
  }

  // Litters page: upsell for free
  if (pathname === '/litters' && userRole === 'free') {
    return (
      <UpgradeBanner
        message="Las camadas son para criadores. Mejora a Amateur para registrar hasta 3 camadas activas."
        plan="amateur"
        variant="highlight"
        dismissKey="litters-upgrade"
        className="mb-4"
      />
    )
  }

  // Analytics: upsell advanced
  if (pathname === '/analytics' && userRole === 'amateur') {
    return (
      <UpgradeBanner
        message="Mejora a Profesional para acceder a analíticas avanzadas: funnels de conversión, tendencias y más."
        plan="pro"
        variant="subtle"
        dismissKey="analytics-pro"
        className="mb-4"
      />
    )
  }

  // CRM inbox: upsell to full CRM
  if (pathname === '/crm/inbox' && userRole === 'amateur') {
    return (
      <UpgradeBanner
        message="¿Necesitas gestionar tus clientes con pipelines? Mejora a Profesional para tener el CRM completo."
        plan="pro"
        variant="subtle"
        dismissKey="inbox-pro"
        className="mb-4"
      />
    )
  }

  return null
}
