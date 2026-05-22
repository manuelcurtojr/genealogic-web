import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DEFAULT_NAV_LABELS, PAGE_SLUGS, pageHref } from '@/lib/kennel/pages'
import PageSectionsEditor from '@/components/web/sections-editor'

export const dynamic = 'force-dynamic'

export default async function EditPagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!PAGE_SLUGS.includes(slug as any)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennelArr } = await supabase
    .from('kennels').select('id, name, slug, custom_domain').eq('owner_id', user.id).limit(1)
  const kennel = kennelArr?.[0]
  if (!kennel) redirect('/web')

  const admin = createKennelAdminClient()
  const { data: page } = await admin
    .from('kennel_pages')
    .select('slug, enabled, nav_label, nav_order, sections, draft_sections, meta_title, meta_description')
    .eq('kennel_id', kennel.id)
    .eq('slug', slug)
    .maybeSingle()
  if (!page) notFound()

  const label = page.nav_label || DEFAULT_NAV_LABELS[page.slug] || page.slug
  const previewUrl = (kennel as any).custom_domain
    ? `https://${(kennel as any).custom_domain}${pageHref(kennel.slug, page.slug).replace(`/c/${kennel.slug}`, '')}`
    : `${pageHref(kennel.slug, page.slug)}`

  return (
    <div>
      <div className="mb-6">
        <Link href="/web" className="text-xs font-medium text-muted hover:text-ink inline-flex items-center gap-1 transition">
          <ArrowLeft className="w-3 h-3" /> Web pública
        </Link>
        <h1 className="text-2xl font-bold text-ink tracking-tight mt-2">{label}</h1>
        <p className="text-sm text-muted mt-0.5">
          Edita las secciones de esta página. Guarda en borrador y publica cuando esté listo.
        </p>
      </div>

      <PageSectionsEditor
        kennelId={kennel.id}
        kennelSlug={kennel.slug}
        slug={page.slug}
        initialSections={Array.isArray(page.sections) ? page.sections : []}
        initialDraft={Array.isArray(page.draft_sections) ? page.draft_sections : null}
        initialEnabled={!!page.enabled}
        initialNavLabel={page.nav_label}
        initialMetaTitle={page.meta_title}
        initialMetaDescription={page.meta_description}
        previewUrl={previewUrl}
      />
    </div>
  )
}
