import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/dogs/', '/kennels/', '/search', '/privacy', '/terms', '/legal', '/cookies'],
        disallow: ['/admin/', '/dashboard/', '/settings', '/vet', '/notifications', '/api/', '/kennel/', '/litters/'],
      },
    ],
    sitemap: 'https://genealogic.io/sitemap.xml',
  }
}
