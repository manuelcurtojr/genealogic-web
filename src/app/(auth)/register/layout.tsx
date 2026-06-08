import type { Metadata } from 'next'

/**
 * Layout server-side para /register.
 *
 * Mismo patrón que /login/layout.tsx: el page.tsx es 'use client' y no
 * puede exportar metadata. El registro acepta query params (intent,
 * plan, redirect, etc.) que Google podría ver como URLs distintas — el
 * canonical fija una sola variante crawleable.
 */
export const metadata: Metadata = {
  title: 'Crear cuenta · Genealogic',
  description: 'Regístrate gratis en Genealogic.',
  alternates: { canonical: 'https://www.genealogic.io/register' },
  robots: { index: false, follow: true },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
