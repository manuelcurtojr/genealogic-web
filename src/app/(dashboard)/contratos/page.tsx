/**
 * /contratos — listado de plantillas de contrato del criador.
 *
 * Pertenece a la sección Pipeline del sidebar (Pro + Kennel). Aquí el
 * criador ve todos sus modelos, marca uno como por defecto, crea nuevos
 * y edita los existentes.
 *
 * Estado vacío: si no tiene ninguna plantilla, ofrecemos un CTA para crear
 * la primera a partir del template hardcoded (CONTRACT_TEMPLATE_BREEDING).
 *
 * Crear / editar / borrar / set-default se hace vía server actions en
 * `lib/contracts/templates-actions.ts`. La invalidación de paths la
 * manejan las propias actions.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasProFeatures, normalizePlan, isEnterpriseUser } from '@/lib/permissions'
import { listContractTemplatesForUser, seedDefaultContractTemplates } from '@/lib/contracts/templates-actions'
import ContractTemplatesList from '@/components/contracts/templates-list'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Plantillas de contrato · Genealogic' }

export default async function ContratosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const t = getTranslator(await getLocale())

  // Gate REAL de plan (go-live 2026-07-11, decisión "Free austero"): los
  // contratos/CRM/leads son el gancho de Kennel Pro. Sin plan de pago → /pricing.
  {
    const { data: prof } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle()
    if (!isEnterpriseUser(user.id) && !hasProFeatures(normalizePlan(prof?.plan))) redirect('/pricing')
  }

  // Necesitamos el kennel del owner para el CTA "crear plantilla"
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!kennel) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
          {t('Plantillas de contrato')}
        </p>
        <h1 className="mt-1 text-[28px] sm:text-[34px] font-semibold tracking-[-0.03em] text-ink leading-tight">
          {t('Necesitas un criadero')}
        </h1>
        <p className="mt-3 text-[14.5px] text-body leading-snug max-w-prose">
          {t('Las plantillas de contrato son recursos del criadero. Crea tu kennel desde')} <a href="/kennel" className="text-ink underline">{t('Mi criadero')}</a> {t('y vuelve a esta sección.')}
        </p>
      </div>
    )
  }

  // Seed silencioso: si el criador no tiene NINGUNA plantilla, creamos
  // las 2 default (Contrato de reserva + Contrato de compraventa y entrega)
  // automáticamente al entrar por primera vez a /contratos. Si las borra
  // después, no se vuelven a crear — respetamos su decisión y le ofrecemos
  // un CTA en el empty state para restaurarlas si quiere.
  try {
    await seedDefaultContractTemplates(kennel.id)
  } catch (e) {
    // Si falla el seed (race, RLS, etc.) la página sigue funcionando — el
    // criador verá empty state y puede crear manualmente.
    console.error('[contratos] seed default templates failed', e)
  }

  const templates = await listContractTemplatesForUser()

  // Stats para el header
  const reservationDefault = templates.find((t) => t.default_for_kind === 'reservation')
  const deliveryDefault = templates.find((t) => t.default_for_kind === 'delivery')
  const totalCustom = templates.length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-7">
      {/* Hero header — más compacto y orientado a la acción */}
      <header className="rounded-2xl border border-hairline bg-gradient-to-br from-canvas via-canvas to-surface-soft/60 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 h-48 w-48 rounded-full bg-[#FE6620]/5 blur-3xl pointer-events-none" aria-hidden />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FE6620]">
            {t('Pipeline')} · {t('Contratos')}
          </p>
          <h1 className="mt-2 text-[30px] sm:text-[36px] font-bold tracking-[-0.035em] text-ink leading-[1.05]">
            {t('Plantillas de contrato')}
          </h1>
          <p className="mt-2.5 text-[14.5px] text-body leading-snug max-w-2xl">
            {t('Tus modelos reusables. Edítalos a tu gusto y se aplicarán automáticamente cuando crees contratos para tus reservas.')}
          </p>

          {/* Pills de estado de defaults — visibles solo cuando hay plantillas */}
          {totalCustom > 0 && (
            <div className="mt-5 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {t('Defaults activos')}:
              </span>
              <DefaultPill
                kindLabel={t('Reserva')}
                templateName={reservationDefault?.name}
                set={!!reservationDefault}
              />
              <DefaultPill
                kindLabel={t('Entrega')}
                templateName={deliveryDefault?.name}
                set={!!deliveryDefault}
              />
            </div>
          )}
        </div>
      </header>

      <ContractTemplatesList
        initialTemplates={templates}
        kennelId={kennel.id}
        kennelName={kennel.name}
      />
    </div>
  )
}

/** Pill que muestra qué plantilla es default para un kind (o "Sin
 *  asignar" si ninguno está marcado). */
function DefaultPill({
  kindLabel, templateName, set,
}: { kindLabel: string; templateName: string | undefined; set: boolean }) {
  if (!set) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-amber-300 bg-amber-50/50 px-2.5 py-1 text-[11.5px] text-amber-800">
        <span className="font-bold">{kindLabel}:</span>
        <span className="italic">Sin asignar</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FE6620]/10 border border-[#FE6620]/30 px-2.5 py-1 text-[11.5px] text-[#FE6620] font-medium">
      <span className="font-bold">{kindLabel}:</span>
      <span className="truncate max-w-[140px]">{templateName}</span>
    </span>
  )
}
