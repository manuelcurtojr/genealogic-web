/**
 * Página pública (sin auth) para darse de baja del newsletter.
 * URL: /newsletter/unsubscribe?token=XXX&campaign=YYY
 *
 * Ejecuta el unsubscribe inmediatamente al cargar (token GET) y muestra
 * confirmación al usuario. Si el token es inválido, mensaje claro.
 */
import { unsubscribeByToken } from '@/lib/newsletter/send'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const metadata = { title: 'Darse de baja — Genealogic' }

export default async function UnsubscribePage({
  searchParams,
}: { searchParams: Promise<{ token?: string; campaign?: string }> }) {
  const sp = await searchParams
  const token = sp.token?.trim()
  const t = getTranslator(await getLocale())

  if (!token) {
    return (
      <PageShell>
        <h1 className="text-2xl font-bold text-ink mb-2">{t('Enlace incompleto')}</h1>
        <p className="text-body">
          {t('El enlace de baja debe incluir un token válido. Comprueba que copiaste la URL completa desde el email.')}
        </p>
      </PageShell>
    )
  }

  const res = await unsubscribeByToken({ token, campaignId: sp.campaign ?? null })

  if ('error' in res) {
    return (
      <PageShell>
        <h1 className="text-2xl font-bold text-ink mb-2">{t('No se pudo procesar')}</h1>
        <p className="text-body">{res.error}</p>
        <p className="text-sm text-muted mt-4">
          {t('Si el problema persiste, escríbenos a')}{' '}
          <a href="mailto:hola@genealogic.io" className="underline text-ink">
            hola@genealogic.io
          </a>
          .
        </p>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50">
        <svg className="w-6 h-6 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-ink mb-2">{t('Te has dado de baja')}</h1>
      <p className="text-body">
        <strong>{res.email}</strong> {t('ya no recibirá emails del newsletter de')}
        <strong> {res.kennelName}</strong>.
      </p>
      <p className="text-sm text-muted mt-4">
        {t('Si fue por error o quieres volver a suscribirte, escríbenos a')}{' '}
        <a href="mailto:hola@genealogic.io" className="underline text-ink">
          hola@genealogic.io
        </a>{' '}
        {t('o vuelve a registrarte en la web del criadero.')}
      </p>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="rounded-2xl border border-hairline bg-canvas p-8 text-center">
          {children}
        </div>
        <p className="mt-6 text-center text-[11px] text-muted">
          Genealogic · genealogic.io
        </p>
      </div>
    </main>
  )
}
