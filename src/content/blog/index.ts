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

// Posts de perros legendarios. Cada uno incluye contexto histórico + preview de
// genealogía con CTA a la ficha del perro en /dogs/[slug].
import * as p01 from './posts/old-hemp-border-collie-fundador'
import * as p02 from './posts/horand-von-grafrath-pastor-aleman'
import * as p03 from './posts/nous-fundador-golden-retriever'
import * as p04 from './posts/buccleuch-avon-fundador-labrador'
import * as p05 from './posts/barry-san-bernardo-rescatador'
import * as p06 from './posts/togo-husky-siberiano-serum-run'
import * as p07 from './posts/rin-tin-tin-pastor-aleman-hollywood'
import * as p08 from './posts/hachiko-akita-inu-perro-fiel'
import * as p09 from './posts/mick-the-miller-greyhound-leyenda'
import * as p10 from './posts/boatswain-terranova-lord-byron'
import * as p11 from './posts/master-mcgrath-greyhound-coursing'
import * as p12 from './posts/pal-von-glamis-lassie'
import * as p13 from './posts/muhlbauers-flocki-fundador-boxer'
import * as p14 from './posts/trump-pug-william-hogarth'
import * as p15 from './posts/warren-remedy-primer-best-in-show-westminster'

// Posts de gestión de criaderos (multi-raza)
import * as p16 from './posts/vender-cachorros-con-confianza'
import * as p17 from './posts/contrato-compraventa-cachorro'
import * as p18 from './posts/gestionar-reservas-camada'
import * as p19 from './posts/planificar-camada-consanguinidad-morfologia'
import * as p20 from './posts/genealogia-verificable-sube-precio'
import * as p21 from './posts/profesionalizar-criadero-2026'

// Serie del simulador de cruces
import * as p22 from './posts/simulador-de-cruces-genealogic'
import * as p23 from './posts/coi-consanguinidad-camada'
import * as p24 from './posts/prediccion-genetica-color-camada'

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
  { meta: p11.metadata, Content: p11.default },
  { meta: p12.metadata, Content: p12.default },
  { meta: p13.metadata, Content: p13.default },
  { meta: p14.metadata, Content: p14.default },
  { meta: p15.metadata, Content: p15.default },
  { meta: p16.metadata, Content: p16.default },
  { meta: p17.metadata, Content: p17.default },
  { meta: p18.metadata, Content: p18.default },
  { meta: p19.metadata, Content: p19.default },
  { meta: p20.metadata, Content: p20.default },
  { meta: p21.metadata, Content: p21.default },
  { meta: p22.metadata, Content: p22.default },
  { meta: p23.metadata, Content: p23.default },
  { meta: p24.metadata, Content: p24.default },
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
