import Link from 'next/link'
import { getMyKennel } from '@/lib/kennel-site'
import { THEMES, getTheme } from '@/lib/kennel/themes'
import { GeneralThemeEditor } from '@/components/admin/web/general-theme-editor'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'General · Web pública · Genealogic Pro' }

export default async function WebGeneralPage() {
  const kennel = await getMyKennel()
  const activeTheme = getTheme(kennel.theme_id)
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Web pública</p>
      <div className="mt-2 flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-4xl font-bold tracking-tight text-ink">General</h1>
        <nav className="flex items-center gap-1 rounded-lg border border-hairline p-1 text-xs">
          <Link href="/web" className="rounded-md px-3 py-1.5 font-medium text-body hover:bg-surface-soft hover:text-ink">
            Páginas
          </Link>
          <Link href="/web/general" className="rounded-md bg-ink text-on-primary px-3 py-1.5 font-semibold">
            General
          </Link>
        </nav>
      </div>
      <p className="mt-2 text-body max-w-2xl">
        Elige el tema visual de tu web custom y ajusta los colores principales si quieres
        personalizarlo aún más. Los cambios se ven en tiempo real en la preview.
      </p>

      <GeneralThemeEditor
        themes={THEMES}
        currentThemeId={activeTheme.id}
        currentOverrides={kennel.theme_overrides ?? null}
        kennelSlug={kennel.slug}
      />
    </div>
  )
}
