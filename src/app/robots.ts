import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/dogs/', '/kennels/', '/search', '/privacy', '/terms', '/legal', '/cookies'],
        disallow: ['/admin/', '/dashboard/', '/settings', '/crm/', '/planner', '/calendar', '/vet', '/inbox', '/notifications', '/api/', '/kennel/', '/contributions', '/favorites', '/litters/'],
      },
    ],
    sitemap: 'https://genealogic.io/sitemap.xml',
  }
}
