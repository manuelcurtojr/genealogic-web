import { MetadataRoute } from 'next'

/**
 * robots.txt
 *
 * Allow: páginas públicas crawleables (contenido SEO).
 * Disallow: áreas backend del criador y de cliente.
 *
 * `/litters/` (camadas públicas) sí se permite — antes estaba bloqueado
 * por confusión con `/kennel/litters` (backend); la ruta pública es
 * `/litters/[id]` y devuelve 404 si la camada no es is_public, así que
 * sólo se indexa lo que el criador marcó público.
 *
 * `/kennel/` (singular) sí bloqueado — es el dashboard del criador
 * (perfil del criadero del usuario logueado, no perfil público).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/dogs/', '/kennels/', '/litters/', '/razas', '/razas/', '/blog', '/blog/', '/search', '/privacy', '/terms', '/legal', '/cookies'],
        disallow: ['/admin/', '/dashboard/', '/settings', '/vet', '/notifications', '/api/', '/kennel/', '/login', '/registro'],
      },
    ],
    sitemap: 'https://www.genealogic.io/sitemap.xml',
  }
}
