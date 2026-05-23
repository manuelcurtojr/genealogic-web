import type { ComponentType } from 'react'

export type BlogCategory =
  | 'Genética'
  | 'Salud'
  | 'Plataforma'
  | 'Legal'
  | 'Para compradores'
  | 'Para criadores'

export type BlogPostMeta = {
  slug: string
  title: string
  excerpt: string
  date: string // ISO yyyy-mm-dd
  category: BlogCategory
  heroImage: string
  heroAlt: string
  readMinutes: number
  author: { name: string; role: string }
}

export type BlogPost = {
  meta: BlogPostMeta
  Content: ComponentType
}

// Importación estática — Next.js bundlea cada post en el chunk de la página.
import * as p01 from './posts/leer-un-pedigree'
import * as p02 from './posts/coeficiente-consanguinidad-coi'
import * as p03 from './posts/5-errores-arruinan-camada'
import * as p04 from './posts/afijo-criadero-kennel-espana'
import * as p05 from './posts/web-criadero-en-una-tarde'
import * as p06 from './posts/emailbot-criadero'
import * as p07 from './posts/excel-a-kanban-reservas'
import * as p08 from './posts/calendario-pruebas-salud-hd-dcm'
import * as p09 from './posts/importar-pedigree-ia-12-segundos'
import * as p10 from './posts/como-elegir-cachorro-7-preguntas'

const posts: BlogPost[] = [
  { meta: p01.metadata, Content: p01.default },
  { meta: p02.metadata, Content: p02.default },
  { meta: p03.metadata, Content: p03.default },
  { meta: p04.metadata, Content: p04.default },
  { meta: p05.metadata, Content: p05.default },
  { meta: p06.metadata, Content: p06.default },
  { meta: p07.metadata, Content: p07.default },
  { meta: p08.metadata, Content: p08.default },
  { meta: p09.metadata, Content: p09.default },
  { meta: p10.metadata, Content: p10.default },
]

// Ordenado descendente por fecha (más reciente primero)
export const allPosts: BlogPost[] = [...posts].sort(
  (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime(),
)

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find(p => p.meta.slug === slug)
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(slug)
  if (!current) return allPosts.slice(0, limit)
  // Prioriza misma categoría
  const sameCategory = allPosts.filter(
    p => p.meta.slug !== slug && p.meta.category === current.meta.category,
  )
  const rest = allPosts.filter(
    p => p.meta.slug !== slug && p.meta.category !== current.meta.category,
  )
  return [...sameCategory, ...rest].slice(0, limit)
}
