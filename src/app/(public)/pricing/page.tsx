/**
 * /pricing — 4 planes (Owner / Kennel Free / Kennel Pro / Kennel Enterprise).
 *
 * Vistas:
 *   · Simple (default) — 4 cards con highlights, "en cristiano"
 *   · Avanzada — tabla completa con todas las features × planes
 *
 * El toggle vive en query string (?view=simple|avanzada) para permitir
 * deep-linking. Los planes y reglas detalladas están en el cliente,
 * sincronizado con memory/genealogic_pricing_model.md.
 */
import { createClient } from '@/lib/supabase/server'
import PricingClient from '@/components/marketing/pricing-client'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { isIosUserAgent } from '@/lib/platform'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Precios',
  description:
    'Owner (3 perros, gratis) y Kennel Free (5 perros, gratis) para siempre. Kennel Pro (49€/mes, perros ilimitados) y Kennel Enterprise (149€/mes, web del criadero) con 14 días de prueba sin tarjeta.',
  alternates: { canonical: 'https://genealogic.io/pricing' },
}

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  // Defensa en profundidad: si la sesión es iOS (App Store 3.1.1) no se debe
  // ver pricing dentro de la app. El middleware ya redirige antes, esto cubre
  // cualquier bypass (cache, race, llamada server-side directa).
  const h = await headers()
  if (isIosUserAgent(h.get('user-agent'))) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <PricingClient isLoggedIn={!!user} />
}
