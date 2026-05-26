/**
 * /pricing — precios con toggle Criador / Propietario.
 *
 * Propietario: gratis para siempre (sin tiers).
 * Criador: 3 tiers (Free, Kennel 29€, Kennel Pro 49€ Founder · Próximamente).
 *
 * El toggle vive en query string (?for=breeder|owner) para permitir
 * deep-linking desde landing y ads.
 *
 * Detecta si el visitante está logueado para que el CTA "Probar 15 días gratis"
 * vaya directo a Stripe Checkout en vez de pedir registro primero.
 */
import { createClient } from '@/lib/supabase/server'
import PricingClient from '@/components/marketing/pricing-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Precios — Genealogic',
  description:
    'Gratis para propietarios. Para criadores: Free (10 perros), Kennel (29€/mes con 15 días de prueba gratis) y Kennel Pro (próximamente).',
  alternates: { canonical: 'https://genealogic.io/pricing' },
}

export const dynamic = 'force-dynamic'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>
}) {
  const sp = await searchParams
  const initialTab: 'breeder' | 'owner' = sp.for === 'owner' ? 'owner' : 'breeder'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <PricingClient initialTab={initialTab} isLoggedIn={!!user} />
}
