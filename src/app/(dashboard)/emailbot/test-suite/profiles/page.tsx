/**
 * Gestión de perfiles del test suite (lectura por ahora).
 *
 * Lista los perfiles agrupados por categoría con su persona, objetivo,
 * opening_message y outcome esperado. Si no hay, ofrece sembrar los 16
 * default (mismo botón que en la página principal).
 *
 * Edit/create de perfiles custom queda para sesión futura — por ahora los
 * 16 default cubren bien la matriz de casos.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EmailbotSubnav from '@/components/emailbot/emailbot-subnav'
import TestSuiteSeedButton from '@/components/emailbot/test-suite-seed-button'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Perfiles · Test Suite · Genealogic Pro' }

type Profile = {
  id: string
  name: string
  persona_description: string
  goal: string
  opening_message: string
  expected_outcome: string
  category: string | null
  is_active: boolean
}

const CATEGORY_LABEL: Record<string, string> = {
  happy_path: 'Compra esperada (happy path)',
  objection:  'Objeciones / dudas',
  edge_case:  'Casos límite',
  security:   'Seguridad / fraude',
}

const OUTCOME_LABEL: Record<string, string> = {
  deposit_link_sent: 'Cierre con seña',
  escalated:         'Escala a humano',
  waitlist_added:    'Lista de espera',
  no_purchase:       'Sin compra',
  blocked:           'Bloqueado',
}

export default async function ProfilesPage() {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels').select('id, name').eq('owner_id', user.id).maybeSingle()
  if (!kennel) {
    return (
      <div className="space-y-5">
        <EmailbotSubnav />
        <p className="text-body">{t('Necesitas un criadero registrado.')}</p>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: rows } = await admin
    .from('emailbot_test_profiles')
    .select('id, name, persona_description, goal, opening_message, expected_outcome, category, is_active')
    .eq('kennel_id', kennel.id)
    .order('category').order('name')

  const profiles = (rows as Profile[] | null) ?? []
  const byCategory = profiles.reduce<Record<string, Profile[]>>((acc, p) => {
    const k = p.category ?? 'otros'
    ;(acc[k] ??= []).push(p)
    return acc
  }, {})

  return (
    <div className="space-y-5 max-w-4xl">
      <EmailbotSubnav />

      <div className="mt-4">
        <Link
          href="/emailbot/test-suite"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('Volver al test suite')}
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Test Suite · {t('Perfiles')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink tracking-tight">
          {profiles.length} {t('perfiles ficticios')}
        </h1>
        <p className="mt-2 text-body max-w-2xl">
          {t('Cada perfil define una persona + objetivo + mensaje inicial + outcome esperado. El runner ejecuta una conversación por perfil activo cuando lanzas un test.')}
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-hairline bg-canvas p-10 text-center">
          <p className="text-base font-bold text-ink mb-2">{t('Sin perfiles todavía')}</p>
          <p className="text-sm text-muted max-w-md mx-auto mb-4">
            {t('Te sembramos 16 perfiles default (6 happy path, 4 con objeción, 4 casos límite, 2 de seguridad). Cubren la mayoría de los casos reales.')}
          </p>
          <TestSuiteSeedButton kennelId={kennel.id} />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, list]) => (
            <section key={cat}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink mb-2">
                {CATEGORY_LABEL[cat] ? t(CATEGORY_LABEL[cat]) : cat} · {list.length}
              </h2>
              <div className="space-y-2">
                {list.map((p) => (
                  <article
                    key={p.id}
                    className="rounded-xl border border-hairline bg-canvas p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-bold text-ink">{p.name}</p>
                      <span className="inline-flex items-center rounded-full bg-surface-card border border-hairline px-2.5 py-0.5 text-[11px] font-semibold text-body whitespace-nowrap">
                        {OUTCOME_LABEL[p.expected_outcome] ? t(OUTCOME_LABEL[p.expected_outcome]) : p.expected_outcome}
                      </span>
                    </div>
                    <p className="text-[13px] text-body mb-1.5">
                      <strong className="text-muted uppercase tracking-wider text-[10px]">{t('Persona ·')}</strong>{' '}
                      {p.persona_description}
                    </p>
                    <p className="text-[13px] text-body mb-1.5">
                      <strong className="text-muted uppercase tracking-wider text-[10px]">{t('Objetivo ·')}</strong>{' '}
                      {p.goal}
                    </p>
                    <p className="mt-2 rounded-lg bg-blue-50/40 border border-blue-100 p-2.5 text-[13px] italic text-ink">
                      «{p.opening_message}»
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
