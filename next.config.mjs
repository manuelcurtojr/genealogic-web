import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // /propietarios se fusionó en la home (la home YA es la landing del
      // propietario). Redirect permanente para no perder enlaces/SEO.
      { source: '/propietarios', destination: '/', permanent: true },
    ]
  },
  images: {
    // Whitelist of allowed image hosts. Vercel's Image Optimization
    // will fetch, resize and convert to WebP/AVIF for the requested viewport.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'presadb.com' },
      { protocol: 'https', hostname: 's3.presadb.com' },
      { protocol: 'https', hostname: 'app.genealogic.io' },
      { protocol: 'https', hostname: 'www.genealogic.io' },
      { protocol: 'https', hostname: 'genealogic.io' },
    ],
    // Pre-defined sizes used by <Image>. Match common card/thumb sizes
    // to avoid Vercel generating extra variants.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [40, 64, 88, 128, 256, 384, 512, 768, 1024],
    // Cache optimized images for 7 days on the CDN.
    minimumCacheTTL: 60 * 60 * 24 * 7,
    // Prefer modern formats; Vercel auto-negotiates per Accept header.
    formats: ['image/avif', 'image/webp'],
  },
}

// Sentry wraps el config. Sin DSN configurado el plugin queda inerte
// (cero overhead). Cuando se añade SENTRY_DSN como env var en Vercel
// el plugin sube source maps y captura errores automáticamente.
const sentryWebpackPluginOptions = {
  silent: true,
  // org/project se leen de env vars SENTRY_ORG y SENTRY_PROJECT cuando
  // se quiera subir source maps al deploy. Sin ellas, los uploads se
  // saltan pero el SDK runtime sigue funcionando.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Subir source maps solo en deploys con SENTRY_AUTH_TOKEN configurado.
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
}

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions)
