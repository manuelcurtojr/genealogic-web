/**
 * /propietarios — landing dedicada al lado "propietario" de Genealogic.
 * Mensaje: tu perro tiene una ficha digital seria (genealogía, papeles,
 * vacunas, historial) gratis para siempre.
 */
import OwnersLanding from '@/components/marketing/owners-landing'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Para propietarios',
  description:
    'Registra a tu perro: genealogía, papeles, vacunas, historial vet. Gratis para siempre. Privado por defecto.',
  alternates: { canonical: 'https://genealogic.io/propietarios' },
  openGraph: {
    title: 'Genealogic para propietarios',
    description: 'La ficha digital de tu perro — genealogía, papeles, vacunas y galería en un solo sitio.',
    url: 'https://genealogic.io/propietarios',
    type: 'website',
    siteName: 'Genealogic',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Genealogic' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image'],
  },
}

export default function PropietariosPage() {
  return <OwnersLanding />
}
