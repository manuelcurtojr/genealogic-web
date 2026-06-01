import Link from 'next/link'
import { getMyKennel } from '@/lib/kennel-site'
import { THEMES, getTheme } from '@/lib/kennel/themes'
import { GeneralThemeEditor } from '@/components/admin/web/general-theme-editor'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'General · Web pública · Genealogic Pro' }

export default async function WebGeneralPage() {
  const t = getTranslator(await getLocale())
  const kennel = await getMyKennel()
  const activeTheme = getTheme(kennel.theme_id)
  // theme_id es undefined si la migración aún no se aplicó → mostramos aviso
  const migrationApplied = kennel.theme_id !== undefined
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t('Web pública')}</p>
      <div className="mt-2 flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-4xl font-bold tracking-tight text-ink">{t('General')}</h1>
        <nav className="flex items-center gap-1 rounded-lg border border-hairline p-1 text-xs">
          <Link href="/web" className="rounded-md px-3 py-1.5 font-medium text-body hover:bg-surface-soft hover:text-ink">
            {t('Páginas')}
          </Link>
          <Link href="/web/general" className="rounded-md bg-ink text-on-primary px-3 py-1.5 font-semibold">
            {t('General')}
          </Link>
        </nav>
      </div>
      <p className="mt-2 text-body max-w-2xl">
        {t('Elige el tema visual de tu web custom y ajusta los colores principales si quieres personalizarlo aún más. Los cambios se ven en tiempo real en la preview.')}
      </p>

      {!migrationApplied && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">⚠️ {t('Migración pendiente')}</p>
          <p>
            {t('El sistema de temas necesita ejecutar una migración en Supabase. Ve al')}{' '}
            <a href="https://supabase.com/dashboard/project/elhwppumacnyhovkapeb/sql/new" target="_blank" rel="noreferrer" className="underline font-medium">
              SQL Editor
            </a>{' '}
            {t('y ejecuta:')}
          </p>
          <pre className="mt-3 rounded-lg bg-amber-900/90 text-amber-50 p-3 text-[11px] overflow-x-auto font-mono">{`ALTER TABLE kennels
  ADD COLUMN IF NOT EXISTS theme_id text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS theme_overrides jsonb;
CREATE INDEX IF NOT EXISTS kennels_theme_id_idx ON kennels(theme_id);`}</pre>
          <p className="mt-2 text-xs">{t('Una vez ejecutado, refresca esta página y podrás guardar temas.')}</p>
        </div>
      )}

      <GeneralThemeEditor
        themes={THEMES}
        currentThemeId={activeTheme.id}
        currentOverrides={kennel.theme_overrides ?? null}
        kennelSlug={kennel.slug}
        disabled={!migrationApplied}
      />
    </div>
  )
}
