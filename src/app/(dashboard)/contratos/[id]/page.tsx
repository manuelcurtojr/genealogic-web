/**
 * /contratos/[id] — editor de una plantilla individual.
 *
 * Split view (desktop): textarea Markdown a la izquierda, preview HTML
 * renderizado a la derecha. Mobile: tabs.
 *
 * Server-side: carga la plantilla y verifica que el usuario es owner del
 * kennel propietario. Cliente: edita name + body_md y llama a
 * updateContractTemplate al guardar.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getContractTemplate } from '@/lib/contracts/templates-actions'
import TemplateEditor from '@/components/contracts/template-editor'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Editar plantilla · Genealogic' }

export default async function ContractTemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tpl = await getContractTemplate(id)
  if (!tpl) notFound()

  // Verifica ownership a nivel de aplicación (RLS también lo refuerza en DB).
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, owner_id, name')
    .eq('id', tpl.kennel_id)
    .single()
  if (!kennel || kennel.owner_id !== user.id) {
    redirect('/contratos')
  }

  const t = getTranslator(await getLocale())

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      {/* Breadcrumb / back */}
      <Link
        href="/contratos"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-ink transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t('Volver a plantillas')}
      </Link>

      <TemplateEditor
        templateId={tpl.id}
        initialName={tpl.name}
        initialBodyMd={tpl.body_md}
        isDefault={tpl.is_default}
        kennelName={kennel.name}
      />
    </div>
  )
}
