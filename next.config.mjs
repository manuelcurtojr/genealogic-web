/** @type {import('next').NextConfig} */
const nextConfig = {
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

export default nextConfig
