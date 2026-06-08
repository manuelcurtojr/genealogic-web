/**
 * /sitemap.xml — sitemap-index XML que lista los shards generados por
 * generateSitemaps() en `app/sitemap.ts`.
 *
 * Sin esto, Google Search Console y otros crawlers reciben 404 cuando
 * solicitan /sitemap.xml. Los shards individuales sí responden:
 *   /sitemap/0.xml, /sitemap/1.xml, … /sitemap/N.xml
 *
 * Aquí calculamos cuántos shards hay (mismo cálculo que en sitemap.ts)
 * y devolvemos el index XML estándar.
 */
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const SHARD_SIZE = 40000
const MAX_SHARDS = 10
const BASE = 'https://www.genealogic.io'

export async function GET() {
  let dogShards = 1
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      )
      const { count } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .not('slug', 'is', null)
      const total = count ?? 0
      dogShards = Math.min(MAX_SHARDS, Math.max(1, Math.ceil(total / SHARD_SIZE)))
    } catch {
      dogShards = 1
    }
  }

  const now = new Date().toISOString()
  const sitemaps = Array.from({ length: dogShards }, (_, i) => i)
    .map(
      (i) => `  <sitemap>
    <loc>${BASE}/sitemap/${i}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>
`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
