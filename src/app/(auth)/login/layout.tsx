import type { Metadata } from 'next'

/**
 * Layout server-side para /login.
 *
 * El page.tsx es 'use client' (form interactivo) y no puede exportar
 * metadata. Lo metemos aquí.
 *
 * Canonical fija → https://www.genealogic.io/login para deduplicar las
 * miles de variantes con query strings que generan los enlaces
 * "Reclamar perro" (/login?redirect=...). Google estaba viendo cada
 * variante como URL distinta y reportaba 1.640 duplicadas sin canónica
 * en Search Console. Con canonical único, todas colapsan a /login.
 *
 * robots.ts también añade /login al Disallow (refuerzo). El canonical
 * sigue siendo necesario porque algunos crawlers ignoran Disallow.
 */
export const metadata: Metadata = {
  title: 'Iniciar sesión · Genealogic',
  description: 'Accede a tu cuenta de Genealogic.',
  alternates: { canonical: 'https://www.genealogic.io/login' },
  robots: { index: false, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
