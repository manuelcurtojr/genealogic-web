import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buscar perros y criaderos',
  description: 'Busca perros por raza, nombre o criadero. Explora genealogías completas y encuentra criadores de confianza en Genealogic.',
  openGraph: {
    title: 'Buscar perros y criaderos — Genealogic',
    description: 'Busca perros por raza, nombre o criadero. Explora genealogías completas y encuentra criadores de confianza.',
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
