/**
 * /mis-solicitudes — lista de las solicitudes del user.
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/admin-requests/types'
import { Inbox, ArrowRight, Plus, MessageSquare } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

export default async function MisSolicitudesPage() {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/mis-solicitudes')

  const { data: requests } = await supabase
    .from('admin_requests')
    .select(`
      id, type, status, subject, created_at, updated_at,
      target_dog:dogs!admin_requests_target_dog_id_fkey(name, slug),
      target_kennel:kennels!admin_requests_target_kennel_id_fkey(name, slug)
    `)
    .eq('requester_user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    // Dentro del grupo (dashboard) → ya hay sidebar + header. Sin "volver".
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <Inbox className="w-6 h-6 text-ink" />
          <div>
            <h1 className="text-2xl font-bold text-ink">{t('Mis solicitudes')}</h1>
            <p className="text-sm text-muted">{t('Soporte y reclamaciones que has enviado.')}</p>
          </div>
        </div>
        <Link
          href="/soporte"
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-4 py-2 text-sm font-bold hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> {t('Abrir nueva')}
        </Link>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft py-12 text-center">
          <MessageSquare className="mx-auto w-10 h-10 text-muted" />
          <p className="mt-3 text-sm text-body">{t('No tienes solicitudes aún.')}</p>
          <Link href="/soporte" className="mt-3 inline-block text-sm font-semibold text-ink hover:opacity-80">
            {t('Escribir a soporte')} →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const target = (r as any).target_dog || (r as any).target_kennel
            return (
              <li key={r.id}>
                <Link
                  href={`/mis-solicitudes/${r.id}`}
                  className="block px-4 py-3.5 rounded-xl border border-hairline bg-canvas hover:bg-surface-soft transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted">
                          {TYPE_LABELS[r.type as keyof typeof TYPE_LABELS]}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${STATUS_COLORS[r.status as keyof typeof STATUS_COLORS]}`}>
                          {STATUS_LABELS[r.status as keyof typeof STATUS_LABELS]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-ink truncate">{r.subject}</p>
                      {target && (
                        <p className="text-[11px] text-muted mt-0.5">→ {target.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted flex-shrink-0">
                      <span>{new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
