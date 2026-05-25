/**
 * /pricing — precios con toggle Criador / Propietario.
 *
 * Propietario: gratis para siempre (sin tiers).
 * Criador: 3 tiers (Free, Pro, Premium).
 *
 * El toggle vive en query string (?for=breeder|owner) para permitir
 * deep-linking desde landing y ads.
 */
import PricingClient from '@/components/marketing/pricing-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Precios — Genealogic',
  description:
    'Gratis para propietarios. Para criadores: free, pro y premium. Sin tarjeta para empezar.',
  alternates: { canonical: 'https://genealogic.io/pricing' },
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>
}) {
  const sp = await searchParams
  const initialTab: 'breeder' | 'owner' = sp.for === 'owner' ? 'owner' : 'breeder'
  return <PricingClient initialTab={initialTab} />
}
