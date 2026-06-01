/**
 * /soporte — form genérico para abrir un ticket de soporte humano.
 *
 * Usable por cualquier usuario logueado. Si llega no logueado, redirect a
 * /login con redirect=/soporte. El chatbot futuro también creará tickets
 * vía la misma server action con source='chatbot'.
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import SupportForm from '@/components/admin-requests/support-form'
import { MessageSquare } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Soporte',
  description:
    'Abre un ticket de soporte humano: dudas, problemas técnicos, sugerencias. Respondemos en menos de 24h en horario laboral.',
  alternates: { canonical: 'https://genealogic.io/soporte' },
  openGraph: {
    title: 'Soporte — Genealogic',
    description: 'Abre un ticket de soporte humano. Respondemos en menos de 24h.',
    url: 'https://genealogic.io/soporte',
    type: 'website',
    siteName: 'Genealogic',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Genealogic' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Soporte — Genealogic',
    description: 'Abre un ticket de soporte humano.',
    images: ['/opengraph-image'],
  },
}

export default async function SoportePage() {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/soporte')

  // Solicitudes recientes del user
  const { data: recent } = await supabase
    .from('admin_requests')
    .select('id, subject, status, type, created_at')
    .eq('requester_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    // Vive dentro del grupo (dashboard): el shell ya aporta sidebar +
    // header + padding. No hace falta wrapper min-h-screen ni link "volver".
    <div className="max-w-2xl mx-auto">
      <div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink mb-4">
            <MessageSquare className="w-7 h-7 text-on-primary" />
          </div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">{t('¿En qué te ayudamos?')}</h1>
          <p className="mt-2 text-sm text-body max-w-md mx-auto">
            {t('Escribe tu consulta y un humano del equipo te responderá lo antes posible. Solemos tardar menos de 24h en días laborables.')}
          </p>
        </div>

        <SupportForm />

        {recent && recent.length > 0 && (
          <div className="mt-10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
              {t('Tus últimas solicitudes')}
            </p>
            <ul className="space-y-1.5">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/mis-solicitudes/${r.id}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-surface-soft hover:bg-surface-card transition"
                  >
                    <span className="text-sm text-ink truncate">{r.subject}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted">
                      {r.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/mis-solicitudes"
              className="mt-3 inline-block text-xs font-semibold text-ink hover:opacity-80"
            >
              {t('Ver todas mis solicitudes')} →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
