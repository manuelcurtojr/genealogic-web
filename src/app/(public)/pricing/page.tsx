/**
 * /pricing — precios con toggle Criador / Propietario.
 *
 * Propietario: gratis para siempre (sin tiers).
 * Criador: 3 tiers (Free, Pro, Premium).
 *
 * El toggle vive en query string (?for=breeder|owner) para permitir
 * deep-linking desde landing y ads.
 *
 * Detecta si el visitante está logueado para que el CTA "Empezar Pro"
 * vaya directo a Stripe Checkout en vez de pedir registro primero.
 */
import { createClient } from '@/lib/supabase/server'
import PricingClient from '@/components/marketing/pricing-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Precios — Genealogic',
  description:
    'Gratis para propietarios. Para criadores: free, pro y premium. Sin tarjeta para empezar.',
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
