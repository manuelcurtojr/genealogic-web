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
import { listContractTemplatesForUser } from '@/lib/contracts/templates-actions'
import ContractTemplatesList from '@/components/contracts/templates-list'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Plantillas de contrato · Genealogic' }

export default async function ContratosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
          Plantillas de contrato
        </p>
        <h1 className="mt-1 text-[28px] sm:text-[34px] font-semibold tracking-[-0.03em] text-ink leading-tight">
          Necesitas un criadero
        </h1>
        <p className="mt-3 text-[14.5px] text-body leading-snug max-w-prose">
          Las plantillas de contrato son recursos del criadero. Crea tu kennel
          desde <a href="/kennel" className="text-ink underline">Mi criadero</a> y
          vuelve a esta sección.
        </p>
      </div>
    )
  }

  const templates = await listContractTemplatesForUser()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12 space-y-8 sm:space-y-10">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
          Pipeline
        </p>
        <div className="mt-1 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-[-0.03em] text-ink leading-tight">
              Plantillas de contrato
            </h1>
            <p className="mt-2 text-[14.5px] text-body leading-snug max-w-prose">
              Tus modelos reusables. Cuando crees un contrato para una reserva
              podrás partir de cualquiera de estos en lugar de empezar desde cero.
            </p>
          </div>
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
