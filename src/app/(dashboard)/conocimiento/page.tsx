import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasEnterpriseFeatures } from '@/lib/permissions'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import KnowledgePageClient from '@/components/conocimiento/knowledge-page-client'
import EmailbotSubnav from '@/components/emailbot/emailbot-subnav'
import ComingSoon from '@/components/early-access/coming-soon'

export const metadata = { title: 'Biblioteca · Genealogic Pro' }

export default async function ConocimientoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = getTranslator(await getLocale())

  // La Biblioteca alimenta al Emailbot IA → feature de Kennel Enterprise.
  const { data: profile } = await supabase
    .from('profiles').select('plan').eq('id', user.id).maybeSingle()
  if (!hasEnterpriseFeatures(profile?.plan, user.id)) {
    return (
      <ComingSoon
        featureId="emailbot"
        description={t('La Biblioteca de conocimiento alimenta al Emailbot IA de tu criadero. Disponible en Kennel Enterprise.')}
        backHref="/dashboard"
        backLabel={t('← Volver al dashboard')}
      />
    )
  }

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id, name')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0]

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">{t('Biblioteca')}</h1>
        <p className="text-body">
          {t('Para usar la Biblioteca necesitas un criadero registrado. Crea tu kennel desde Mi Criadero.')}
        </p>
      </div>
    )
  }

  const { data: entries } = await supabase
    .from('knowledge_entries')
    .select('id, category, title, content, position, is_active, updated_at')
    .eq('kennel_id', kennel.id)
    .order('category')
    .order('position')

  return (
    <div className="space-y-5">
      <EmailbotSubnav />
      <KnowledgePageClient
        kennelId={kennel.id}
        kennelName={kennel.name}
        initialEntries={entries || []}
      />
    </div>
  )
}
