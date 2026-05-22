import { notFound } from 'next/navigation'
import { getMyKennel } from '@/lib/kennel-site'
import { getPageDraft } from '@/lib/kennel/pages'
import { runWithKennel } from '@/lib/kennel-context'
import { renderSectionByType } from '@/components/site/sections/section-dispatch'
import { PreviewClickRelay } from './preview-relay'

export const dynamic = 'force-dynamic'

const VALID_SLUGS = new Set([
  'home', 'perros', 'razas', 'historia', 'servicios',
  'instalaciones', 'galeria', 'blog', 'contacto',
])

export default async function WebPreviewPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  if (!VALID_SLUGS.has(slug)) notFound()

  const sp = await searchParams
  const kennel = await getMyKennel()  // auth: only the kennel owner can preview
  const page = await getPageDraft(kennel.id, slug)
  if (!page) notFound()

  // Render dentro del scope ALS para que las sections async tengan kennel context.
  const rendered = await runWithKennel(kennel, async () => {
    const out: React.ReactNode[] = []
    for (const sec of page.sections) {
      out.push(await renderSectionByType(sec, { searchParams: sp, editMode: true }))
    }
    return out
  })

  return (
    <>
      <PreviewClickRelay />
      {rendered.map((node, i) => {
        const s = page.sections[i]
        return (
          <div
            key={s?.id ?? i}
            data-section-id={s?.id}
            data-section-type={s?.type}
          >
            {node}
          </div>
        )
      })}
    </>
  )
}
