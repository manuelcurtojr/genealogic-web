/**
 * /propietarios — landing dedicada al lado "propietario" de Genealogic.
 * Mensaje: tu perro tiene una ficha digital seria (pedigree, papeles,
 * vacunas, historial) gratis para siempre.
 */
import OwnersLanding from '@/components/marketing/owners-landing'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Para propietarios — Genealogic',
  description:
    'Registra a tu perro: pedigree, papeles, vacunas, historial vet. Gratis para siempre. Privado por defecto.',
  alternates: { canonical: 'https://genealogic.io/propietarios' },
  openGraph: {
    title: 'Genealogic para propietarios',
    description: 'La ficha digital de tu perro — pedigree, papeles, vacunas y galería en un solo sitio.',
    url: 'https://genealogic.io/propietarios',
    type: 'website',
    siteName: 'Genealogic',
  },
}

export default function PropietariosPage() {
  return <OwnersLanding />
}
