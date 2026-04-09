import { createClient } from '@supabase/supabase-js'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const entries: MetadataRoute.Sitemap = [
    { url: 'https://genealogic.io', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: 'https://genealogic.io/search', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://genealogic.io/privacy', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: 'https://genealogic.io/terms', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: 'https://genealogic.io/legal', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Add all public dogs
  const { data: dogs } = await supabase
    .from('dogs')
    .select('slug, updated_at')
    .eq('is_public', true)
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(5000)

  for (const dog of (dogs || [])) {
    entries.push({
      url: `https://genealogic.io/dogs/${dog.slug}`,
      lastModified: new Date(dog.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  // Add all kennels with slugs
  const { data: kennels } = await supabase
    .from('kennels')
    .select('slug, updated_at')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1000)

  for (const kennel of (kennels || [])) {
    entries.push({
      url: `https://genealogic.io/kennels/${kennel.slug}`,
      lastModified: kennel.updated_at ? new Date(kennel.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  return entries
}
